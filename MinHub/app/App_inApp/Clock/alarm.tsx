import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type RecurrencePattern = 'once' | 'daily' | 'weekdays' | 'weekends' | 'custom';

type VibrationPattern = 'none' | 'gentle' | 'normal' | 'strong' | 'pulse';

type Alarm = {
  id: string;
  name: string;
  time: Date | null;
  active: boolean;
  lastTriggered?: Date | null;
  recurrence: RecurrencePattern;
  customDays?: boolean[];
  vibrationPattern: VibrationPattern;
  smartWakeUp: boolean;
  smartWindow: number; 
  snoozeEnabled: boolean;
  snoozeDuration: number; 
  snoozeCount: number;
  maxSnoozes: number;
  isSnoozing: boolean;
  snoozeUntil?: Date;
};

const ALARM_STORAGE_KEY = '@alarmClock_alarms_v2';
const SETTINGS_STORAGE_KEY = '@alarmClock_settings_v1';

type AlarmSettings = {
  defaultSnoozeDuration: number;
  defaultMaxSnoozes: number;
  defaultSmartWindow: number;
};

export function useAlarms() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [settings, setSettings] = useState<AlarmSettings>({
    defaultSnoozeDuration: 9,
    defaultMaxSnoozes: 3,
    defaultSmartWindow: 30,
  });
  const [isRinging, setIsRinging] = useState(false);
  const [currentAlarmId, setCurrentAlarmId] = useState<string | null>(null);
  
  const vibrationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadAlarmsFromStorage();
    loadSettingsFromStorage();
  }, []);

  useEffect(() => {
    if (alarms.length > 0) {
      saveAlarmsToStorage();
    }
  }, [alarms]);

  useEffect(() => {
    saveSettingsToStorage();
  }, [settings]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkAlarms();
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms]);

  useEffect(() => {
    registerForPushNotificationsAsync();

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { 
        alarmId?: string; 
        action?: 'dismiss' | 'snooze' 
      };
      
      if (data.alarmId) {
        if (data.action === 'snooze') {
          snoozeAlarm(data.alarmId);
        } else {
          dismissAlarm(data.alarmId);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    return () => {
      if (vibrationIntervalRef.current) {
        clearInterval(vibrationIntervalRef.current);
      }
    };
  }, []);

  const loadSettingsFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const saveSettingsToStorage = async () => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const loadAlarmsFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(ALARM_STORAGE_KEY);
      if (stored) {
        const parsed: Alarm[] = JSON.parse(stored).map((alarm: any) => ({
          ...alarm,
          time: alarm.time ? new Date(alarm.time) : null,
          lastTriggered: alarm.lastTriggered ? new Date(alarm.lastTriggered) : null,
          snoozeUntil: alarm.snoozeUntil ? new Date(alarm.snoozeUntil) : undefined,
        }));

        const sorted = parsed.sort((a, b) => {
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.getTime() - b.time.getTime();
        });

        setAlarms(sorted);
      }
    } catch (err) {
      console.error('Failed to load alarms:', err);
    }
  };

  const saveAlarmsToStorage = async () => {
    try {
      await AsyncStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarms));
    } catch (err) {
      console.error('Failed to save alarms:', err);
    }
  };

  const shouldAlarmTrigger = (alarm: Alarm, now: Date): boolean => {
    if (!alarm.active || !alarm.time) return false;

    if (alarm.isSnoozing && alarm.snoozeUntil) {
      return now >= alarm.snoozeUntil;
    }

    const alarmHour = alarm.time.getHours();
    const alarmMinute = alarm.time.getMinutes();
    const nowHour = now.getHours();
    const nowMinute = now.getMinutes();
    const nowSecond = now.getSeconds();

    if (alarmHour !== nowHour || alarmMinute !== nowMinute || nowSecond !== 0) {
      return false;
    }

    if (alarm.lastTriggered) {
      const timeSinceLastTrigger = now.getTime() - alarm.lastTriggered.getTime();
      if (timeSinceLastTrigger < 60 * 1000) return false; 
    }

    const dayOfWeek = now.getDay(); 

    switch (alarm.recurrence) {
      case 'once':
        return true;
      case 'daily':
        return true;
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'weekends':
        return dayOfWeek === 0 || dayOfWeek === 6;
      case 'custom':
        return alarm.customDays ? alarm.customDays[dayOfWeek] : false;
      default:
        return false;
    }
  };

  const checkAlarms = () => {
    const now = new Date();

    const updatedAlarms = alarms.map((alarm) => {
      if (shouldAlarmTrigger(alarm, now)) {
        triggerAlarm(alarm);
        
        let newAlarm = { ...alarm, lastTriggered: now };
        
        if (alarm.isSnoozing) {
          newAlarm = {
            ...newAlarm,
            isSnoozing: false,
            snoozeUntil: undefined,
          };
        }
        
        if (alarm.recurrence === 'once') {
          newAlarm.active = false;
        }
        
        return newAlarm;
      }
      return alarm;
    });

    setAlarms(updatedAlarms);
  };

  const startVibration = (pattern: VibrationPattern) => {
    if (pattern === 'none') return;

    const vibrate = () => {
      switch (pattern) {
        case 'gentle':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'normal':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'strong':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'pulse':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
          break;
      }
    };

    vibrate();
    vibrationIntervalRef.current = setInterval(vibrate, 2000);
  };

  const stopVibration = () => {
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
  };

  const triggerAlarm = async (alarm: Alarm) => {
    setIsRinging(true);
    setCurrentAlarmId(alarm.id);
    startVibration(alarm.vibrationPattern);
    await sendNotification(alarm);
  };

  const sendNotification = async (alarm: Alarm) => {
    const actions = [];
    
    if (alarm.snoozeEnabled && alarm.snoozeCount < alarm.maxSnoozes) {
      actions.push({
        identifier: 'snooze',
        buttonTitle: `Snooze ${alarm.snoozeDuration}min`,
        options: { opensAppToForeground: false },
      });
    }
    
    actions.push({
      identifier: 'dismiss',
      buttonTitle: 'Dismiss',
      options: { opensAppToForeground: false },
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Alarm',
        body: `${alarm.name} is ringing!`,
        data: { alarmId: alarm.id },
        categoryIdentifier: 'alarm',
      },
      trigger: null,
    });
  };

  const snoozeAlarm = (alarmId: string) => {
    const alarm = alarms.find(a => a.id === alarmId);
    if (!alarm || !alarm.snoozeEnabled || alarm.snoozeCount >= alarm.maxSnoozes) {
      return dismissAlarm(alarmId);
    }

    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + alarm.snoozeDuration);

    const updatedAlarms = alarms.map(a => 
      a.id === alarmId 
        ? { 
            ...a, 
            isSnoozing: true, 
            snoozeUntil,
            snoozeCount: a.snoozeCount + 1 
          }
        : a
    );
    
    setAlarms(updatedAlarms);
    stopAlarm();
  };

  const dismissAlarm = (alarmId: string) => {
    const updatedAlarms = alarms.map(a => 
      a.id === alarmId 
        ? { 
            ...a, 
            isSnoozing: false, 
            snoozeUntil: undefined,
            snoozeCount: 0
          }
        : a
    );
    
    setAlarms(updatedAlarms);
    stopAlarm();
  };

  const stopAlarm = async () => {
    stopVibration();
    setIsRinging(false);
    setCurrentAlarmId(null);
  };

  const handleAddOrUpdateAlarm = (
    editingAlarmId: string | null,
    alarmData: Partial<Alarm>
  ) => {
    if (editingAlarmId) {
      const updatedAlarms = alarms.map((alarm) =>
        alarm.id === editingAlarmId
          ? { ...alarm, ...alarmData }
          : alarm
      );
      setAlarms(updatedAlarms);
    } else {

      const newAlarm: Alarm = {
        id: Date.now().toString(),
        name: alarmData.name || 'Wake Up',
        time: alarmData.time || null,
        active: true,
        recurrence: alarmData.recurrence || 'once',
        customDays: alarmData.customDays || [false, false, false, false, false, false, false],
        vibrationPattern: alarmData.vibrationPattern || 'normal',
        smartWakeUp: alarmData.smartWakeUp || false,
        smartWindow: alarmData.smartWindow || settings.defaultSmartWindow,
        snoozeEnabled: alarmData.snoozeEnabled !== false,
        snoozeDuration: alarmData.snoozeDuration || settings.defaultSnoozeDuration,
        snoozeCount: 0,
        maxSnoozes: alarmData.maxSnoozes || settings.defaultMaxSnoozes,
        isSnoozing: false,
      };
      
      const updatedAlarms = [...alarms, newAlarm].sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.getTime() - b.time.getTime();
      });
      
      setAlarms(updatedAlarms);
    }
  };

  const handleToggleAlarm = (id: string) => {
    const updated = alarms.map((a) =>
      a.id === id 
        ? { 
            ...a, 
            active: !a.active,
            snoozeCount: 0,
            isSnoozing: false,
            snoozeUntil: undefined 
          } 
        : a
    );
    setAlarms(updated);
  };

  const handleDeleteAlarm = (id: string) => {
    if (currentAlarmId === id) {
      stopAlarm();
    }
    const updated = alarms.filter((a) => a.id !== id);
    setAlarms(updated);
  };

  const updateSettings = (newSettings: Partial<AlarmSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const registerForPushNotificationsAsync = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for notifications!');
      }
    }

    await Notifications.setNotificationCategoryAsync('alarm', [
      {
        identifier: 'snooze',
        buttonTitle: 'Snooze',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: { opensAppToForeground: false },
      },
    ]);

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  };

  return {
    alarms,
    settings,
    isRinging,
    currentAlarmId,
    handleAddOrUpdateAlarm,
    handleToggleAlarm,
    handleDeleteAlarm,
    snoozeAlarm,
    dismissAlarm,
    updateSettings,
    stopAlarm,
  };
}

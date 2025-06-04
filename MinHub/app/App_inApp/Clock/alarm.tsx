import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import { Platform, Modal, View, Text, Pressable, StyleSheet } from 'react-native';

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

type SleepEntry = {
  id: string;
  date: Date;
  sleepTime: Date; 
  wakeUpTime: Date;
  durationMinutes: number;
};

type AlarmSettings = {
  defaultSnoozeDuration: number;
  defaultMaxSnoozes: number;
  defaultSmartWindow: number;
};

const ALARM_STORAGE_KEY = '@alarmClock_alarms_v2';
const SETTINGS_STORAGE_KEY = '@alarmClock_settings_v1';
const SLEEP_STORAGE_KEY = '@alarmClock_sleep_data_v1';

interface MessageModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const MessageModal: React.FC<MessageModalProps> = ({ visible, title, message, onClose }) => (
  <Modal
    visible={visible}
    animationType="fade"
    transparent
    onRequestClose={onClose}
  >
    <View style={modalStyles.centeredView}>
      <View style={modalStyles.modalView}>
        <Text style={modalStyles.modalTitle}>{title}</Text>
        <Text style={modalStyles.modalText}>{message}</Text>
        <Pressable
          style={[modalStyles.button, modalStyles.buttonClose]}
          onPress={onClose}
        >
          <Text style={modalStyles.textStyle}>OK</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
);

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ visible, title, message, onConfirm, onCancel }) => (
  <Modal
    visible={visible}
    animationType="fade"
    transparent
    onRequestClose={onCancel}
  >
    <View style={modalStyles.centeredView}>
      <View style={modalStyles.modalView}>
        <Text style={modalStyles.modalTitle}>{title}</Text>
        <Text style={modalStyles.modalText}>{message}</Text>
        <View style={modalStyles.modalButtons}>
          <Pressable
            style={[modalStyles.button, modalStyles.buttonCancel]}
            onPress={onCancel}
          >
            <Text style={modalStyles.textStyle}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[modalStyles.button, modalStyles.buttonConfirm]}
            onPress={onConfirm}
          >
            <Text style={modalStyles.textStyle}>Confirm</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  buttonCancel: {
    backgroundColor: '#f44336',
  },
  buttonConfirm: {
    backgroundColor: '#4CAF50',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

//hooks
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
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageModalContent, setMessageModalContent] = useState({ title: '', message: '' });

  useEffect(() => {
    loadAlarmsFromStorage();
    loadSettingsFromStorage();
  }, []);

  useEffect(() => {
    if (alarms.length > 0 || (alarms.length === 0 && AsyncStorage.getItem(ALARM_STORAGE_KEY) !== null)) {
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

  const showMessage = useCallback((title: string, message: string) => {
    setMessageModalContent({ title, message });
    setMessageModalVisible(true);
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

    const dayOfWeek = now.getDay(); // 0 = sunday,  6 = saturday

    
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
        data: { alarmId: alarm.id, action: 'ring' }, 
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
    await Notifications.cancelAllScheduledNotificationsAsync();
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
        isSnoozing: false,
        maxSnoozes: alarmData.maxSnoozes || settings.defaultMaxSnoozes,
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
        showMessage('Notification Permission', 'Failed to get push token for notifications! Alarm notifications may not work.');
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
    messageModalVisible,
    messageModalContent,
    setMessageModalVisible,
  };
}

//hook sleepdata
export function useSleepData() {
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageModalContent, setMessageModalContent] = useState({ title: '', message: '' });

  useEffect(() => {
    loadSleepEntriesFromStorage();
  }, []);

  useEffect(() => {
    if (sleepEntries.length > 0 || (sleepEntries.length === 0 && AsyncStorage.getItem(SLEEP_STORAGE_KEY) !== null)) {
      saveSleepEntriesToStorage();
    }
  }, [sleepEntries]);

  const showMessage = useCallback((title: string, message: string) => {
    setMessageModalContent({ title, message });
    setMessageModalVisible(true);
  }, []);

  const loadSleepEntriesFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(SLEEP_STORAGE_KEY);
      if (stored) {
        const parsed: SleepEntry[] = JSON.parse(stored).map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          sleepTime: new Date(entry.sleepTime),
          wakeUpTime: new Date(entry.wakeUpTime),
        }));
        setSleepEntries(parsed.sort((a, b) => b.date.getTime() - a.date.getTime())); 
      }
    } catch (err) {
      console.error('Failed to load sleep entries:', err);
    }
  };

  const saveSleepEntriesToStorage = async () => {
    try {
      await AsyncStorage.setItem(SLEEP_STORAGE_KEY, JSON.stringify(sleepEntries));
    } catch (err) {
      console.error('Failed to save sleep entries:', err);
    }
  };

  const addSleepEntry = (date: Date, sleepTime: Date, wakeUpTime: Date) => {
    const durationMs = wakeUpTime.getTime() - sleepTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    if (durationMinutes <= 0) {
      showMessage('Invalid Times', 'Wake up time must be after sleep time.');
      return;
    }

    const newEntry: SleepEntry = {
      id: Date.now().toString(), 
      date,
      sleepTime,
      wakeUpTime,
      durationMinutes,
    };

    setSleepEntries(prev => [...prev, newEntry].sort((a, b) => b.date.getTime() - a.date.getTime()));
    showMessage('Success', 'Sleep entry added successfully!');
  };

  const deleteSleepEntry = (id: string) => {
    setSleepEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const calculateSmartWakeUpSuggestion = useCallback(() => {
    if (sleepEntries.length === 0) {
      return "No sleep data available to suggest a smart wake-up time.";
    }
  
    const totalDuration = sleepEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
    const averageDuration = totalDuration / sleepEntries.length;

    const typicalBedtimeHour = 22; 
    const typicalBedtimeMinute = 0;

    const suggestedWakeUpTime = new Date();
    suggestedWakeUpTime.setHours(typicalBedtimeHour);
    suggestedWakeUpTime.setMinutes(typicalBedtimeMinute + averageDuration);
    suggestedWakeUpTime.setSeconds(0);
    suggestedWakeUpTime.setMilliseconds(0);

    return `Based on your average sleep of ${averageDuration.toFixed(0)} minutes, a suggested wake-up time might be around ${suggestedWakeUpTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
  }, [sleepEntries]);


  return {
    sleepEntries,
    addSleepEntry,
    deleteSleepEntry,
    calculateSmartWakeUpSuggestion,
    messageModalVisible,
    messageModalContent,
    setMessageModalVisible,
  };
}

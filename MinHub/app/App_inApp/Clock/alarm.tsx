  import { useState, useEffect } from 'react';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { Audio } from 'expo-av';
  import * as Notifications from 'expo-notifications';
  import * as Device from 'expo-device';
  import { Platform } from 'react-native';


  type Alarm = {
    id: string;
    name: string;
    time: Date | null;
    active: boolean;
    lastTriggered?: Date | null;
  };


  const ALARM_STORAGE_KEY = '@alarmClock_alarms_v1';

  export function useAlarms() {
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [sound, setSound] = useState<any>(null);

    // Load and save alarms to AsyncStorage
    useEffect(() => {
      loadAlarmsFromStorage();
    }, []);

    useEffect(() => {
      saveAlarmsToStorage();
    }, [alarms]);

    // Load sound
    useEffect(() => {
      loadSound();
    }, []);

    useEffect(() => {
      const interval = setInterval(() => {
        checkAlarms();
      }, 1000); // Check every second
    
      return () => clearInterval(interval); // Cleanup on unmount
    }, [alarms]);
    
    useEffect(() => {
      registerForPushNotificationsAsync();
    
      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data as { alarmId?: string };
        const alarmId = data.alarmId;
        if (alarmId) {
          deactivateAlarmById(alarmId);
        }
      });      
    
      return () => {
        subscription.remove();
      };
    }, []);
    

    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/audio/ringtone.mp3')
      );
      setSound(sound);
    };

    const playSound = async () => {
      await sound.playAsync();
    };

    async function loadAlarmsFromStorage() {
      try {
        const stored = await AsyncStorage.getItem(ALARM_STORAGE_KEY);
        if (stored) {
          const parsed: Alarm[] = JSON.parse(stored).map((alarm: any) => ({
            ...alarm,
            time: alarm.time ? new Date(alarm.time) : null,
            lastTriggered: alarm.lastTriggered ? new Date(alarm.lastTriggered) : null,
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
    }

    async function saveAlarmsToStorage(data: Alarm[] = alarms) {
      try {
        await AsyncStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.error('Failed to save alarms:', err);
      }
    }

    function handleAddOrUpdateAlarm(
      editingAlarmId: string | null,
      alarmName: string,
      alarmTime: Date | null
    ) {
      if (editingAlarmId) {
        // Update existing alarm
        const updatedAlarms = alarms.map((alarm) =>
          alarm.id === editingAlarmId
            ? { ...alarm, name: alarmName, time: alarmTime }
            : alarm
        );
        setAlarms(updatedAlarms);
      } else {
        // Add new alarm
        const newAlarm: Alarm = {
          id: Date.now().toString(),
          name: alarmName || 'Wake Up',
          time: alarmTime,
          active: true,
        };
        const updatedAlarms = [...alarms, newAlarm].sort((a, b) => {
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.getTime() - b.time.getTime();
        });
        setAlarms(updatedAlarms);
      }
    }

    function handleToggleAlarm(id: string) {
      const updated = alarms.map((a) =>
        a.id === id ? { ...a, active: !a.active } : a
      );
      setAlarms(updated);
    }

    function handleDeleteAlarm(id: string) {
      const updated = alarms.filter((a) => a.id !== id);
      setAlarms(updated);
    }

    function checkAlarms() {
      const now = new Date();
    
      const updatedAlarms = alarms.map((alarm) => {
        if (
          alarm.active &&
          alarm.time &&
          alarm.time.getHours() === now.getHours() &&
          alarm.time.getMinutes() === now.getMinutes() &&
          alarm.time.getSeconds() === now.getSeconds()
        ) {
          if (
            !alarm.lastTriggered ||
            now.getTime() - alarm.lastTriggered.getTime() > 60 * 1000
          ) {
            playSound();
            sendNotification(alarm);
            return { ...alarm, lastTriggered: now };
          }
        }
        return alarm;
      });
    
      setAlarms(updatedAlarms);
    }
    

    async function registerForPushNotificationsAsync() {
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
      } else {
        alert('Must use physical device for notifications');
      }
    
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
    
    async function sendNotification(alarm: Alarm) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Alarm',
          body: `${alarm.name} is ringing!`,
          data: { alarmId: alarm.id },
        },
        trigger: null,
      });
    }
    
    function deactivateAlarmById(id: string) {
      const updated = alarms.map((a) =>
        a.id === id ? { ...a, active: false } : a
      );
      setAlarms(updated);
    }
    
    
    

    return {
      alarms,
      handleAddOrUpdateAlarm,
      handleToggleAlarm,
      handleDeleteAlarm,
      checkAlarms,
    };
  }
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

type Alarm = {
  id: string;
  name: string;
  time: Date | null;
  active: boolean;
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
    alarms.forEach((alarm) => {
      if (
        alarm.active &&
        alarm.time &&
        alarm.time.getHours() === now.getHours() &&
        alarm.time.getMinutes() === now.getMinutes() &&
        alarm.time.getSeconds() === now.getSeconds()
      ) {
        playSound();
      }
    });
  }

  return {
    alarms,
    handleAddOrUpdateAlarm,
    handleToggleAlarm,
    handleDeleteAlarm,
    checkAlarms,
  };
}

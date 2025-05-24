import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

export default function WaterReminder() {
  const [isActive, setIsActive] = useState(false);
  const [intervalHours, setIntervalHours] = useState(2);
  const [nextReminder, setNextReminder] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const intervalKey = 'reminderInterval';
  const activeKey = 'reminderIsActive';
  const nextKey = 'nextReminder';

  useEffect(() => {
    const loadSettings = async () => {
      const storedInterval = await AsyncStorage.getItem(intervalKey);
      const storedActive = await AsyncStorage.getItem(activeKey);
      const storedNext = await AsyncStorage.getItem(nextKey);

      if (storedInterval) setIntervalHours(Number(storedInterval));
      if (storedActive === 'true') setIsActive(true);
      if (storedNext) setNextReminder(new Date(storedNext));
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && isActive && nextReminder) {
        if (new Date() >= nextReminder) {
          showReminder();
          scheduleNextReminder();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isActive, nextReminder]);

  useEffect(() => {
    if (isActive) {
      showReminder();
      scheduleNextReminder();

      const intervalMs = intervalHours * 60 * 60 * 1000;
      intervalRef.current = setInterval(() => {
        showReminder();
        scheduleNextReminder();
      }, intervalMs) as unknown as NodeJS.Timeout;

      AsyncStorage.setItem(activeKey, 'true');
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      AsyncStorage.setItem(activeKey, 'false');
      AsyncStorage.removeItem(nextKey);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, intervalHours]);

  const showReminder = () => {
    Alert.alert('💧 Time to drink water!', 'Stay hydrated. Drink a glass of water now!');
  };

  const scheduleNextReminder = () => {
    const now = new Date();
    const next = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);
    setNextReminder(next);
    AsyncStorage.setItem(nextKey, next.toISOString());
  };

  const startReminders = async () => {
    await AsyncStorage.setItem(intervalKey, intervalHours.toString());
    setIsActive(true);
  };

  const stopReminders = () => {
    setIsActive(false);
    setNextReminder(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💧 Water Reminder</Text>

      <Text style={styles.description}>
        {isActive
          ? `Next reminder at: ${nextReminder?.toLocaleTimeString() || 'calculating...'}`
          : 'Press start to get reminders'}
      </Text>

      {!isActive && (
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Reminder interval (hours):</Text>
          <Picker
            selectedValue={intervalHours}
            onValueChange={(itemValue) => setIntervalHours(itemValue)}
            style={styles.picker}
          >
            {[...Array(12)].map((_, i) => (
              <Picker.Item key={i} label={`${i + 1} hour${i ? 's' : ''}`} value={i + 1} />
            ))}
          </Picker>
        </View>
      )}

      <Button
        title={isActive ? 'Reminders Active' : 'Start Reminders'}
        onPress={startReminders}
        disabled={isActive}
      />

      {isActive && (
        <View style={{ marginTop: 10 }}>
          <Button title="Stop Reminders" onPress={stopReminders} color="red" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  pickerContainer: {
    marginBottom: 20,
    width: '80%',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
  },
});
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Alert, AppState } from 'react-native';

export default function WaterReminder() {
  const [isActive, setIsActive] = useState(false);
  const [nextReminder, setNextReminder] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && isActive) {
        if (nextReminder && new Date() >= nextReminder) {
          showReminder();
          scheduleNextReminder();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, nextReminder]);

  useEffect(() => {
    if (isActive) {
      showReminder();
      scheduleNextReminder();
      
      // Properly type the interval
      intervalRef.current = setInterval(() => {
        showReminder();
        scheduleNextReminder();
      }, 2 * 60 * 60 * 1000) as unknown as NodeJS.Timeout;
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const showReminder = () => {
    Alert.alert(
      '💧 Time to drink water!',
      'Stay hydrated. Drink a glass of water now!',
      [{ text: 'OK', onPress: () => console.log('Reminder acknowledged') }]
    );
  };

  const scheduleNextReminder = () => {
    const now = new Date();
    const nextTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    setNextReminder(nextTime);
  };

  const startReminders = () => {
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
          : 'Press start to get reminders every 2 hours'}
      </Text>
      
      <Button 
        title={isActive ? "Reminders Active" : "Start Reminders"} 
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
});
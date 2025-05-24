import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function WaterReminder() {
  const [isActive, setIsActive] = useState(false);
  const [nextReminder, setNextReminder] = useState<Date | null>(null);
  const [drinkProgress, setDrinkProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigation = useNavigation();

  const DRINK_PROGRESS_KEY = 'drinkProgress';
  const LAST_DRINK_DATE_KEY = 'lastDrinkDate';
  const HISTORY_KEY = 'waterIntakeHistory';

  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Load progress and reset at midnight
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const savedProgress = await AsyncStorage.getItem(DRINK_PROGRESS_KEY);
        const savedDate = await AsyncStorage.getItem(LAST_DRINK_DATE_KEY);
        const today = getTodayDateString();

        if (savedDate !== today) {
          setDrinkProgress(0);
          await AsyncStorage.setItem(LAST_DRINK_DATE_KEY, today);
        } else if (savedProgress !== null) {
          setDrinkProgress(Number(savedProgress));
        }
      } catch (e) {
        console.error('Failed to load drink progress:', e);
      }
    };
    loadProgress();
  }, []);

  // Save progress daily
  useEffect(() => {
    const saveProgress = async () => {
      try {
        await AsyncStorage.setItem(DRINK_PROGRESS_KEY, drinkProgress.toString());
        await AsyncStorage.setItem(LAST_DRINK_DATE_KEY, getTodayDateString());
      } catch (e) {
        console.error('Failed to save drink progress:', e);
      }
    };
    saveProgress();
  }, [drinkProgress]);

  // Handle app state change to check reminder
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

  // Set interval to show reminder every 2 hours when active
  useEffect(() => {
    if (isActive) {
      showReminder();
      scheduleNextReminder();

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

  // Log water intake timestamp into history
  const logWaterIntake = async () => {
    try {
      const now = new Date().toISOString();
      const historyRaw = await AsyncStorage.getItem(HISTORY_KEY);
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      history.push(now);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to log water intake:', e);
    }
  };

  const handleDrink = () => {
    setDrinkProgress((prev) => Math.min(prev + 20, 100));
    logWaterIntake();
  };

  const goToHistory = () => {
    navigation.navigate('WaterIntakeHistory' as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💧 Water Reminder</Text>
      <Text style={styles.description}>
        {isActive
          ? `Next reminder at: ${
              nextReminder?.toLocaleTimeString() || 'calculating...'
            }`
          : 'Press start to get reminders every 2 hours'}
      </Text>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${drinkProgress}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {drinkProgress === 100 ? '🎉 Good Job!' : `Hydration: ${drinkProgress}%`}
      </Text>

      <Button title="Just Drank 💧" onPress={handleDrink} />

      <View style={{ marginTop: 20 }}>
        <Button
          title={isActive ? 'Reminders Active' : 'Start Reminders'}
          onPress={startReminders}
          disabled={isActive}
        />
      </View>

      {isActive && (
        <View style={{ marginTop: 10 }}>
          <Button title="Stop Reminders" onPress={stopReminders} color="red" />
        </View>
      )}

      <View style={{ marginTop: 20 }}>
        <Button title="📈 Water Intake History" onPress={goToHistory} />
      </View>
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
  progressContainer: {
    width: '80%',
    height: 20,
    backgroundColor: '#eee',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
});
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Button, StyleSheet, Alert,
  AppState, TouchableOpacity, ProgressBarAndroid
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';

export default function WaterReminder() {
  const [isActive, setIsActive] = useState(false);
  const [nextReminder, setNextReminder] = useState<Date | null>(null);
  const [progressCount, setProgressCount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(5);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    loadGoal();
    loadProgress();
  }, [isFocused]);

  useEffect(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      setProgressCount(0);
      saveProgress(0);
    }, timeUntilMidnight);

    return () => clearTimeout(timeout);
  }, [progressCount]);

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
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, nextReminder]);

  useEffect(() => {
    if (isActive) {
      showReminder();
      scheduleNextReminder();
      intervalRef.current = setInterval(() => {
        showReminder();
        scheduleNextReminder();
      }, 2 * 60 * 60 * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const showReminder = () => {
    Alert.alert('💧 Time to drink water!', 'Stay hydrated. Drink a glass of water now!', [
      { text: 'OK', onPress: () => console.log('Reminder acknowledged') }
    ]);
  };

  const scheduleNextReminder = () => {
    const now = new Date();
    const nextTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    setNextReminder(nextTime);
  };

  const saveProgress = async (value: number) => {
    try {
      await AsyncStorage.setItem('hydrationProgress', value.toString());
    } catch (err) {
      console.error('Failed to save progress', err);
    }
  };

  const loadProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem('hydrationProgress');
      if (stored) setProgressCount(parseInt(stored));
    } catch (err) {
      console.error('Failed to load progress', err);
    }
  };

  const saveGoal = async (goal: number) => {
    try {
      await AsyncStorage.setItem('dailyGoal', goal.toString());
    } catch (err) {
      console.error('Failed to save goal', err);
    }
  };

  const loadGoal = async () => {
    try {
      const stored = await AsyncStorage.getItem('dailyGoal');
      if (stored) setDailyGoal(parseInt(stored));
    } catch (err) {
      console.error('Failed to load goal', err);
    }
  };

  const handleJustDrank = () => {
    const newCount = progressCount + 1;
    setProgressCount(newCount);
    saveProgress(newCount);
  };

  const progressRatio = Math.min(progressCount / dailyGoal, 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💧 Water Reminder</Text>

      <Text style={styles.description}>
        {isActive
          ? `Next reminder at: ${nextReminder?.toLocaleTimeString() || 'calculating...'}`
          : 'Press start to get reminders every 2 hours'}
      </Text>

      <Button
        title={isActive ? 'Reminders Active' : 'Start Reminders'}
        onPress={() => setIsActive(true)}
        disabled={isActive}
      />

      {isActive && (
        <View style={{ marginTop: 10 }}>
          <Button title="Stop Reminders" onPress={() => {
            setIsActive(false);
            setNextReminder(null);
          }} color="red" />
        </View>
      )}

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {progressCount >= dailyGoal ? '🎉 Good Job!' : `${progressCount}/${dailyGoal} glasses`}
        </Text>
        <ProgressBarAndroid
          styleAttr="Horizontal"
          indeterminate={false}
          progress={progressRatio}
          color="#00BFFF"
          style={styles.progressBar}
        />
      </View>

      <Button title="Just Drank" onPress={handleJustDrank} />

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('GoalSettings' as never)}
      >
        <Text style={styles.linkText}>⚙️ Set Daily Goal</Text>
      </TouchableOpacity>
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
    marginTop: 30,
    width: '100%',
    paddingHorizontal: 20,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 18,
  },
  progressBar: {
    height: 10,
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
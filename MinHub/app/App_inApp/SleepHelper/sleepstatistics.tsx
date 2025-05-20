import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'SLEEP_LOGS';

export default function SleepStatistics() {
  const [totalHours, setTotalHours] = useState(0);
  const [averageHours, setAverageHours] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const numericHours: number[] = data
        .map((entry: { hours: string }) => parseFloat(entry.hours))
        .filter((h: number): h is number => !isNaN(h));
        const total = numericHours.reduce((sum: number, h: number) => sum + h, 0);
        const average = numericHours.length > 0 ? total / numericHours.length : 0;
        setTotalHours(total);
        setAverageHours(average);
      }
    };
    loadStats();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Weekly Statistics</Text>
      <Text>Total hours slept: {totalHours.toFixed(1)}</Text>
      <Text>Average per day: {averageHours.toFixed(1)} hrs</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
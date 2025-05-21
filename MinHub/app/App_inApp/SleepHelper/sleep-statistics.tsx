import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'SLEEP_LOGS';
const IDEAL_SLEEP = 8;

type SleepLog = {
  day: string;
  hours: string;
};

type WeekData = Record<string, SleepLog[]>;

export default function SleepStatisticsScreen() {
  const [weeklySummaries, setWeeklySummaries] = useState<
    { week: string; total: number; debt: number; daily: { day: string; slept: number; debt: number }[] }[]
  >([]);

  useEffect(() => {
    const loadStats = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const parsed: WeekData = JSON.parse(stored);
      const summaries = Object.entries(parsed).map(([week, logs]) => {
        const daily = logs.map(entry => {
          const slept = parseFloat(entry.hours);
          const validSlept = isNaN(slept) ? 0 : slept;
          const debt = Math.max(0, IDEAL_SLEEP - validSlept);
          return {
            day: entry.day,
            slept: validSlept,
            debt,
          };
        });

        const total = daily.reduce((sum, d) => sum + d.slept, 0);
        const debt = daily.reduce((sum, d) => sum + d.debt, 0);

        return { week, total, debt, daily };
      });

      setWeeklySummaries(summaries);
    };

    loadStats();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Sleep Debt Breakdown</Text>
      {weeklySummaries.map(summary => (
        <View key={summary.week} style={styles.weekCard}>
          <Text style={styles.weekHeader}>{summary.week}</Text>
          <Text>Total Slept: {summary.total.toFixed(1)}h</Text>
          <Text>Total Debt: {summary.debt.toFixed(1)}h</Text>
          <Text style={styles.subHeader}>Daily Breakdown:</Text>
          {summary.daily.map((d, index) => (
            <Text key={index}>
              {d.day} – Slept {d.slept}h (Debt: {d.debt}h)
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 10,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  weekCard: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
  },
  weekHeader: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subHeader: {
    marginTop: 10,
    fontWeight: '600',
  },
});

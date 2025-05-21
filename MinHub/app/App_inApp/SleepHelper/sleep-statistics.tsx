import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSleep } from './SleepContext'; 

const IDEAL_SLEEP = 8;

export default function SleepStatisticsScreen() {
  const { allSleepData } = useSleep();

  const [sleepDebtByWeek, setSleepDebtByWeek] = useState<
    { week: string; totalHours: number; average: number; debt: number }[]
  >([]);

  useEffect(() => {
    const calculateStats = () => {
      const results: {
        week: string;
        totalHours: number;
        average: number;
        debt: number;
      }[] = [];

      for (const [week, logs] of Object.entries(allSleepData)) {
        const numericHours = logs
          .map((entry) => parseFloat(entry.hours))
          .filter((h) => !isNaN(h));

        if (numericHours.length === 0) continue;

        const total = numericHours.reduce((sum, h) => sum + h, 0);
        const average = total / numericHours.length;
        const debt = Math.max(0, IDEAL_SLEEP * 7 - total);

        results.push({
          week,
          totalHours: total,
          average,
          debt,
        });
      }

      results.sort((a, b) => (a.week > b.week ? -1 : 1));
      setSleepDebtByWeek(results);
    };

    calculateStats();
  }, [allSleepData]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Sleep Debt Breakdown</Text>
      {sleepDebtByWeek.length === 0 ? (
        <Text>No data available</Text>
      ) : (
        sleepDebtByWeek.map((weekData) => (
          <View key={weekData.week} style={styles.card}>
            <Text style={styles.week}>Week: {weekData.week}</Text>
            <Text>Total hours slept: {weekData.totalHours.toFixed(1)}</Text>
            <Text>Average per day: {weekData.average.toFixed(1)} hrs</Text>
            <Text>Sleep debt: {weekData.debt.toFixed(1)} hrs</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#f8f8f8',
  },
  week: {
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 16,
  },
});
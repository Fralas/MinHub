import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'waterIntakeHistory';

type GroupedHistory = {
  [date: string]: string[]; // date string YYYY-MM-DD --> array of ISO timestamps
};

export default function WaterIntakeHistory() {
  const [history, setHistory] = useState<GroupedHistory>({});

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const historyRaw = await AsyncStorage.getItem(HISTORY_KEY);
        if (historyRaw) {
          const entries: string[] = JSON.parse(historyRaw);

          const grouped: GroupedHistory = entries.reduce((acc, isoString) => {
            const date = isoString.split('T')[0];
            if (!acc[date]) acc[date] = [];
            acc[date].push(isoString);
            return acc;
          }, {} as GroupedHistory);

          // Sort dates descending
          const sortedKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

          const sortedGrouped: GroupedHistory = {};
          sortedKeys.forEach((key) => {
            grouped[key].sort();
            sortedGrouped[key] = grouped[key];
          });

          setHistory(sortedGrouped);
        }
      } catch (e) {
        console.error('Failed to load water intake history:', e);
      }
    };
    loadHistory();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📈 Water Intake History</Text>
      {Object.keys(history).length === 0 && (
        <Text style={styles.noData}>No water intake logged yet.</Text>
      )}

      {Object.entries(history).map(([date, times]) => (
        <View key={date} style={styles.dayContainer}>
          <Text style={styles.date}>{date}</Text>
          {times.map((time) => {
            const timeOnly = new Date(time).toLocaleTimeString();
            return (
              <Text key={time} style={styles.time}>
                • {timeOnly}
              </Text>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  noData: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
  },
  dayContainer: {
    marginBottom: 20,
  },
  date: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  time: {
    fontSize: 16,
    marginLeft: 12,
    color: '#555',
  },
});

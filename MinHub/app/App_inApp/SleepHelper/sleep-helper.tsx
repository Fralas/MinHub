import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ScrollView,
  Button,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSleep } from './SleepContext';
import { getISOWeek, getISOWeekYear } from 'date-fns';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const IDEAL_SLEEP = 8;

type SleepLog = {
  day: string;
  hours: string;
};

function getCurrentWeekId(): string {
  const now = new Date();
  const year = getISOWeekYear(now);
  const weekNumber = getISOWeek(now);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

export default function SleepHelper() {
  const { allSleepData, saveSleepLogs } = useSleep();
  const router = useRouter();
  const currentWeekId = getCurrentWeekId();

  const [sleepData, setSleepData] = useState<SleepLog[]>(
    allSleepData[currentWeekId] || daysOfWeek.map(day => ({ day, hours: '' }))
  );

  const [currentWeekStats, setCurrentWeekStats] = useState({
    totalHours: 0,
    average: 0,
    debt: 0,
    logsCount: 0,
  });

  useEffect(() => {
    const dataForCurrentWeek = allSleepData[currentWeekId] || daysOfWeek.map(day => ({ day, hours: '' }));
    setSleepData(dataForCurrentWeek);
  }, [allSleepData, currentWeekId]);

  useEffect(() => {
    const numericHours = sleepData
      .map(entry => parseFloat(entry.hours))
      .filter(h => !isNaN(h));

    const total = numericHours.reduce((sum, h) => sum + h, 0);
    const average = numericHours.length > 0 ? total / numericHours.length : 0;
    const debt = Math.max(0, (IDEAL_SLEEP * daysOfWeek.length) - total);

    setCurrentWeekStats({
      totalHours: total,
      average: average,
      debt: debt,
      logsCount: numericHours.length,
    });
  }, [sleepData]);

  const handleChange = (day: string, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const updatedWeek = sleepData.map(entry =>
      entry.day === day ? { ...entry, hours: numericValue } : entry
    );
    setSleepData(updatedWeek);
  };

  const handleSave = async () => {
    const isValid = sleepData.every(entry => {
      const hours = parseFloat(entry.hours);
      return entry.hours === '' || (!isNaN(hours) && hours >= 0 && hours <= 24);
    });

    if (!isValid) {
      Alert.alert("Invalid Input", "Please enter valid numbers (0-24) for hours slept, or leave empty.");
      return;
    }

    await saveSleepLogs(currentWeekId, sleepData);
    Alert.alert("Success", "Sleep data saved!");
  };

  const renderItem = ({ item }: { item: SleepLog }) => (
    <View style={styles.card}>
      <Text style={styles.dayText}>{item.day}</Text>
      <Text style={styles.label}>Hours slept:</Text>
      <TextInput
        value={item.hours}
        onChangeText={(value) => handleChange(item.day, value)}
        keyboardType="numeric"
        style={styles.input}
        placeholder="e.g., 7.5"
        maxLength={4}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsButtonContainer}>
        <Button
          title="View Historical Statistics"
          onPress={() => router.push('/App_inApp/SleepHelper/sleep-statistics')}
        />
      </View>

      <Text style={styles.weekText}>Current Week: {currentWeekId}</Text>

      <View style={styles.currentWeekStatsCard}>
        <Text style={styles.statsHeader}>This Week's Summary ({currentWeekStats.logsCount} days logged)</Text>
        <Text style={styles.statsText}>Total hours slept: {currentWeekStats.totalHours.toFixed(1)}</Text>
        <Text style={styles.statsText}>Average per day: {currentWeekStats.average.toFixed(1)} hrs</Text>
        <Text style={styles.statsText}>Sleep debt: {currentWeekStats.debt.toFixed(1)} hrs</Text>
      </View>

      <View style={styles.saveButtonContainer}>
        <Button title="Save Sleep Data" onPress={handleSave} />
      </View>

      <FlatList
        data={sleepData}
        keyExtractor={(item) => item.day}
        renderItem={renderItem}
        scrollEnabled={false}
        contentContainerStyle={styles.list}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  statsButtonContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  weekText: {
    fontSize: 16,
    marginVertical: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButtonContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    borderWidth: 2,
    borderColor: '#000',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  dayText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 4,
    padding: 8,
    borderRadius: 6,
    fontSize: 16,
  },
  currentWeekStatsCard: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#388E3C',
  },
  statsText: {
    fontSize: 15,
    marginBottom: 4,
    color: '#4CAF50',
  },
});

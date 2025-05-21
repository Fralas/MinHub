import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ScrollView, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const STORAGE_KEY = 'SLEEP_LOGS';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type SleepLog = {
  day: string;
  hours: string;
};

type WeekData = Record<string, SleepLog[]>;

function getCurrentWeekId(): string {
  const now = new Date();
  const firstJan = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now.getTime() - firstJan.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstJan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

export default function SleepHelper() {
  const [sleepData, setSleepData] = useState<SleepLog[]>([]);
  const router = useRouter();
  const [allData, setAllData] = useState<WeekData>({});
  const currentWeekId = getCurrentWeekId();

  useEffect(() => {
    const loadData = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: WeekData = JSON.parse(stored);
        setAllData(parsed);
        setSleepData(parsed[currentWeekId] || daysOfWeek.map(day => ({ day, hours: '' })));
      } else {
        setSleepData(daysOfWeek.map(day => ({ day, hours: '' })));
      }
    };
    loadData();
  }, []);

  const handleChange = async (day: string, value: string) => {
    const updatedWeek = sleepData.map(entry =>
      entry.day === day ? { ...entry, hours: value } : entry
    );
    setSleepData(updatedWeek);

    const updatedAllData = {
      ...allData,
      [currentWeekId]: updatedWeek,
    };
    setAllData(updatedAllData);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAllData));
  };

  const handleSave = async () => {
    const updatedAllData = {
      ...allData,
      [currentWeekId]: sleepData,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAllData));
    setAllData(updatedAllData);
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
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsButtonContainer}>
        <Button
          title="View Statistics"
          onPress={() => router.push("/App_inApp/SleepHelper/sleep-statistics")}
        />
      </View>

      <Text style={styles.weekText}>Week: {currentWeekId}</Text>

      {/* Moved Save Button Up */}
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
    marginTop: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  weekText: {
    fontSize: 16,
    marginVertical: 10,
    fontWeight: 'bold',
  },
  saveButtonContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
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
  },
});

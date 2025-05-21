import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ScrollView,
  Button,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const STORAGE_KEY = 'SLEEP_LOGS';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type SleepLog = {
  day: string;
  hours: string;
};

type WeekData = Record<string, SleepLog[]>;

//Helper to get current ISO-like week identifier
function getWeekId(): string {
  const now = new Date();
  const year = now.getFullYear();

  const janFirst = new Date(year, 0, 1);
  const daysSinceStart = Math.floor(
    (now.getTime() - janFirst.getTime()) / (24 * 60 * 60 * 1000)
  );
  const week = Math.ceil((daysSinceStart + janFirst.getDay() + 1) / 7);

  return `${year}-W${week.toString().padStart(2, '0')}`;
}

export default function SleepHelper() {
  const [sleepData, setSleepData] = useState<SleepLog[]>([]);
  const [currentWeekId, setCurrentWeekId] = useState(getWeekId());
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const weekId = getWeekId();
      setCurrentWeekId(weekId);

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allData: WeekData = stored ? JSON.parse(stored) : {};

      if (allData[weekId]) {
        setSleepData(allData[weekId]);
      } else {
        //Initialize week with empty hours
        const initialData = daysOfWeek.map(day => ({ day, hours: '' }));
        allData[weekId] = initialData;
        setSleepData(initialData);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      }
    };

    loadData();
  }, []);

  const handleChange = async (day: string, value: string) => {
    const updated = sleepData.map(entry =>
      entry.day === day ? { ...entry, hours: value } : entry
    );
    setSleepData(updated);

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const allData: WeekData = stored ? JSON.parse(stored) : {};

    allData[currentWeekId] = updated;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
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
          onPress={() => router.push('/App_inApp/SleepHelper/sleep-statistics')}
        />
        <Text style={styles.weekText}>Week: {currentWeekId}</Text>
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
    marginTop: 10,
    fontSize: 16,
    fontStyle: 'italic',
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
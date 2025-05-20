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

export default function SleepHelper() {
  const [sleepData, setSleepData] = useState<SleepLog[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setSleepData(JSON.parse(stored));
      else setSleepData(daysOfWeek.map(day => ({ day, hours: '' })));
    };
    loadData();
  }, []);

  const handleChange = async (day: string, value: string) => {
    const updated = sleepData.map(entry =>
      entry.day === day ? { ...entry, hours: value } : entry
    );
    setSleepData(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
      <Button title="View Statistics" onPress={() => router.push("/App_inApp/SleepHelper/sleep-statistics")} />
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
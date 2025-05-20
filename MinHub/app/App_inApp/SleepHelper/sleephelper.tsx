import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'SLEEP_LOGS';

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

type SleepLog = {
  day: string;
  hours: string;
};

export default function SleepHelper() {
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadLogs = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SleepLog[] = JSON.parse(stored);
        setSleepLogs(parsed);
        const inputs: { [key: string]: string } = {};
        parsed.forEach((log) => (inputs[log.day] = log.hours));
        setInputValues(inputs);
      } else {
        // Initialize empty logs
        const initialLogs = daysOfWeek.map((day) => ({ day, hours: '' }));
        setSleepLogs(initialLogs);
      }
    };
    loadLogs();
  }, []);

  const handleChange = (day: string, value: string) => {
    const updatedInputs = { ...inputValues, [day]: value };
    setInputValues(updatedInputs);

    const updatedLogs = sleepLogs.map((log) =>
      log.day === day ? { ...log, hours: value } : log
    );
    setSleepLogs(updatedLogs);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sleep Log</Text>
      <FlatList
        data={sleepLogs}
        keyExtractor={(item) => item.day}
        renderItem={({ item }) => (
          <View style={styles.logRow}>
            <Text style={styles.dayText}>{item.day}</Text>
            <TextInput
              keyboardType="numeric"
              style={styles.input}
              placeholder="Hours"
              value={inputValues[item.day] || ''}
              onChangeText={(value) => handleChange(item.day, value)}
            />
          </View>
        )}
      />
      <TouchableOpacity
        style={styles.resetButton}
        onPress={async () => {
          const reset = daysOfWeek.map((day) => ({ day, hours: '' }));
          setSleepLogs(reset);
          setInputValues({});
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
        }}
      >
        <Text style={styles.resetButtonText}>Reset All</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dayText: {
    fontSize: 16,
    width: 100,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    width: 100,
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 30,
    backgroundColor: '#d11a2a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
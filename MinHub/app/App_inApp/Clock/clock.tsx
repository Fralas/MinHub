import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Switch,
  Platform,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

type Alarm = {
  id: string;
  name: string;
  time: Date;
  active: boolean;
};

const ALARM_FILE_PATH = FileSystem.documentDirectory + 'alarms.json';

export default function ClockScreen() {
  const [currentTime, setCurrentTime] = useState(getFormattedTime());
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [alarmName, setAlarmName] = useState('');
  const [alarmTime, setAlarmTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getFormattedTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    ensureAlarmFileExists().then(loadAlarmsFromFile);
  }, []);

  useEffect(() => {
    saveAlarmsToFile();
  }, [alarms]);

  function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString();
  }

  async function ensureAlarmFileExists() {
    try {
      const fileInfo = await FileSystem.getInfoAsync(ALARM_FILE_PATH);
      if (!fileInfo.exists) {
        await FileSystem.writeAsStringAsync(ALARM_FILE_PATH, '[]');
      }
    } catch (err) {
      console.error('Error ensuring file:', err);
    }
  }

  async function loadAlarmsFromFile() {
    try {
      const content = await FileSystem.readAsStringAsync(ALARM_FILE_PATH);
      const parsed = JSON.parse(content);
      const parsedAlarms: Alarm[] = parsed.map((alarm: any) => ({
        ...alarm,
        time: new Date(alarm.time),
      }));
      setAlarms(parsedAlarms);
    } catch (err) {
      console.error('Failed to load alarms:', err);
    }
  }

  async function saveAlarmsToFile() {
    try {
      await FileSystem.writeAsStringAsync(ALARM_FILE_PATH, JSON.stringify(alarms));
    } catch (err) {
      console.error('Failed to save alarms:', err);
    }
  }

  function handleAddAlarm() {
    const newAlarm: Alarm = {
      id: Date.now().toString(),
      name: alarmName || 'Wake Up',
      time: alarmTime,
      active: true,
    };
    setAlarms([...alarms, newAlarm]);
    setAlarmName('');
    setAlarmTime(new Date());
    setModalVisible(false);
  }

  function handleToggleAlarm(id: string) {
    setAlarms((prev) =>
      prev.map((alarm) =>
        alarm.id === id ? { ...alarm, active: !alarm.active } : alarm
      )
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Clock display */}
      <View style={styles.header}>
        <Text style={styles.clockText}>{currentTime}</Text>
      </View>

      {/* Alarm list */}
      <View style={styles.body}>
        <Text style={styles.title}>Wake Up Calls</Text>
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.alarmItem}>
              <View>
                <Text style={styles.alarmName}>{item.name}</Text>
                <Text style={styles.alarmTime}>
                  {item.time.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Switch
                value={item.active}
                onValueChange={() => handleToggleAlarm(item.id)}
              />
            </View>
          )}
        />
      </View>

      {/* "+" button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Add Alarm Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Wake Up Call</Text>
            <TextInput
              style={styles.input}
              placeholder="Alarm name"
              value={alarmName}
              onChangeText={setAlarmName}
            />
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.timePickerText}>
                Select time:{' '}
                {alarmTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={alarmTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowTimePicker(false);
                  if (selectedDate) setAlarmTime(selectedDate);
                }}
              />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddAlarm}>
                <Text style={styles.addButton}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', marginTop: 40 },
  clockText: { fontSize: 48, fontWeight: 'bold', color: '#333' },
  body: { flex: 1, padding: 20 },
  title: { fontSize: 26, marginBottom: 10, fontWeight: '600' },
  alarmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  alarmName: { fontSize: 18, fontWeight: '500' },
  alarmTime: { fontSize: 16, color: '#666' },
  floatingButton: {
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'absolute',
    right: 20,
    bottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: { fontSize: 20, marginBottom: 15, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  timePickerButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
  },
  timePickerText: { fontSize: 16 },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: { color: '#888', fontSize: 16 },
  addButton: { color: '#007AFF', fontSize: 16, fontWeight: 'bold' },
});

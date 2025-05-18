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
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAlarms } from './alarm';  // Import the hook

export default function ClockScreen() {
  const [currentTime, setCurrentTime] = useState(getFormattedTime());
  const [modalVisible, setModalVisible] = useState(false);
  const [alarmName, setAlarmName] = useState('');
  const [alarmTime, setAlarmTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const { width, height } = Dimensions.get('window');

  // Use the alarms hook
  const {
    alarms,
    handleAddOrUpdateAlarm,
    handleToggleAlarm,
    handleDeleteAlarm,
    checkAlarms,
  } = useAlarms();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getFormattedTime());
      checkAlarms();
    }, 1000); // Check every second
    return () => clearInterval(interval);
  }, [alarms]);

  function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.clockText}>{currentTime}</Text>
      </View>

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
                  {item.time
                    ? item.time.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Set time'}
                </Text>
              </View>
              <View style={styles.alarmActions}>
                <Switch
                  value={item.active}
                  onValueChange={() => handleToggleAlarm(item.id)}
                />
                <TouchableOpacity onPress={() => handleDeleteAlarm(item.id)}>
                  <Text style={styles.deleteButton}>x</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setAlarmName(item.name);
                  setAlarmTime(item.time);
                  setEditingAlarmId(item.id);
                  setModalVisible(true);
                }}>
                  <Text style={styles.editButton}>🔧</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => {
          setAlarmName('');
          setAlarmTime(null);
          setEditingAlarmId(null);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingAlarmId ? 'Edit Wake Up Call' : 'New Wake Up Call'}
            </Text>
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
                {alarmTime
                  ? alarmTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Not set'}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={alarmTime || new Date()}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (event.type === 'set' && selectedDate) {
                    setAlarmTime(selectedDate);
                  } else if (event.type === 'dismissed') {
                    setAlarmTime(null);
                  }
                  setShowTimePicker(false);
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAddOrUpdateAlarm(editingAlarmId, alarmName, alarmTime)}
              >
                <Text style={styles.addButton}>
                  {editingAlarmId ? 'Update' : 'Add'}
                </Text>
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
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteButton: {
    fontSize: 24,
    color: '#ff3b30',
    marginLeft: 10,
  },
  editButton: {
    fontSize: 24,
    color: '#007AFF',
  },
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

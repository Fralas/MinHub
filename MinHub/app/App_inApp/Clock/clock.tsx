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
import { useAlarms } from './alarm'; 

export default function ClockScreen() {
  const [currentTime, setCurrentTime] = useState(getFormattedTime());
  const [modalVisible, setModalVisible] = useState(false);
  const [alarmName, setAlarmName] = useState('');
  const [alarmTime, setAlarmTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const { width, height } = Dimensions.get('window');

  const {
    alarms,
    handleAddOrUpdateAlarm,
    handleToggleAlarm,
    handleDeleteAlarm,
  } = useAlarms();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getFormattedTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const handleSaveAlarm = () => {
    if (!alarmName.trim()) {
      Alert.alert('Error', 'Please enter an alarm name');
      return;
    }
    if (!alarmTime) {
      Alert.alert('Error', 'Please select a time');
      return;
    }

    handleAddOrUpdateAlarm(editingAlarmId, {
      name: alarmName,
      time: alarmTime,
    });

    setAlarmName('');
    setAlarmTime(null);
    setEditingAlarmId(null);
    setModalVisible(false);
  };

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
                {item.isSnoozing && (
                  <Text style={styles.snoozeText}>
                    Snoozing until {item.snoozeUntil?.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                )}
              </View>
              <View style={styles.alarmActions}>
                <Switch
                  value={item.active}
                  onValueChange={() => handleToggleAlarm(item.id)}
                />
                <TouchableOpacity 
                  onPress={() => {
                    Alert.alert(
                      'Delete Alarm',
                      'Are you sure you want to delete this alarm?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteAlarm(item.id) }
                      ]
                    );
                  }}
                >
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setAlarmName(item.name);
                  setAlarmTime(item.time);
                  setEditingAlarmId(item.id);
                  setModalVisible(true);
                }}>
                  <Text style={styles.editButton}>✏️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No alarms set</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add your first alarm</Text>
            </View>
          }
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
              placeholder="Alarm name (e.g., Wake Up, Meeting)"
              value={alarmName}
              onChangeText={setAlarmName}
              maxLength={50}
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
                  }
                  setShowTimePicker(false);
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButtonContainer}
                onPress={() => {
                  setAlarmName('');
                  setAlarmTime(null);
                  setEditingAlarmId(null);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButtonContainer}
                onPress={handleSaveAlarm}
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
  snoozeText: { fontSize: 14, color: '#ff9500', fontStyle: 'italic' },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  deleteButton: {
    fontSize: 20,
    color: '#ff3b30',
  },
  editButton: {
    fontSize: 20,
    color: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  timePickerButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
  },
  timePickerText: { fontSize: 16 },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButtonContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  addButtonContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  cancelButton: { color: '#888', fontSize: 16 },
  addButton: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
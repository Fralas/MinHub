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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAlarms } from './alarm'; 
import { MessageModal, ConfirmationModal } from './alarm';


  const ClockScreen: React.FC<{ navigateTo: (screen: 'clock' | 'sleepData') => void }> = ({ navigateTo }) => {  const [currentTime, setCurrentTime] = useState(getFormattedTime());
  const [modalVisible, setModalVisible] = useState(false);
  const [alarmName, setAlarmName] = useState('');
  const [alarmTime, setAlarmTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);

  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [alarmToDeleteId, setAlarmToDeleteId] = useState<string | null>(null);

  const {
    alarms,
    handleAddOrUpdateAlarm,
    handleToggleAlarm,
    handleDeleteAlarm,
    messageModalVisible,
    messageModalContent,
    setMessageModalVisible,
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
      setMessageModalVisible(true);
      messageModalContent.title = 'Error';
      messageModalContent.message = 'Please enter an alarm name';
      return;
    }
    if (!alarmTime) {

      setMessageModalVisible(true);
      messageModalContent.title = 'Error';
      messageModalContent.message = 'Please select a time';
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
        {/* FlatList to display the list of alarms */}
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
                {/* Switch to toggle alarm active state */}
                <Switch
                  value={item.active}
                  onValueChange={() => handleToggleAlarm(item.id)}
                />
                {/* Delete alarm button */}
                <TouchableOpacity
                  onPress={() => {
                    setAlarmToDeleteId(item.id);
                    setConfirmationModalVisible(true);
                  }}
                >
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
                {/* Edit alarm button */}
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

      {/* Floating Add Alarm Button */}
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

      {/* Floating Sleep Data Button */}
      <TouchableOpacity
        style={[styles.floatingButton, styles.sleepDataButton]}
        onPress={() => navigateTo('sleepData')}
      >
        <Ionicons name="moon" size={28} color="white" />
      </TouchableOpacity>

      {/* Add/Edit Alarm Modal */}
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

      {/* Message Modal for errors/information */}
      <MessageModal
        visible={messageModalVisible}
        title={messageModalContent.title}
        message={messageModalContent.message}
        onClose={() => setMessageModalVisible(false)}
      />

      {/* Confirmation Modal for deleting alarms */}
      <ConfirmationModal
        visible={confirmationModalVisible}
        title="Delete Alarm"
        message="Are you sure you want to delete this alarm?"
        onConfirm={() => {
          if (alarmToDeleteId) {
            handleDeleteAlarm(alarmToDeleteId);
          }
          setConfirmationModalVisible(false);
          setAlarmToDeleteId(null);
        }}
        onCancel={() => {
          setConfirmationModalVisible(false);
          setAlarmToDeleteId(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', 
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    padding: 10,
  },
  clockText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  body: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  alarmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  alarmName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  alarmTime: {
    fontSize: 18,
    color: '#666',
    marginTop: 2,
  },
  snoozeText: {
    fontSize: 14,
    color: '#ff9500',
    fontStyle: 'italic',
    marginTop: 5,
  },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  deleteButton: {
    fontSize: 24,
    color: '#ff3b30',
  },
  editButton: {
    fontSize: 24,
    color: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sleepDataButton: {
    right: 90, 
    backgroundColor: '#5856D6',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 18,
    backgroundColor: '#f9f9f9',
  },
  timePickerButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  inputButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    alignItems: 'flex-start',
  },
  inputButtonText: {
    fontSize: 18,
    color: '#333',
  },
  timePickerText: {
    fontSize: 18,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  cancelButtonContainer: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
  },
  addButtonContainer: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  cancelButton: {
    color: '#666',
    fontSize: 18,
    fontWeight: '500',
  },
  addButton: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sleepEntryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sleepEntryDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sleepEntryTimes: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  sleepEntryDuration: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 5,
  },
  suggestionBox: {
    backgroundColor: '#e6f7ff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#91d5ff',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 16,
    color: '#1890ff',
    lineHeight: 24,
  },
});

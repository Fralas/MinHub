import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSleepData } from './alarm'; 
import { MessageModal, ConfirmationModal } from './alarm'; 


  export const SleepDataScreen: React.FC<{ navigateTo: (screen: 'clock' | 'sleepData') => void }> = ({ navigateTo }) => {  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sleepTime, setSleepTime] = useState(new Date());
  const [wakeUpTime, setWakeUpTime] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSleepTimePicker, setShowSleepTimePicker] = useState(false);
  const [showWakeUpTimePicker, setShowWakeUpTimePicker] = useState(false);

  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [entryToDeleteId, setEntryToDeleteId] = useState<string | null>(null);

  
  const {
    sleepEntries,
    addSleepEntry,
    deleteSleepEntry,
    calculateSmartWakeUpSuggestion,
    messageModalVisible,
    messageModalContent,
    setMessageModalVisible,
  } = useSleepData();

  const getFormattedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const getFormattedTime = (time: Date) => {
    return time.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAddSleepEntry = () => {
    addSleepEntry(selectedDate, sleepTime, wakeUpTime);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Back button to return to ClockScreen */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigateTo('clock')}>
          <Ionicons name="arrow-back" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Sleep Data Input</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Record Your Sleep</Text>

        {/* Date Picker for sleep entry */}
        <TouchableOpacity style={styles.inputButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.inputButtonText}>Date: {getFormattedDate(selectedDate)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              if (event.type === 'set' && date) {
                setSelectedDate(date);
              }
              setShowDatePicker(false);
            }}
          />
        )}

        {/* Sleep Time Picker */}
        <TouchableOpacity style={styles.inputButton} onPress={() => setShowSleepTimePicker(true)}>
          <Text style={styles.inputButtonText}>Sleep Time: {getFormattedTime(sleepTime)}</Text>
        </TouchableOpacity>
        {showSleepTimePicker && (
          <DateTimePicker
            value={sleepTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, time) => {
              if (event.type === 'set' && time) {
                setSleepTime(time);
              }
              setShowSleepTimePicker(false);
            }}
          />
        )}

        {/* Wake Up Time Picker */}
        <TouchableOpacity style={styles.inputButton} onPress={() => setShowWakeUpTimePicker(true)}>
          <Text style={styles.inputButtonText}>Wake Up Time: {getFormattedTime(wakeUpTime)}</Text>
        </TouchableOpacity>
        {showWakeUpTimePicker && (
          <DateTimePicker
            value={wakeUpTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, time) => {
              if (event.type === 'set' && time) {
                setWakeUpTime(time);
              }
              setShowWakeUpTimePicker(false);
            }}
          />
        )}

        {/* Button to add the sleep entry */}
        <TouchableOpacity style={styles.saveButton} onPress={handleAddSleepEntry}>
          <Text style={styles.saveButtonText}>Add Sleep Entry</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Your Sleep History</Text>
        {/* FlatList to display recorded sleep entries */}
        <FlatList
          data={sleepEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.sleepEntryItem}>
              <View>
                <Text style={styles.sleepEntryDate}>{getFormattedDate(item.date)}</Text>
                <Text style={styles.sleepEntryTimes}>
                  Sleep: {getFormattedTime(item.sleepTime)} - Wake: {getFormattedTime(item.wakeUpTime)}
                </Text>
                <Text style={styles.sleepEntryDuration}>Duration: {item.durationMinutes} min</Text>
              </View>
              {/* Delete sleep entry button */}
              <TouchableOpacity
                onPress={() => {
                  setEntryToDeleteId(item.id);
                  setConfirmationModalVisible(true); // Show confirmation modal
                }}
              >
                <Text style={styles.deleteButton}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No sleep data recorded</Text>
              <Text style={styles.emptySubtext}>Add entries above to see your history</Text>
            </View>
          }
        />

        <Text style={styles.sectionTitle}>Smart Wake-Up Suggestion</Text>
        <View style={styles.suggestionBox}>
          <Text style={styles.suggestionText}>
            {calculateSmartWakeUpSuggestion()}
          </Text>
        </View>
      </View>

      {/* Message Modal for errors/information */}
      <MessageModal
        visible={messageModalVisible}
        title={messageModalContent.title}
        message={messageModalContent.message}
        onClose={() => setMessageModalVisible(false)}
      />

      {/* Confirmation Modal for deleting sleep entries */}
      <ConfirmationModal
        visible={confirmationModalVisible}
        title="Delete Sleep Entry"
        message="Are you sure you want to delete this sleep entry?"
        onConfirm={() => {
          if (entryToDeleteId) {
            deleteSleepEntry(entryToDeleteId);
          }
          setConfirmationModalVisible(false);
          setEntryToDeleteId(null);
        }}
        onCancel={() => {
          setConfirmationModalVisible(false);
          setEntryToDeleteId(null);
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

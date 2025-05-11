import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Reminder {
  id: string;
  title: string;
  date: string; 
  time: string; 
  notes?: string;
  isCompleted: boolean;
}

const REMINDERS_STORAGE_KEY = '@minhub_reminders_v1';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const [currentTitle, setCurrentTitle] = useState('');
  const [currentDate, setCurrentDate] = useState(''); 
  const [currentTime, setCurrentTime] = useState(''); 
  const [currentNotes, setCurrentNotes] = useState('');

  const loadReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedReminders = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
      const parsedReminders: Reminder[] = storedReminders ? JSON.parse(storedReminders) : [];
      setReminders(parsedReminders.sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
        const dateTimeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
        return dateTimeA - dateTimeB;
      }));
    } catch (error) {
      console.error('Failed to load reminders.', error);
      Alert.alert('Error', 'Could not load reminders.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders])
  );

  const saveReminders = async (updatedReminders: Reminder[]) => {
    try {
      const sortedReminders = updatedReminders.sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
        const dateTimeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
        return dateTimeA - dateTimeB;
      });
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(sortedReminders));
      setReminders(sortedReminders);
    } catch (error) {
      console.error('Failed to save reminders.', error);
      Alert.alert('Error', 'Could not save reminders.');
    }
  };

  const handleOpenModal = (reminder?: Reminder) => {
    if (reminder) {
      setEditingReminder(reminder);
      setCurrentTitle(reminder.title);
      setCurrentDate(reminder.date);
      setCurrentTime(reminder.time);
      setCurrentNotes(reminder.notes || '');
    } else {
      setEditingReminder(null);
      setCurrentTitle('');
      setCurrentDate(new Date().toISOString().split('T')[0]); 
      setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })); 
      setCurrentNotes('');
    }
    setModalVisible(true);
  };

  const handleSaveReminder = () => {
    if (currentTitle.trim() === '') {
      Alert.alert('Required', 'Reminder title cannot be empty.');
      return;
    }
    if (currentDate.trim() === '' || !/^\d{4}-\d{2}-\d{2}$/.test(currentDate.trim())) {
        Alert.alert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format.');
        return;
    }
    if (currentTime.trim() === '' || !/^\d{2}:\d{2}$/.test(currentTime.trim())) {
        Alert.alert('Invalid Time', 'Please enter a valid time in HH:MM format.');
        return;
    }

    let updatedReminders;
    if (editingReminder) {
      updatedReminders = reminders.map(r =>
        r.id === editingReminder.id
          ? { ...editingReminder, title: currentTitle.trim(), date: currentDate.trim(), time: currentTime.trim(), notes: currentNotes.trim() }
          : r
      );
    } else {
      const newReminder: Reminder = {
        id: Date.now().toString(),
        title: currentTitle.trim(),
        date: currentDate.trim(),
        time: currentTime.trim(),
        notes: currentNotes.trim() || undefined,
        isCompleted: false,
      };
      updatedReminders = [...reminders, newReminder];
    }
    saveReminders(updatedReminders);
    setModalVisible(false);
  };

  const handleDeleteReminder = (reminderId: string) => {
    Alert.alert('Delete Reminder', 'Are you sure you want to delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedReminders = reminders.filter(r => r.id !== reminderId);
          saveReminders(updatedReminders);
        },
      },
    ]);
  };

  const handleToggleComplete = (reminderId: string) => {
    const updatedReminders = reminders.map(r =>
      r.id === reminderId ? { ...r, isCompleted: !r.isCompleted } : r
    );
    saveReminders(updatedReminders);
  };

  const renderReminderItem = ({ item }: { item: Reminder }) => (
    <View style={[styles.reminderItem, item.isCompleted && styles.reminderItemCompleted]}>
        <TouchableOpacity onPress={() => handleToggleComplete(item.id)} style={styles.checkboxArea}>
            <View style={[styles.checkbox, item.isCompleted && styles.checkboxChecked]}>
            {item.isCompleted && <Text style={styles.checkboxCheckmark}>✓</Text>}
            </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reminderContent} onPress={() => handleOpenModal(item)}>
            <Text style={[styles.reminderTitle, item.isCompleted && styles.reminderTextCompleted]}>{item.title}</Text>
            <Text style={[styles.reminderDateTime, item.isCompleted && styles.reminderTextCompleted]}>
            {new Date(item.date + 'T' + item.time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} - {item.time}
            </Text>
            {item.notes && <Text style={[styles.reminderNotes, item.isCompleted && styles.reminderTextCompleted]} numberOfLines={1}>{item.notes}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteReminder(item.id)} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centeredMessageContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Reminders...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'My Reminders',
          headerRight: () => (
            <TouchableOpacity onPress={() => handleOpenModal()} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Add</Text>
            </TouchableOpacity>
          ),
        }}
      />
      {reminders.length === 0 ? (
        <View style={styles.centeredMessageContainer}>
          <Text style={styles.emptyListText}>No reminders yet. Tap 'Add' to create one!</Text>
        </View>
      ) : (
        <FlatList
          data={reminders}
          renderItem={renderReminderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContentContainer}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingReminder ? 'Edit Reminder' : 'Add New Reminder'}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Reminder Title"
                value={currentTitle}
                onChangeText={setCurrentTitle}
                autoFocus={true}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Date (YYYY-MM-DD)"
                value={currentDate}
                onChangeText={setCurrentDate}
                maxLength={10}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Time (HH:MM - 24h format)"
                value={currentTime}
                onChangeText={setCurrentTime}
                maxLength={5}
              />
              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                placeholder="Optional Notes"
                value={currentNotes}
                onChangeText={setCurrentNotes}
                multiline
                numberOfLines={3}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveReminder}
                >
                  <Text style={styles.modalButtonText}>{editingReminder ? 'Save Changes' : 'Add Reminder'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerButton: {
    marginRight: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  headerButtonText: {
    color: Platform.OS === 'ios' ? '#007AFF' : '#333',
    fontSize: 17,
    fontWeight: '600',
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#495057',
    marginTop: 10,
  },
  emptyListText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  listContentContainer: {
    padding: 15,
  },
  reminderItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  reminderItemCompleted: {
    backgroundColor: '#e9ecef',
  },
  checkboxArea: {
    padding: 8,
    marginRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxCheckmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#343a40',
  },
  reminderDateTime: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  reminderNotes: {
    fontSize: 13,
    color: '#868e96',
    fontStyle: 'italic',
    marginTop: 3,
  },
  reminderTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#6c757d',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
  deleteButtonText: {
    fontSize: Platform.OS === 'ios' ? 22 : 18,
    color: '#dc3545',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderRadius: 15,
    width: '90%',
    maxWidth: 450,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#343a40',
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
  },
  notesInput: {
      minHeight: 80,
      textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  notificationId?: string | null;
}

const REMINDERS_STORAGE_KEY = '@minhub_reminders_v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const [currentTitle, setCurrentTitle] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [currentNotes, setCurrentNotes] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [currentFilter, setCurrentFilter] = useState<'all' | 'pending' | 'completed' | 'today'>('pending');

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Notification permissions are needed for reminders to work.');
      }
    }
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }
  };

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const sortReminders = (remindersToSort: Reminder[]): Reminder[] => {
    return [...remindersToSort].sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      return dateTimeA - dateTimeB;
    });
  };

  const loadReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedReminders = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
      const parsedReminders: Reminder[] = storedReminders ? JSON.parse(storedReminders) : [];
      setReminders(sortReminders(parsedReminders));
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
      const sorted = sortReminders(updatedReminders);
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(sorted));
      setReminders(sorted);
    } catch (error) {
      console.error('Failed to save reminders.', error);
      Alert.alert('Error', 'Could not save reminders.');
    }
  };

  const scheduleReminderNotification = async (reminder: Reminder): Promise<string | null> => {
    if (reminder.isCompleted || !reminder.date || !reminder.time) {
      if (reminder.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      }
      return null;
    }
    const [hours, minutes] = reminder.time.split(':').map(Number);
    const dateParts = reminder.date.split('-').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59 ||
        dateParts.length !== 3 || dateParts.some(isNaN) ||
        dateParts[1] < 1 || dateParts[1] > 12 || dateParts[2] < 1 || dateParts[2] > 31) {
      if (reminder.notificationId) await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      return null;
    }
    const reminderDateTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hours, minutes, 0);
    if (isNaN(reminderDateTime.getTime())) {
        if (reminder.notificationId) await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
        return null;
    }
    const now = Date.now();
    const secondsUntilTrigger = (reminderDateTime.getTime() - now) / 1000;
    if (secondsUntilTrigger <= 0) {
      if (reminder.notificationId) await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      return null;
    }
    try {
      if (reminder.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      }
      const calculatedSeconds = Math.max(1, Math.round(secondsUntilTrigger));
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'MinHub Reminder',
          body: reminder.title,
          data: { reminderId: reminder.id, url: `/reminders` },
        },
        trigger: calculatedSeconds as any,
      });
      return notificationId;
    } catch (e) {
      console.error("Error scheduling reminder notification:", e);
      Alert.alert("Reminder Error", "Could not schedule the reminder.");
      return null;
    }
  };

  const cancelReminderNotification = async (notificationId?: string | null) => {
    if (notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      } catch (e) {
        console.error("Error cancelling notification:", e);
      }
    }
  };

  const handleOpenModal = (reminder?: Reminder) => {
    const now = new Date();
    if (reminder) {
      setEditingReminder(reminder);
      setCurrentTitle(reminder.title);
      const [year, month, day] = reminder.date.split('-').map(Number);
      const [hours, minutes] = reminder.time.split(':').map(Number);
      setCurrentDateTime(new Date(year, month - 1, day, hours, minutes));
      setCurrentNotes(reminder.notes || '');
    } else {
      setEditingReminder(null);
      setCurrentTitle('');
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(now.getHours(), now.getMinutes()); // Mantieni l'ora corrente per domani
      setCurrentDateTime(tomorrow);
      setCurrentNotes('');
    }
    setModalVisible(true);
  };

  const handleSaveReminder = async () => {
    if (currentTitle.trim() === '') {
      Alert.alert('Required', 'Reminder title cannot be empty.');
      return;
    }

    const reminderDateStr = formatDate(currentDateTime);
    const reminderTimeStr = formatTime(currentDateTime);

    let updatedReminders;
    let reminderToProcess: Reminder;

    if (editingReminder) {
      reminderToProcess = {
        ...editingReminder,
        title: currentTitle.trim(),
        date: reminderDateStr,
        time: reminderTimeStr,
        notes: currentNotes.trim() || undefined,
      };
    } else {
      reminderToProcess = {
        id: Date.now().toString(),
        title: currentTitle.trim(),
        date: reminderDateStr,
        time: reminderTimeStr,
        notes: currentNotes.trim() || undefined,
        isCompleted: false,
        notificationId: null,
      };
    }
    
    const newNotificationId = await scheduleReminderNotification(reminderToProcess);
    reminderToProcess.notificationId = newNotificationId;
    
    if (editingReminder) {
        updatedReminders = reminders.map(r => (r.id === editingReminder.id ? reminderToProcess : r));
    } else {
        updatedReminders = [...reminders, reminderToProcess];
    }

    saveReminders(updatedReminders);
    setModalVisible(false);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    Alert.alert('Delete Reminder', 'Are you sure you want to delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const reminderToDelete = reminders.find(r => r.id === reminderId);
          if (reminderToDelete) {
            await cancelReminderNotification(reminderToDelete.notificationId);
          }
          const updatedReminders = reminders.filter(r => r.id !== reminderId);
          saveReminders(updatedReminders);
        },
      },
    ]);
  };

  const handleToggleComplete = async (reminderId: string) => {
    let reminderToUpdate: Reminder | undefined;
    const tempUpdatedReminders = reminders.map(r => {
      if (r.id === reminderId) {
        reminderToUpdate = { ...r, isCompleted: !r.isCompleted };
        return reminderToUpdate;
      }
      return r;
    });

    if (reminderToUpdate) {
      if (reminderToUpdate.isCompleted && reminderToUpdate.notificationId) {
        await cancelReminderNotification(reminderToUpdate.notificationId);
        reminderToUpdate.notificationId = null;
      } else if (!reminderToUpdate.isCompleted) {
        const newNotificationId = await scheduleReminderNotification(reminderToUpdate);
        reminderToUpdate.notificationId = newNotificationId;
      }
      const finalUpdatedReminders = tempUpdatedReminders.map(r => r.id === reminderToUpdate!.id ? reminderToUpdate! : r);
      saveReminders(finalUpdatedReminders);
    }
  };

  const onChangeDatePicker = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
    setShowDatePicker(false); // Nascondi sempre su Android dopo selezione/dismiss
    if (event.type === 'set' && selectedDateValue) {
      const newDateTime = new Date(currentDateTime);
      newDateTime.setFullYear(selectedDateValue.getFullYear());
      newDateTime.setMonth(selectedDateValue.getMonth());
      newDateTime.setDate(selectedDateValue.getDate());
      setCurrentDateTime(newDateTime);
    }
  };

  const onChangeTimePicker = (event: DateTimePickerEvent, selectedTimeValue?: Date) => {
    setShowTimePicker(false); // Nascondi sempre su Android dopo selezione/dismiss
    if (event.type === 'set' && selectedTimeValue) {
      const newDateTime = new Date(currentDateTime);
      newDateTime.setHours(selectedTimeValue.getHours());
      newDateTime.setMinutes(selectedTimeValue.getMinutes());
      setCurrentDateTime(newDateTime);
    }
  };


  const filteredReminders = useMemo(() => {
    const todayStr = getTodayDateString();
    switch (currentFilter) {
      case 'pending':
        return reminders.filter(r => !r.isCompleted);
      case 'completed':
        return reminders.filter(r => r.isCompleted);
      case 'today':
        return reminders.filter(r => r.date === todayStr && !r.isCompleted);
      case 'all':
      default:
        return reminders;
    }
  }, [reminders, currentFilter]);

  const renderFilterButton = (filter: FilterOption, label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, currentFilter === filter && styles.filterButtonActive]}
      onPress={() => setCurrentFilter(filter)}
    >
      <Text style={[styles.filterButtonText, currentFilter === filter && styles.filterButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

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
            {new Date(item.date + 'T' + (item.time || '00:00')).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} - {item.time}
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
      <View style={styles.filterContainer}>
        {renderFilterButton('pending', 'Pending')}
        {renderFilterButton('today', "Today's")}
        {renderFilterButton('completed', 'Completed')}
        {renderFilterButton('all', 'All')}
      </View>

      {filteredReminders.length === 0 ? (
        <View style={styles.centeredMessageContainerContent}>
          <Text style={styles.emptyListText}>
            {currentFilter === 'pending' ? 'No pending reminders.' :
             currentFilter === 'today' ? 'No reminders for today.' :
             currentFilter === 'completed' ? 'No completed reminders yet.' :
             'No reminders yet. Tap "Add" to create one!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReminders}
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
              
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerButton}>
                <Text style={styles.pickerButtonText}>Date: {formatDate(currentDateTime)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={currentDateTime}
                  mode="date"
                  display="default"
                  onChange={onChangeDatePicker}
                />
              )}

              <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.pickerButton}>
                <Text style={styles.pickerButtonText}>Time: {formatTime(currentDateTime)}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={currentDateTime}
                  mode="time"
                  display="default"
                  is24Hour={true}
                  onChange={onChangeTimePicker}
                />
              )}

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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#e9ecef',
    borderBottomWidth: 1,
    borderColor: '#dee2e6',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centeredMessageContainerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
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
    opacity: 0.7,
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
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#495057',
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
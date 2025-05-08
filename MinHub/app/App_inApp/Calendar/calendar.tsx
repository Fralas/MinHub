import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; 
}

const CALENDAR_EVENTS_STORAGE_KEY = '@minhub_calendarEvents_v1';

export default function CalendarScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedEvents = await AsyncStorage.getItem(CALENDAR_EVENTS_STORAGE_KEY);
      setEvents(storedEvents ? JSON.parse(storedEvents) : []);
    } catch (error) {
      console.error('Failed to load events.', error);
      Alert.alert('Error', 'Could not load events.');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  const saveEvents = async (updatedEvents: CalendarEvent[]) => {
    try {
      await AsyncStorage.setItem(CALENDAR_EVENTS_STORAGE_KEY, JSON.stringify(updatedEvents));
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Failed to save events.', error);
      Alert.alert('Error', 'Could not save events.');
    }
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleOpenModal = () => {
    setNewEventTitle('');
    setModalVisible(true);
  };

  const handleSaveEvent = () => {
    if (newEventTitle.trim() === '') {
      Alert.alert('Required', 'Event title cannot be empty.');
      return;
    }
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: newEventTitle.trim(),
      date: selectedDate,
    };
    saveEvents([...events, newEvent]);
    setModalVisible(false);
  };

   const handleDeleteEvent = (eventId: string) => {
     Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
       { text: 'Cancel', style: 'cancel' },
       {
         text: 'Delete',
         style: 'destructive',
         onPress: () => {
           const updatedEvents = events.filter(event => event.id !== eventId);
           saveEvents(updatedEvents);
         },
       },
     ]);
   };


  const markedDates = useMemo(() => {
    const marks: { [key: string]: any } = {};
    events.forEach(event => {
      marks[event.date] = { ...(marks[event.date] || {}), marked: true, dotColor: '#007AFF' };
    });
    marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true, selectedColor: '#007AFF', disableTouchEvent: true };
    return marks;
  }, [events, selectedDate]);

  const selectedDayEvents = useMemo(() => {
    return events
      .filter(event => event.date === selectedDate)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [events, selectedDate]);

   const renderEventItem = ({ item }: { item: CalendarEvent }) => (
     <View style={styles.eventItem}>
       <Text style={styles.eventItemTitle}>{item.title}</Text>
       <TouchableOpacity onPress={() => handleDeleteEvent(item.id)}>
           <Text style={styles.deleteEventButton}>🗑️</Text>
       </TouchableOpacity>
     </View>
   );

  if (isLoading) {
      return (
        <SafeAreaView style={styles.centeredMessageContainer}>
            <ActivityIndicator size="large" color="#007AFF"/>
            <Text style={styles.loadingText}>Loading Calendar...</Text>
        </SafeAreaView>
      )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
            headerTitle: 'Calendar',
            headerRight: () => (
                <TouchableOpacity onPress={handleOpenModal} style={styles.headerButton}>
                    <Text style={styles.headerButtonText}>Add Event</Text>
                </TouchableOpacity>
            )
        }}
      />
      <Calendar
        style={styles.calendar}
        current={selectedDate} 
        onDayPress={handleDayPress}
        markedDates={markedDates}
        theme={{
            arrowColor: '#007AFF',
            todayTextColor: '#007AFF',
            selectedDayBackgroundColor: '#007AFF',
            selectedDayTextColor: '#ffffff',
            dotColor: '#007AFF', 
            selectedDotColor: '#ffffff',
        }}
        key={selectedDate} 
      />

      <View style={styles.eventListContainer}>
        <Text style={styles.eventListHeader}>
          Events for {new Date(selectedDate).toLocaleDateString('en-GB')}
        </Text>
        {selectedDayEvents.length === 0 ? (
          <Text style={styles.noEventsText}>No events for this day.</Text>
        ) : (
          <FlatList
            data={selectedDayEvents}
            renderItem={renderEventItem}
            keyExtractor={item => item.id}
          />
        )}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Event for {new Date(selectedDate).toLocaleDateString('en-GB')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Event title"
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              autoFocus={true}
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
                onPress={handleSaveEvent}
              >
                <Text style={styles.modalButtonText}>Save Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  calendar: {
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 5, 
  },
  eventListContainer: {
      flex: 1, 
      paddingHorizontal: 15,
      paddingTop: 10,
  },
  eventListHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#495057',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderColor: '#dee2e6',
      paddingBottom: 5,
  },
  eventItem: {
      backgroundColor: '#ffffff',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 5,
      marginBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  eventItemTitle: {
      fontSize: 16,
      color: '#343a40',
      flex: 1, 
      marginRight: 10,
  },
  deleteEventButton: {
      padding: 5,
      color: '#dc3545',
      fontSize: 18,
  },
  noEventsText: {
      fontSize: 15,
      color: '#6c757d',
      textAlign: 'center',
      marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 25,
    backgroundColor: '#f8f9fa',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#495057',
  }
});
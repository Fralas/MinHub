import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { Agenda, AgendaEntry, AgendaSchedule, Calendar, DateData } from 'react-native-calendars';

// --- Interfaces ---
interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  notes?: string;
  color?: string;
  reminderOffset?: number | null; // Minutes before event, null for no reminder
  notificationId?: string | null; // To cancel/update scheduled notification
}

interface MyAgendaItem extends AgendaEntry {
  id: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  color?: string;
  reminderOffset?: number | null;
  notificationId?: string | null;
}

// --- Constants ---
const CALENDAR_EVENTS_STORAGE_KEY = '@minhub_calendarEvents_v1';
const PREDEFINED_EVENT_COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6'];
const REMINDER_OPTIONS = [
    { label: 'None', value: null },
    { label: '5 mins before', value: 5 },
    { label: '15 mins before', value: 15 },
    { label: '30 mins before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '1 day before', value: 24 * 60 },
];

// --- Notification Handler (App Global or in Root Layout) ---
// This should ideally be configured once, e.g., in your _layout.tsx or root component
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


export default function CalendarScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [eventTitle, setEventTitle] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [eventColor, setEventColor] = useState<string>(PREDEFINED_EVENT_COLORS[0]);
  const [eventReminderOffset, setEventReminderOffset] = useState<number | null>(null);

  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');
  const [agendaItems, setAgendaItems] = useState<AgendaSchedule>({});

  // --- Notification Permissions ---
  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Notification permissions are required to set event reminders.');
    }
    // For Android, ensure channel is set up if needed (usually done automatically or can be customized)
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


  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedEvents = await AsyncStorage.getItem(CALENDAR_EVENTS_STORAGE_KEY);
      const parsedEvents: CalendarEvent[] = storedEvents ? JSON.parse(storedEvents) : [];
      setEvents(parsedEvents);
    } catch (error) {
      console.error('Failed to load events.', error);
      Alert.alert('Error', 'Could not load events.');
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

  // --- Notification Scheduling Logic ---
  const scheduleEventNotification = async (event: CalendarEvent): Promise<string | null> => {
    if (event.reminderOffset == null || !event.startTime) {
      if (event.notificationId) await Notifications.cancelScheduledNotificationAsync(event.notificationId);
      return null;
    }

    const [hours, minutes] = event.startTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null; // Invalid time format

    const eventDate = new Date(event.date + 'T00:00:00'); // Ensure local timezone interpretation
    eventDate.setHours(hours, minutes, 0, 0);

    const triggerDate = new Date(eventDate.getTime() - event.reminderOffset * 60000);

    if (triggerDate.getTime() <= Date.now()) {
      console.log('Reminder time is in the past, not scheduling for event:', event.title);
      if (event.notificationId) await Notifications.cancelScheduledNotificationAsync(event.notificationId);
      return null; // Don't schedule past reminders
    }

    try {
      // Cancel previous notification if it exists
      if (event.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(event.notificationId);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Event Reminder",
          body: `${event.title} at ${event.startTime}`,
          data: { eventId: event.id },
        },
        trigger: triggerDate,
      });
      console.log(`Notification scheduled for ${event.title}: ${notificationId} at ${triggerDate}`);
      return notificationId;
    } catch (e) {
      console.error("Error scheduling notification:", e);
      Alert.alert("Reminder Error", "Could not schedule reminder for the event.");
      return null;
    }
  };


  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };
  
  const handleOpenModal = (eventToEdit?: CalendarEvent, dateForNewEvent?: string) => {
    const targetDate = eventToEdit?.date || dateForNewEvent || selectedDate;
    if (eventToEdit) {
      setEditingEvent(eventToEdit);
      setEventTitle(eventToEdit.title);
      setEventStartTime(eventToEdit.startTime || '');
      setEventEndTime(eventToEdit.endTime || '');
      setEventNotes(eventToEdit.notes || '');
      setEventColor(eventToEdit.color || PREDEFINED_EVENT_COLORS[0]);
      setEventReminderOffset(eventToEdit.reminderOffset !== undefined ? eventToEdit.reminderOffset : null);
    } else {
      setEditingEvent(null);
      setEventTitle('');
      setEventStartTime('');
      setEventEndTime('');
      setEventNotes('');
      setEventColor(PREDEFINED_EVENT_COLORS[0]);
      setEventReminderOffset(15); // Default reminder 15 mins
    }
    setSelectedDate(targetDate);
    setModalVisible(true);
  };

  const handleSaveEvent = async () => {
    if (eventTitle.trim() === '') {
      Alert.alert('Required', 'Event title cannot be empty.');
      return;
    }

    let currentNotificationId = editingEvent?.notificationId || null;

    const eventDetails: Omit<CalendarEvent, 'id'> = {
        title: eventTitle.trim(),
        date: editingEvent ? editingEvent.date : selectedDate,
        startTime: eventStartTime.trim() || undefined,
        endTime: eventEndTime.trim() || undefined,
        notes: eventNotes.trim() || undefined,
        color: eventColor,
        reminderOffset: eventReminderOffset,
        notificationId: currentNotificationId, // Will be updated by scheduleEventNotification
    };

    let finalEvent: CalendarEvent;
    let updatedEvents;

    if (editingEvent) {
      finalEvent = { ...editingEvent, ...eventDetails };
      updatedEvents = events.map(event => (event.id === editingEvent.id ? finalEvent : event));
    } else {
      finalEvent = { id: Date.now().toString(), ...eventDetails };
      updatedEvents = [...events, finalEvent];
    }
    
    const newNotificationId = await scheduleEventNotification(finalEvent);
    finalEvent.notificationId = newNotificationId; // Update with new ID

    // Update the event in the list with the new notification ID
    updatedEvents = updatedEvents.map(ev => ev.id === finalEvent.id ? finalEvent : ev);

    await saveEvents(updatedEvents);
    setModalVisible(false);
  };

   const handleDeleteEvent = async (eventId: string) => {
     Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
       { text: 'Cancel', style: 'cancel' },
       {
         text: 'Delete',
         style: 'destructive',
         onPress: async () => {
           const eventToDelete = events.find(event => event.id === eventId);
           if (eventToDelete?.notificationId) {
             await Notifications.cancelScheduledNotificationAsync(eventToDelete.notificationId);
             console.log(`Cancelled notification for deleted event: ${eventToDelete.title}`);
           }
           const updatedEvents = events.filter(event => event.id !== eventId);
           await saveEvents(updatedEvents);
         },
       },
     ]);
   };

  const markedDatesForCalendar = useMemo(() => {
    const marks: { [key: string]: any } = {};
    events.forEach(event => {
      const color = event.color || '#007AFF';
      const dateMarking = marks[event.date] || { dots: [] };
      const newDot = { key: event.id, color: color };
      const existingDots = dateMarking.dots as {key?: string, color: string}[];
      if (!existingDots.find(d => d.key === newDot.key)) {
            marks[event.date] = {
                ...dateMarking,
                marked: true,
                dots: [...existingDots, newDot],
            };
      } else if (!dateMarking.marked) {
            marks[event.date] = {...dateMarking, marked: true};
      }
    });
    marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true, selectedColor: '#007AFF', disableTouchEvent: false };
    return marks;
  }, [events, selectedDate]);

  const selectedDayEventsForCalendarView = useMemo(() => {
    return events
      .filter(event => event.date === selectedDate)
      .sort((a, b) => {
          if(a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
          if (a.startTime) return -1;
          if (b.startTime) return 1;
          return a.title.localeCompare(b.title);
      });
  }, [events, selectedDate]);


  const loadItemsForAgenda = useCallback((day: DateData) => {
    const newAgendaItemsState: AgendaSchedule = { ...agendaItems };
    for (let i = -15; i < 15; i++) {
        const dateToProcess = new Date(day.timestamp + i * 24 * 60 * 60 * 1000);
        const dateString = dateToProcess.toISOString().split('T')[0];
        if (!newAgendaItemsState[dateString]) {
            newAgendaItemsState[dateString] = [];
        }
    }
    events.forEach(event => {
      if (!newAgendaItemsState[event.date]) {
        newAgendaItemsState[event.date] = [];
      }
      if (!newAgendaItemsState[event.date].find((i: MyAgendaItem) => i.id === event.id)) {
        newAgendaItemsState[event.date].push({
          id: event.id,
          name: event.title,
          day: event.date,
          height: (event.notes ? 110 : 70) + (event.startTime ? 20 : 0),
          startTime: event.startTime,
          endTime: event.endTime,
          notes: event.notes,
          color: event.color,
          reminderOffset: event.reminderOffset,
          notificationId: event.notificationId,
        } as MyAgendaItem);
      }
    });

    for (const dateKey in newAgendaItemsState) {
      newAgendaItemsState[dateKey].sort((a, b) => {
        const evA = a as MyAgendaItem;
        const evB = b as MyAgendaItem;
        if (evA.startTime && evB.startTime) return evA.startTime.localeCompare(evB.startTime);
        if (evA.startTime) return -1;
        if (evB.startTime) return 1;
        return evA.name.localeCompare(evB.name);
      });
    }
    if (JSON.stringify(agendaItems) !== JSON.stringify(newAgendaItemsState)) {
        setAgendaItems(newAgendaItemsState);
    }
  }, [events, agendaItems]);
  
  useEffect(() => {
    if (viewMode === 'agenda') {
      loadItemsForAgenda({ dateString: selectedDate, day: 0, month: 0, year: 0, timestamp: new Date(selectedDate).getTime()});
    }
  }, [events, viewMode, selectedDate, loadItemsForAgenda]);


   const renderAgendaItem = (reservation: AgendaEntry | undefined, isFirst: boolean) => {
     if(!reservation) return null;
     const item = reservation as MyAgendaItem;
     const originalEventForModal: CalendarEvent = {
         id: item.id,
         title: item.name,
         date: item.day,
         startTime: item.startTime,
         endTime: item.endTime,
         notes: item.notes,
         color: item.color,
         reminderOffset: item.reminderOffset,
         notificationId: item.notificationId,
     };
     return (
       <TouchableOpacity
         style={[styles.agendaItem, { height: item.height, borderLeftColor: item.color || '#007AFF' }]}
         onPress={() => handleOpenModal(originalEventForModal)}
       >
         <Text style={styles.agendaItemTitle}>{item.name}</Text>
         {(item.startTime || item.endTime) && (
            <Text style={styles.agendaItemTime}>
                {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
            </Text>
         )}
         {item.notes && <Text style={styles.agendaItemNotes} numberOfLines={2}>{item.notes}</Text>}
       </TouchableOpacity>
     );
   };

   const renderEmptyAgendaDate = () => {
     return (
       <View style={styles.emptyDate}>
         <Text style={styles.emptyDateText}>No events scheduled</Text>
       </View>
     );
   };


   const renderCalendarEventItem = ({ item }: { item: CalendarEvent }) => (
     <TouchableOpacity onPress={() => handleOpenModal(item)}>
        <View style={[styles.eventItem, { borderLeftColor: item.color || '#007AFF', borderLeftWidth: 4 }]}>
            <View style={styles.eventItemContent}>
                <Text style={styles.eventItemTitle}>{item.title}</Text>
                {(item.startTime || item.endTime) && (
                    <Text style={styles.eventItemTime}>
                        {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
                    </Text>
                )}
                {item.notes && <Text style={styles.eventItemNotes} numberOfLines={2}>{item.notes}</Text>}
            </View>
            <TouchableOpacity onPress={() => handleDeleteEvent(item.id)} style={styles.deleteEventButtonContainer}>
                <Text style={styles.deleteEventButton}>🗑️</Text>
            </TouchableOpacity>
        </View>
     </TouchableOpacity>
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
            headerTitle: viewMode === 'calendar' ? 'Calendar View' : 'Agenda View',
            headerRight: () => (
                <View style={styles.headerButtonsContainer}>
                    <TouchableOpacity onPress={() => setViewMode(viewMode === 'calendar' ? 'agenda' : 'calendar')} style={styles.headerButton}>
                        <Text style={styles.headerButtonText}>{viewMode === 'calendar' ? 'Agenda' : 'Calendar'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleOpenModal(undefined, selectedDate)} style={styles.headerButton}>
                        <Text style={styles.headerButtonText}>Add</Text>
                    </TouchableOpacity>
                </View>
            )
        }}
      />

    {viewMode === 'calendar' ? (
        <>
            <Calendar
                style={styles.calendar}
                current={selectedDate}
                onDayPress={handleDayPress}
                markedDates={markedDatesForCalendar}
                markingType={'multi-dot'}
                theme={{
                    arrowColor: '#007AFF',
                    todayTextColor: '#007AFF',
                    selectedDayBackgroundColor: '#007AFF',
                    selectedDayTextColor: '#ffffff',
                }}
                key={`calendar-${selectedDate}-${events.length}`} // Forcing re-render on event changes
            />
            <View style={styles.eventListContainer}>
                <Text style={styles.eventListHeader}>
                Events for {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
                {selectedDayEventsForCalendarView.length === 0 ? (
                <Text style={styles.noEventsText}>No events for this day.</Text>
                ) : (
                <FlatList
                    data={selectedDayEventsForCalendarView}
                    renderItem={renderCalendarEventItem}
                    keyExtractor={item => item.id}
                />
                )}
            </View>
        </>
      ) : (
        <Agenda
            items={agendaItems}
            loadItemsForMonth={loadItemsForAgenda}
            selected={today}
            renderItem={renderAgendaItem}
            renderEmptyDate={renderEmptyAgendaDate}
            rowHasChanged={(r1: MyAgendaItem, r2: MyAgendaItem) => r1.id !== r2.id || r1.name !== r2.name || r1.startTime !== r2.startTime }
            showClosingKnob={true}
            theme={{
                agendaKnobColor: '#007AFF',
                agendaDayTextColor: '#007AFF',
                agendaDayNumColor: '#007AFF',
                agendaTodayColor: '#FF9500',
                selectedDayBackgroundColor: '#007AFF',
            }}
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
            <ScrollView contentContainerStyle={styles.modalScrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editingEvent ? 'Edit Event' : `Add Event for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {month: 'long', day: 'numeric' })}`}</Text>
                <TextInput style={styles.modalInput} placeholder="Event Title" value={eventTitle} onChangeText={setEventTitle} autoFocus={true}/>
                <View style={styles.rowInputContainer}>
                    <TextInput style={[styles.modalInput, styles.rowInputHalf, {marginRight: 5}]} placeholder="Start Time (HH:MM)" value={eventStartTime} onChangeText={setEventStartTime} maxLength={5}/>
                    <TextInput style={[styles.modalInput, styles.rowInputHalf, {marginLeft: 5}]} placeholder="End Time (HH:MM)" value={eventEndTime} onChangeText={setEventEndTime} maxLength={5}/>
                </View>
                <TextInput style={[styles.modalInput, styles.notesInput]} placeholder="Notes" value={eventNotes} onChangeText={setEventNotes} multiline numberOfLines={3}/>

                <Text style={styles.colorPickerLabel}>Event Color:</Text>
                <View style={styles.colorPickerContainer}>
                    {PREDEFINED_EVENT_COLORS.map(color => (
                        <TouchableOpacity
                            key={color}
                            style={[styles.colorButton, { backgroundColor: color }, eventColor === color && styles.selectedColorButton]}
                            onPress={() => setEventColor(color)}
                        />
                    ))}
                </View>

                <Text style={styles.colorPickerLabel}>Reminder:</Text>
                 <View style={styles.reminderOptionsContainer}>
                    {REMINDER_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.label}
                            style={[styles.reminderButton, eventReminderOffset === opt.value && styles.selectedReminderButton]}
                            onPress={() => setEventReminderOffset(opt.value)}
                        >
                            <Text style={[styles.reminderButtonText, eventReminderOffset === opt.value && styles.selectedReminderButtonText]}>{opt.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveEvent}>
                    <Text style={styles.modalButtonText}>{editingEvent ? 'Save Changes' : 'Add Event'}</Text>
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
  headerButtonsContainer: {
      flexDirection: 'row',
  },
  headerButton: {
    marginHorizontal: 8,
    paddingVertical: 5,
    paddingHorizontal: 5,
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
      paddingHorizontal: 12,
      borderRadius: 5,
      marginBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      elevation: 1,
  },
  eventItemContent: {
      flex: 1,
      marginRight: 10,
  },
  eventItemTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: '#343a40',
  },
  eventItemTime: {
      fontSize: 13,
      color: '#6c757d',
      marginTop: 2,
  },
  eventItemNotes: {
      fontSize: 13,
      color: '#868e96',
      marginTop: 3,
      fontStyle: 'italic',
  },
  deleteEventButtonContainer: {
      padding: 8,
  },
  deleteEventButton: {
      fontSize: Platform.OS === 'ios' ? 20 : 18,
      color: '#dc3545',
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
  rowInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowInputHalf: {
    flex: 1,
  },
  notesInput: {
      minHeight: 60,
      textAlignVertical: 'top',
  },
  colorPickerLabel: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 8,
    marginTop: 5, // Spazio sopra
    fontWeight: '500',
  },
  colorPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15, // Spazio sotto
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorButton: {
    borderColor: '#333333',
    transform: [{scale: 1.1}],
  },
  reminderOptionsContainer: {
    marginBottom: 25,
  },
  reminderButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedReminderButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  reminderButtonText: {
    fontSize: 16,
    color: '#495057',
  },
  selectedReminderButtonText: {
    color: '#ffffff',
    fontWeight: '600',
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
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#495057',
  },
  agendaItem: {
    backgroundColor: 'white',
    flex: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginTop: 17,
    borderLeftWidth: 4,
  },
  agendaItemTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333'
  },
  agendaItemTime: {
      fontSize: 13,
      color: '#555',
      marginTop: 3,
  },
  agendaItemNotes: {
      fontSize: 13,
      color: '#777',
      marginTop: 3,
      fontStyle: 'italic',
  },
  emptyDate: {
    height: 60,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 17,
    marginRight: 10,
    borderRadius: 5,
    backgroundColor: '#f8f9fa',
  },
  emptyDateText: {
    color: '#adb5bd',
    fontSize: 14,
  },
});
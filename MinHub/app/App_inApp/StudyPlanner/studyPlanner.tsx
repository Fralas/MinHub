
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Button,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type EventPriority = 'Alta' | 'Media' | 'Bassa';
type AppTheme = 'light' | 'dark';

interface Course {
  id: string;
  name: string;
  color?: string;
}

interface Note {
  id: string;
  courseId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  completed?: boolean;
}

interface StudyEvent {
  id: string;
  title: string;
  date: string; 
  time?: string; 
  description?: string;
  courseId?: string; 
  priority?: EventPriority;
}

const COURSES_KEY = '@StudyPlatform:courses_v6';
const NOTES_KEY = '@StudyPlatform:notes_v6';
const EVENTS_KEY = '@StudyPlatform:studyEvents_v6';
const THEME_KEY = '@StudyPlatform:theme_v6';


const saveData = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Errore nel salvataggio dei dati', key, e);
  }
};

const loadData = async (key: string, defaultValue: any = []) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
  } catch (e) {
    console.error('Errore nel caricamento dei dati', key, e);
    return defaultValue;
  }
};

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function StudyPlatformScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [studyEvents, setStudyEvents] = useState<StudyEvent[]>([]);
  const [appTheme, setAppTheme] = useState<AppTheme>('light');
  
  const [isLoading, setIsLoading] = useState(true);

  const [isCourseModalVisible, setIsCourseModalVisible] = useState(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);

  const [currentCourseName, setCurrentCourseName] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [currentNoteTitle, setCurrentNoteTitle] = useState('');
  const [currentNoteContent, setCurrentNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteSelectedCourseId, setNoteSelectedCourseId] = useState<string | null>(null);
  const [currentNoteCompleted, setCurrentNoteCompleted] = useState(false);

  const [currentEventTitle, setCurrentEventTitle] = useState('');
  const [currentEventDate, setCurrentEventDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentEventDescription, setCurrentEventDescription] = useState('');
  const [eventSelectedCourseId, setEventSelectedCourseId] = useState<string | null>(null);
  const [currentEventPriority, setCurrentEventPriority] = useState<EventPriority>('Media');
  const [editingEvent, setEditingEvent] = useState<StudyEvent | null>(null);
  
  const [selectedCourseIdForNotes, setSelectedCourseIdForNotes] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadScreenData = async () => {
        setIsLoading(true);
        const loadedCourses = await loadData(COURSES_KEY, []);
        const loadedNotes = await loadData(NOTES_KEY, []);
        const loadedEvents = await loadData(EVENTS_KEY, []);
        const loadedTheme = await loadData(THEME_KEY, 'light');
        
        setCourses(loadedCourses);
        setNotes(loadedNotes);
        setStudyEvents(loadedEvents.sort((a: StudyEvent, b: StudyEvent) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setAppTheme(loadedTheme as AppTheme);
        setIsLoading(false);
      };
      loadScreenData();
    }, []) 
  );
  
  const syncWithCloud = async () => {
    Alert.alert('Sincronizzazione', 'Funzione di sincronizzazione cloud non ancora implementata.');
  };
  
  const exportToPDF = async () => {
    Alert.alert('Esportazione PDF', 'Funzione di esportazione PDF non ancora implementata.');
  };
  
  const handleSaveCourse = async () => {
    if (!currentCourseName.trim()) {
      Alert.alert('Errore', 'Il nome del corso non può essere vuoto.');
      return;
    }
    let updatedCourses;
    if (editingCourse) {
      updatedCourses = courses.map(c =>
        c.id === editingCourse.id ? { ...c, name: currentCourseName.trim() } : c
      );
    } else {
      const newCourse: Course = {
        id: Date.now().toString(),
        name: currentCourseName.trim(),
      };
      updatedCourses = [...courses, newCourse];
    }
    setCourses(updatedCourses);
    await saveData(COURSES_KEY, updatedCourses);
    closeCourseModal();
  };

  const openCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCurrentCourseName(course.name);
    } else {
      setEditingCourse(null);
      setCurrentCourseName('');
    }
    setIsCourseModalVisible(true);
  };

  const closeCourseModal = () => {
    setIsCourseModalVisible(false);
    setCurrentCourseName('');
    setEditingCourse(null);
  };

  const handleDeleteCourse = async (courseId: string) => {
    Alert.alert('Conferma Eliminazione', 'Sei sicuro di voler eliminare questo corso e tutte le note e gli eventi associati?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          const updatedCourses = courses.filter(c => c.id !== courseId);
          const updatedNotes = notes.filter(n => n.courseId !== courseId);
          const updatedEvents = studyEvents.filter(e => e.courseId !== courseId);
          
          setCourses(updatedCourses);
          setNotes(updatedNotes);
          setStudyEvents(updatedEvents);
          
          await saveData(COURSES_KEY, updatedCourses);
          await saveData(NOTES_KEY, updatedNotes);
          await saveData(EVENTS_KEY, updatedEvents);
          
          if (selectedCourseIdForNotes === courseId) setSelectedCourseIdForNotes(null);
        },
      },
    ]);
  };

  const handleSaveNote = async () => {
    if (!currentNoteTitle.trim() || !noteSelectedCourseId) {
      Alert.alert('Errore', 'Titolo della nota e corso sono obbligatori.');
      return;
    }
    let updatedNotes;
    const now = new Date().toISOString();
    if (editingNote) {
      updatedNotes = notes.map(n =>
        n.id === editingNote.id
          ? { ...n, title: currentNoteTitle.trim(), content: currentNoteContent.trim(), courseId: noteSelectedCourseId, updatedAt: now, completed: currentNoteCompleted }
          : n
      );
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        courseId: noteSelectedCourseId,
        title: currentNoteTitle.trim(),
        content: currentNoteContent.trim(),
        createdAt: now,
        updatedAt: now,
        completed: currentNoteCompleted,
      };
      updatedNotes = [...notes, newNote];
    }
    setNotes(updatedNotes);
    await saveData(NOTES_KEY, updatedNotes);
    closeNoteModal();
  };

  const openNoteModal = (note?: Note, courseId?: string) => {
    setNoteSelectedCourseId(note ? note.courseId : courseId || selectedCourseIdForNotes || (courses.length > 0 ? courses[0].id : null));
    if (note) {
      setEditingNote(note);
      setCurrentNoteTitle(note.title);
      setCurrentNoteContent(note.content);
      setCurrentNoteCompleted(note.completed || false);
    } else {
      setEditingNote(null);
      setCurrentNoteTitle('');
      setCurrentNoteContent('');
      setCurrentNoteCompleted(false);
    }
    setIsNoteModalVisible(true);
  };

  const closeNoteModal = () => {
    setIsNoteModalVisible(false);
    setCurrentNoteTitle('');
    setCurrentNoteContent('');
    setEditingNote(null);
    setNoteSelectedCourseId(null);
    setCurrentNoteCompleted(false);
  };

  const handleDeleteNote = async (noteId: string) => {
     Alert.alert('Conferma Eliminazione', 'Sei sicuro di voler eliminare questa nota?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
            const updatedNotes = notes.filter(n => n.id !== noteId);
            setNotes(updatedNotes);
            await saveData(NOTES_KEY, updatedNotes);
        },
      },
    ]);
  };

  const handleSaveEvent = async () => {
    if (!currentEventTitle.trim()) {
      Alert.alert('Errore', 'Il titolo dell\'evento è obbligatorio.');
      return;
    }
    let updatedEvents;
    const formattedDate = formatDateToYYYYMMDD(currentEventDate);
    if (editingEvent) {
      updatedEvents = studyEvents.map(e =>
        e.id === editingEvent.id
          ? { ...e, title: currentEventTitle.trim(), date: formattedDate, description: currentEventDescription.trim(), courseId: eventSelectedCourseId || undefined, priority: currentEventPriority }
          : e
      );
    } else {
      const newEvent: StudyEvent = {
        id: Date.now().toString(),
        title: currentEventTitle.trim(),
        date: formattedDate,
        description: currentEventDescription.trim(),
        courseId: eventSelectedCourseId || undefined,
        priority: currentEventPriority,
      };
      updatedEvents = [...studyEvents, newEvent];
    }
    updatedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setStudyEvents(updatedEvents);
    await saveData(EVENTS_KEY, updatedEvents);
    closeEventModal();
  };

  const openEventModal = (event?: StudyEvent) => {
    if (event) {
      setEditingEvent(event);
      setCurrentEventTitle(event.title);
      setCurrentEventDate(new Date(event.date + "T00:00:00"));
      setCurrentEventDescription(event.description || '');
      setEventSelectedCourseId(event.courseId || null);
      setCurrentEventPriority(event.priority || 'Media');
    } else {
      setEditingEvent(null);
      setCurrentEventTitle('');
      setCurrentEventDate(new Date());
      setCurrentEventDescription('');
      setEventSelectedCourseId(courses.length > 0 ? courses[0].id : null);
      setCurrentEventPriority('Media');
    }
    setIsEventModalVisible(true);
  };

  const closeEventModal = () => {
    setIsEventModalVisible(false);
    setCurrentEventTitle('');
    setCurrentEventDate(new Date());
    setCurrentEventDescription('');
    setEditingEvent(null);
    setEventSelectedCourseId(null);
    setCurrentEventPriority('Media');
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert('Conferma Eliminazione', 'Sei sicuro di voler eliminare questo evento?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
            const updatedEvents = studyEvents.filter(e => e.id !== eventId);
            setStudyEvents(updatedEvents);
            await saveData(EVENTS_KEY, updatedEvents);
        },
      },
    ]);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); 
    if (selectedDate) {
      setCurrentEventDate(selectedDate);
    }
  };
  
  const toggleTheme = async () => {
    const newTheme = appTheme === 'light' ? 'dark' : 'light';
    setAppTheme(newTheme);
    await saveData(THEME_KEY, newTheme);
  };

  const filteredNotes = selectedCourseIdForNotes
    ? notes.filter(note => note.courseId === selectedCourseIdForNotes)
    : notes;
  
  const getPriorityStyle = (priority?: EventPriority) => {
    if (!priority) return {};
    switch (priority) {
        case 'Alta': return styles.priorityHigh;
        case 'Media': return styles.priorityMedium;
        case 'Bassa': return styles.priorityLow;
        default: return {};
    }
  };

  const dynamicStyles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: appTheme === 'light' ? '#F0F4F8' : '#2c3e50',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: appTheme === 'light' ? '#2c3e50' : '#ECF0F1',
        textAlign: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: appTheme === 'light' ? '#34495e' : '#BDC3C7',
    },
    emptyText: {
        textAlign: 'center',
        color: appTheme === 'light' ? '#7F8C8D' : '#95A5A6',
        marginTop: 15,
        marginBottom: 10,
        fontSize: 15,
    },
    listItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: appTheme === 'light' ? '#2C3E50' : '#ECF0F1',
        flexShrink: 1, 
    },
    noteContentPreview: {
        fontSize: 13,
        color: appTheme === 'light' ? '#7F8C8D' : '#BDC3C7',
        marginTop: 4,
    },
    eventDate: {
        fontSize: 13,
        color: appTheme === 'light' ? '#7F8C8D' : '#BDC3C7',
        marginTop: 2,
    },
    filterLabel: {
        marginRight: 8,
        fontSize: 15,
        color: appTheme === 'light' ? '#34495e' : '#BDC3C7',
        marginBottom: 8, 
        alignSelf: 'center',
    },
    themeSwitchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: 15,
        paddingBottom:10,
    },
    themeSwitchLabel: {
        marginRight: 10,
        fontSize: 16,
        color: appTheme === 'light' ? '#2c3e50' : '#ECF0F1',
    }
  });


  if (isLoading) {
    return <View style={styles.centered}><Text style={{color: appTheme === 'light' ? '#2c3e50' : '#ECF0F1'}}>Caricamento...</Text></View>;
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={dynamicStyles.themeSwitchContainer}>
            <Text style={dynamicStyles.themeSwitchLabel}>Tema Scuro</Text>
            <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={appTheme === 'dark' ? "#f5dd4b" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleTheme}
                value={appTheme === 'dark'}
            />
        </View>
        <Text style={dynamicStyles.headerTitle}>Piattaforma Studio</Text>

        <View style={styles.sectionContainer}>
            <TouchableOpacity onPress={syncWithCloud} style={styles.utilityButton}>
                <Text style={styles.utilityButtonText}>Sincronizza Cloud</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={exportToPDF} style={styles.utilityButton}>
                <Text style={styles.utilityButtonText}>Esporta in PDF</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>I Miei Corsi</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => openCourseModal()}>
              <Text style={styles.addButtonText}>+ Corso</Text>
            </TouchableOpacity>
          </View>
          {courses.length === 0 ? (
            <Text style={dynamicStyles.emptyText}>Nessun corso aggiunto.</Text>
          ) : (
            <FlatList
              data={courses}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                    <View style={styles.courseItemInfo}>
                        <Text style={dynamicStyles.listItemText}>{item.name}</Text>
                    </View>
                  <View style={styles.listItemActions}>
                    <TouchableOpacity onPress={() => openCourseModal(item)} style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>Modifica</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteCourse(item.id)} style={styles.actionButton}>
                      <Text style={[styles.actionButtonText, styles.deleteText]}>Elimina</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              scrollEnabled={false} 
            />
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>Appunti</Text>
            <TouchableOpacity 
                style={[styles.addButton, courses.length === 0 && styles.disabledButton]} 
                onPress={() => openNoteModal(undefined, selectedCourseIdForNotes || (courses.length > 0 ? courses[0].id : undefined) )}
                disabled={courses.length === 0}
            >
              <Text style={styles.addButtonText}>+ Nota</Text>
            </TouchableOpacity>
          </View>
          {courses.length > 0 && (
            <View style={styles.filterContainer}>
              <Text style={dynamicStyles.filterLabel}>Filtra per corso:</Text>
              <TouchableOpacity onPress={() => setSelectedCourseIdForNotes(null)} style={[styles.courseFilterButton, !selectedCourseIdForNotes && styles.courseFilterButtonActive]}>
                  <Text style={styles.courseFilterButtonText}>Tutti</Text>
              </TouchableOpacity>
              {courses.map(course => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    styles.courseFilterButton,
                    selectedCourseIdForNotes === course.id && styles.courseFilterButtonActive,
                  ]}
                  onPress={() => setSelectedCourseIdForNotes(course.id)}>
                  <Text style={styles.courseFilterButtonText}>{course.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {filteredNotes.length === 0 ? (
             <Text style={dynamicStyles.emptyText}>
                {courses.length === 0 ? "Aggiungi prima un corso." : 
                 selectedCourseIdForNotes ? "Nessun appunto per questo corso." : "Nessun appunto."}
            </Text>
          ) : (
            <FlatList
              data={filteredNotes}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={[styles.listItem, item.completed && styles.completedNote]}>
                  <View style={styles.noteInfoContainer}>
                    <Text style={dynamicStyles.listItemText}>{item.title}</Text>
                    <Text style={dynamicStyles.noteContentPreview}>
                        {item.content.substring(0,50)}{item.content.length > 50 ? "..." : ""}
                    </Text>
                    <Text style={styles.noteCourseName}>
                        Corso: {courses.find(c=>c.id === item.courseId)?.name || "N/D"}
                    </Text>
                  </View>
                  <View style={styles.listItemActions}>
                    <TouchableOpacity onPress={() => openNoteModal(item)} style={styles.actionButton}>
                       <Text style={styles.actionButtonText}>Vedi/Mod</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteNote(item.id)} style={styles.actionButton}>
                       <Text style={[styles.actionButtonText, styles.deleteText]}>Elimina</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>Scadenze ed Eventi</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => openEventModal()}>
              <Text style={styles.addButtonText}>+ Evento</Text>
            </TouchableOpacity>
          </View>
          {studyEvents.length === 0 ? (
            <Text style={dynamicStyles.emptyText}>Nessuna scadenza o evento.</Text>
          ) : (
            <FlatList
              data={studyEvents}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={[styles.listItem, getPriorityStyle(item.priority)]}>
                    <View style={styles.eventInfoContainer}>
                        <Text style={dynamicStyles.listItemText}>{item.title}</Text>
                        <Text style={dynamicStyles.eventDate}>{new Date(item.date  + "T00:00:00").toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                        {item.courseId && <Text style={styles.noteCourseName}>Corso: {courses.find(c=>c.id === item.courseId)?.name || "N/D"}</Text>}
                        {item.priority && <Text style={[styles.priorityTextPill, getPriorityStyle(item.priority)]}>{item.priority}</Text>}
                        {item.description && <Text style={dynamicStyles.noteContentPreview}>{item.description}</Text>}
                    </View>
                  <View style={styles.listItemActions}>
                  <TouchableOpacity onPress={() => openEventModal(item)} style={styles.actionButton}>
                       <Text style={styles.actionButtonText}>Modifica</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteEvent(item.id)} style={styles.actionButton}>
                       <Text style={[styles.actionButtonText, styles.deleteText]}>Elimina</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isCourseModalVisible}
          onRequestClose={closeCourseModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingCourse ? 'Modifica Corso' : 'Nuovo Corso'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome del corso"
                value={currentCourseName}
                onChangeText={setCurrentCourseName}
                placeholderTextColor={appTheme === 'dark' ? '#95A5A6' : '#BDC3C7'}
              />
              <View style={styles.modalActions}>
                <Button title="Annulla" onPress={closeCourseModal} color="#FF6347" />
                <Button title={editingCourse ? 'Salva Modifiche' : 'Aggiungi Corso'} onPress={handleSaveCourse} />
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isNoteModalVisible}
          onRequestClose={closeNoteModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingNote ? 'Modifica Nota' : 'Nuova Nota'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Titolo della nota"
                value={currentNoteTitle}
                onChangeText={setCurrentNoteTitle}
                placeholderTextColor={appTheme === 'dark' ? '#95A5A6' : '#BDC3C7'}
              />
               <ScrollView style={styles.pickerContainerScrollView} horizontal={true} showsHorizontalScrollIndicator={false}>
                <Text style={dynamicStyles.filterLabel}>Corso:</Text>
                {courses.length > 0 ? (
                    courses.map(course => (
                        <TouchableOpacity 
                            key={course.id} 
                            style={[styles.coursePickerButton, noteSelectedCourseId === course.id && styles.coursePickerButtonSelected]}
                            onPress={() => setNoteSelectedCourseId(course.id)}
                        >
                            <Text style={styles.coursePickerButtonText}>{course.name}</Text>
                        </TouchableOpacity>
                    ))
                ) : <Text style={styles.emptyPickerText}> Nessun corso. Creane uno.</Text>}
               </ScrollView>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Contenuto della nota..."
                value={currentNoteContent}
                onChangeText={setCurrentNoteContent}
                multiline
                numberOfLines={4}
                placeholderTextColor={appTheme === 'dark' ? '#95A5A6' : '#BDC3C7'}
              />
              <View style={styles.completedToggleContainer}>
                  <Text style={dynamicStyles.filterLabel}>Completata:</Text>
                  <TouchableOpacity 
                    style={[styles.toggleButton, currentNoteCompleted && styles.toggleButtonActive]}
                    onPress={() => setCurrentNoteCompleted(!currentNoteCompleted)}
                  >
                      <Text style={styles.toggleButtonText}>{currentNoteCompleted ? "Sì" : "No"}</Text>
                  </TouchableOpacity>
              </View>
              <View style={styles.modalActions}>
                <Button title="Annulla" onPress={closeNoteModal} color="#FF6347" />
                <Button title={editingNote ? 'Salva Modifiche' : 'Aggiungi Nota'} onPress={handleSaveNote} disabled={!noteSelectedCourseId}/>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
            animationType="slide"
            transparent={true}
            visible={isEventModalVisible}
            onRequestClose={closeEventModal}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editingEvent ? 'Modifica Evento' : 'Nuovo Evento'}</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Titolo dell'evento"
                    value={currentEventTitle}
                    onChangeText={setCurrentEventTitle}
                    placeholderTextColor={appTheme === 'dark' ? '#95A5A6' : '#BDC3C7'}
                />
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                    <Text style={styles.datePickerButtonText}>
                        Data: {currentEventDate.toLocaleDateString('it-IT')}
                    </Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                    value={currentEventDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    />
                )}
                <ScrollView style={styles.pickerContainerScrollView} horizontal={true} showsHorizontalScrollIndicator={false}>
                    <Text style={dynamicStyles.filterLabel}>Corso (Opz.):</Text>
                    {courses.length > 0 ? (
                        courses.map(course => (
                            <TouchableOpacity 
                                key={course.id} 
                                style={[styles.coursePickerButton, eventSelectedCourseId === course.id && styles.coursePickerButtonSelected]}
                                onPress={() => setEventSelectedCourseId(eventSelectedCourseId === course.id ? null : course.id)}
                            >
                                <Text style={styles.coursePickerButtonText}>{course.name}</Text>
                            </TouchableOpacity>
                        ))
                    ) : <Text style={styles.emptyPickerText}> Nessun corso disponibile.</Text>}
                </ScrollView>
                <View style={styles.pickerContainer}>
                    <Text style={dynamicStyles.filterLabel}>Priorità:</Text>
                    <View style={styles.priorityOptionsContainer}>
                        {(['Bassa', 'Media', 'Alta'] as EventPriority[]).map(prio => (
                             <TouchableOpacity 
                                key={prio} 
                                style={[styles.coursePickerButton, currentEventPriority === prio && styles.coursePickerButtonSelected]}
                                onPress={() => setCurrentEventPriority(prio)}
                            >
                                <Text style={styles.coursePickerButtonText}>{prio}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <TextInput
                    style={[styles.input, styles.textAreaShort]}
                    placeholder="Descrizione (opzionale)"
                    value={currentEventDescription}
                    onChangeText={setCurrentEventDescription}
                    multiline
                    placeholderTextColor={appTheme === 'dark' ? '#95A5A6' : '#BDC3C7'}
                />
                <View style={styles.modalActions}>
                    <Button title="Annulla" onPress={closeEventModal} color="#FF6347" />
                    <Button title={editingEvent ? 'Salva Modifiche' : 'Aggiungi Evento'} onPress={handleSaveEvent} />
                </View>
                </View>
            </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 15,
    paddingBottom: 50,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 10,
  },
  addButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
  },
  listItem: {
    backgroundColor: '#ECF0F1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteInfoContainer:{
    flex: 1,
    marginRight: 8, 
  },
  eventInfoContainer:{
    flex: 1, 
    marginRight: 8,
  },
  listItemActions: {
    flexDirection: 'column', 
    alignItems: 'flex-end',
  },
  actionButton: {
    marginLeft: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: '#95A5A6',
    marginTop: 4, 
    minWidth: 70, 
    alignItems: 'center', 
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  deleteText: {
    color: '#E74C3C', 
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#2c3e50', 
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textAreaShort: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 20, 
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 15,
  },
  courseFilterButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#ECF0F1',
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  courseFilterButtonActive: {
    backgroundColor: '#3498DB',
  },
  courseFilterButtonText: {
    color: '#2C3E50', 
    fontSize: 13,
  },
  noteCourseName: {
    fontSize: 12,
    color: '#3498DB',
    fontStyle: 'italic',
    marginTop: 4,
  },
  pickerContainerScrollView: { 
    maxHeight: 50,
    marginBottom: 15,
    flexDirection: 'row',
  },
  pickerContainer: { 
    marginBottom: 15,
  },
  coursePickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#ECF0F1',
    marginRight: 8, 
    alignItems: 'center',
    justifyContent: 'center',
    height: 36, 
  },
  coursePickerButtonSelected: {
    backgroundColor: '#3498DB',
  },
  coursePickerButtonText:{
    color: '#2C3E50',
    fontSize: 13,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  utilityButton: {
    backgroundColor: '#1ABC9C',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  utilityButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  courseItemInfo: {
    flex: 1,
  },
  completedNote: {
    backgroundColor: '#D5F5E3', 
    borderColor: '#ABEBC6',
    borderWidth:1,
  },
  completedToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
  },
  toggleButton: {
    marginLeft: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#BDC3C7',
  },
  toggleButtonActive: {
    backgroundColor: '#2ECC71',
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyPickerText: {
    alignSelf: 'center',
    color: '#7F8C8D',
    marginLeft: 5,
  },
  priorityOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    justifyContent: 'space-around',
  },
  priorityTextPill: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    overflow: 'hidden', 
    color: 'white',
  },
  priorityHigh: { backgroundColor: '#E74C3C' },
  priorityMedium: { backgroundColor: '#F39C12' },
  priorityLow: { backgroundColor: '#3498DB' },
});
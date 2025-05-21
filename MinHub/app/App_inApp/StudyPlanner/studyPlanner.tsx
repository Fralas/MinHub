import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Button,
    FlatList,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

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
}

interface StudyEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  courseId?: string;
}

const COURSES_KEY = '@StudyPlatform:courses';
const NOTES_KEY = '@StudyPlatform:notes';
const EVENTS_KEY = '@StudyPlatform:studyEvents';

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
  const [isLoading, setIsLoading] = useState(true);

  const [currentCourseName, setCurrentCourseName] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);



  useFocusEffect(
    useCallback(() => {
      const loadScreenData = async () => {
        setIsLoading(true);
        const loadedCourses = await loadData(COURSES_KEY, []);
        const loadedNotes = await loadData(NOTES_KEY, []);
        const loadedEvents = await loadData(EVENTS_KEY, []);
        setCourses(loadedCourses);
        setNotes(loadedNotes);
        setStudyEvents(loadedEvents.sort((a: StudyEvent, b: StudyEvent) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setIsLoading(false);
      };

      loadScreenData();


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
          const updatedEvents = studyEvents.filter(e => e.courseId !== courseId);
          setCourses(updatedCourses);
          setNotes(updatedNotes);
          await saveData(COURSES_KEY, updatedCourses);
          await saveData(NOTES_KEY, updatedNotes);
          if (selectedCourseIdForNotes === courseId) {
            setSelectedCourseIdForNotes(null);
          }
        },
      },
    ]);
  };



  const openEventModal = (event?: StudyEvent) => {
    if (event) {
      setEditingEvent(event.t);
      setCurrentEventTitle(event.title);
      setCurrentEventDate(new Date(event.date + "T00:00:00"));
      setCurrentEventDescription(event.description || '');
    } else {
      setEditingEvent(null);
      setCurrentEventTitle('');
      setCurrentEventDate(new Date());
      setCurrentEventDescription('');
      setEventSelectedCourseId(courses.length > 0 ? courses[0].id : null);
    }
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



  const filteredNotes = selectedCourseIdForNotes
    ? notes.filter(note => note.courseId === selectedCourseIdForNotes)
    : notes;

  if (isLoading) {
    return <View style={styles.centered}><Text>Caricamento...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.headerTitle}>Piattaforma Studio</Text>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>I Miei Corsi</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => openCourseModal()}>
              <Text style={styles.addButtonText}>+ Corso</Text>
            </TouchableOpacity>
          </View>
          {courses.length === 0 ? (
            <Text style={styles.emptyText}>Nessun corso aggiunto. Inizia creandone uno!</Text>
          ) : (

       
        // ERR
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.noteInfoContainer}>
                    <Text style={styles.listItemText}>{item.title}</Text>
                    <Text style={styles.noteContentPreview}>
                        {item.content.substring(0,50)}{item.content.length > 50 ? "..." : ""}
                    </Text>
                    <Text style={styles.noteCourseName}>
                        Corso: {courses.find(c=>c.id === item.courseId)?.name || "N/D"}
                    </Text>
                  </View>
                  <View style={styles.listItemActions}>
                       <Text style={styles.actionButtonText}>Vedi/Mod</Text>
                       <Text style={[styles.actionButtonText, styles.deleteText]}>Elimina</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              scrollEnabled={false}
            />
          )}

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Scadenze ed Eventi</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => openEventModal()}>
              <Text style={styles.addButtonText}>+ Evento</Text>
            </TouchableOpacity>
          </View>
          {studyEvents.length === 0 ? (
            <Text style={styles.emptyText}>Nessuna scadenza o evento in programma.</Text>
          ) : (
            <FlatList
              data={studyEvents}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                    <View style={styles.eventInfoContainer}>
                        <Text style={styles.listItemText}>{item.title}</Text>
                        <Text style={styles.eventDate}>{new Date(item.date  + "T00:00:00").toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                        {item.courseId && <Text style={styles.noteCourseName}>Corso: {courses.find(c=>c.id === item.courseId)?.name || "N/D"}</Text>}
                        {item.description && <Text style={styles.noteContentPreview}>{item.description}</Text>}
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
              />
              <View style={styles.modalActions}>
                <Button title="Annulla" onPress={closeCourseModal} color="#FF6347" />
                <Button title={editingCourse ? 'Salva Modifiche' : 'Aggiungi Corso'} onPress={handleSaveCourse} />
              </View>
            </View>
          </View>
        </Modal>

        

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scrollContainer: {
    padding: 15,
    paddingBottom: 50,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34495e',
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
  listItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    flexShrink: 1, 
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
    minWidth: 60, 
    alignItems: 'center', 
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  deleteText: {
    color: '#E74C3C', 
  },
  emptyText: {
    textAlign: 'center',
    color: '#7F8C8D',
    marginTop: 15,
    marginBottom: 10,
    fontSize: 15,
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
    padding: 25,
    borderRadius: 10,
    width: '90%',
    maxHeight: '85%', 
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
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  textAreaShort: {
    height: 80,
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
  filterLabel: {
    marginRight: 8,
    fontSize: 15,
    color: '#34495e',
    marginBottom: 8, 
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
  },
  noteContentPreview: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 4,
  },
  noteCourseName: {
    fontSize: 12,
    color: '#3498DB',
    fontStyle: 'italic',
    marginTop: 4,
  },
  pickerContainerScrollView: { 
    maxHeight: 60, 
    marginBottom: 15,
    flexDirection: 'row',
  },
  pickerLabel: {
    fontSize: 16,
    color: '#34495e',
    marginRight: 8, 
    alignSelf: 'center', 
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
  eventDate: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
  }
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
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

type EventPriority = 'High' | 'Medium' | 'Low';
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

const COURSES_KEY = '@StudyPlatform:courses_v7';
const NOTES_KEY = '@StudyPlatform:notes_v7';
const EVENTS_KEY = '@StudyPlatform:studyEvents_v7';
const THEME_KEY = '@StudyPlatform:theme_v7';


const saveData = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving data', key, e);
  }
};

const loadData = async (key: string, defaultValue: any = []) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
  } catch (e) {
    console.error('Error loading data', key, e);
    return defaultValue;
  }
};

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `<span class="math-inline">\{year\}\-</span>{month}-${day}`;
};

const generateHtmlContent = (coursesData: Course[], studyEventsData: StudyEvent[], notesData: Note[]): string => {
  let coursesHtml = coursesData.length > 0 
    ? coursesData.map(course => {
        const eventsForCourse = studyEventsData
          .filter(event => event.courseId === course.id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const notesForCourse = notesData.filter(note => note.courseId === course.id);

        let eventsHtml = eventsForCourse.length > 0 
          ? `<h3>Study Events & Deadlines:</h3><ul>` + eventsForCourse.map(event => 
              `<li>
                <strong>${event.title}</strong> - ${new Date(event.date + "T00:00:00").toLocaleDateString('en-GB')}
                ${event.priority ? `<span class="priority-${event.priority}">(${event.priority} Priority)</span>` : ''}
                ${event.description ? `<p style="margin: 2px 0 5px 10px; font-size: 0.9em; color: #555;"><em>${event.description.replace(/\n/g, '<br>')}</em></p>` : ''}
              </li>`).join('') + `</ul>`
          : '<p>No scheduled events for this course.</p>';

        let notesHtml = notesForCourse.length > 0
          ? `<h3>Notes:</h3>` + notesForCourse.map(note => 
              `<div class="note-item">
                <h4>${note.title} <span class="math-inline">\{note\.completed ? '<span style\="color\: green;"\>\(Completed\)</span\>' \: ''\}</h4\>
<p\></span>{note.content.replace(/\n/g, '<br>')}</p>
              </div>`).join('')
          : '<p>No notes for this course.</p>';
          
        return `<div class="course-block"><h2>Course: <span class="math-inline">\{course\.name\}</h2\></span>{eventsHtml}${notesHtml}</div>`;
      }).join('')
    : '<p>No courses available to report.</p>';

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #641E7A; border-bottom: 2px solid #641E7A; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
          h2 { color: #641E7A; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #9B59B6; padding-bottom: 5px;}
          h3 { color: #4A0D5C; margin-top: 20px; margin-bottom: 8px; }
          h4 { color: #333; margin-top: 10px; margin-bottom: 3px; }
          p { margin: 4px 0; line-height: 1.5; }
          ul { list-style-type: disc; margin-left: 20px; padding-left: 0; }
          li { margin-bottom: 8px; }
          .course-block { margin-bottom: 25px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;}
          .note-item { background-color: #fff; border: 1px solid #eee; padding: 10px; border-radius: 4px; margin-bottom: 10px;}
          .priority-High { color: #E74C3C; font-weight: bold; }
          .priority-Medium { color: #F39C12; font-weight: bold; }
          .priority-Low { color: #2ECC71; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Study Planner Report</h1>
        ${coursesHtml}
      </body>
    </html>
  `;
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
  const [currentEventPriority, setCurrentEventPriority] = useState<EventPriority>('Medium');
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
    Alert.alert('Sync with Cloud', 'Cloud sync functionality is not yet implemented.');
  };
  
  const exportToPDF = async () => {
    const htmlContent = generateHtmlContent(courses, studyEvents, notes);
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      if (Platform.OS === "ios") {
         await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
         await Sharing.shareAsync(uri, { dialogTitle: 'Share or Save PDF', mimeType: 'application/pdf' });
      }
    } catch (error) {
      console.error('Failed to export to PDF', error);
      Alert.alert('Export Error', 'Could not export your data to PDF.');
    }
  };
  
  const handleSaveCourse = async () => {
    if (!currentCourseName.trim()) {
      Alert.alert('Error', 'Course name cannot be empty.');
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
    Alert.alert('Confirm Deletion', 'Are you sure you want to delete this course and all associated notes and events?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
      Alert.alert('Error', 'Note title and course are required.');
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
     Alert.alert('Confirm Deletion', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
      Alert.alert('Error', 'Event title is required.');
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
      setCurrentEventPriority(event.priority || 'Medium');
    } else {
      setEditingEvent(null);
      setCurrentEventTitle('');
      setCurrentEventDate(new Date());
      setCurrentEventDescription('');
      setEventSelectedCourseId(courses.length > 0 ? courses[0].id : null);
      setCurrentEventPriority('Medium');
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
    setCurrentEventPriority('Medium');
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert('Confirm Deletion', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
    const currentDate = selectedDate || currentEventDate;
    setShowDatePicker(Platform.OS === 'ios');
    setCurrentEventDate(currentDate);
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
        case 'High': return styles.priorityHigh;
        case 'Medium': return styles.priorityMedium;
        case 'Low': return styles.priorityLow;
        default: return {};
    }
  };

  const dynamicStyles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: appTheme === 'light' ? '#F0F4F8' : '#1A202C',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: appTheme === 'light' ? '#2c3e50' : '#E2E8F0',
        textAlign: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: appTheme === 'light' ? '#34495e' : '#A0AEC0',
    },
    emptyText: {
        textAlign: 'center',
        color: appTheme === 'light' ? '#7F8C8D' : '#718096',
        marginTop: 15,
        marginBottom: 10,
        fontSize: 15,
    },
    listItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: appTheme === 'light' ? '#2C3E50' : '#E2E8F0',
        flexShrink: 1, 
    },
    noteContentPreview: {
        fontSize: 13,
        color: appTheme === 'light' ? '#7F8C8D' : '#A0AEC0',
        marginTop: 4,
    },
    eventDate: {
        fontSize: 13,
        color: appTheme === 'light' ? '#7F8C8D' : '#A0AEC0',
        marginTop: 2,
    },
    filterLabel: {
        marginRight: 8,
        fontSize: 15,
        color: appTheme === 'light' ? '#34495e' : '#A0AEC0',
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
        color: appTheme === 'light' ? '#2c3e50' : '#E2E8F0',
    }
  });

  if (isLoading) {
    return <View style={[styles.centered, {backgroundColor: appTheme === 'light' ? '#F0F4F8' : '#1A202C'}]}><Text style={{color: appTheme === 'light' ? '#2c3e50' : '#E2E8F0'}}>Loading study planner...</Text></View>;
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={dynamicStyles.themeSwitchContainer}>
            <Text style={dynamicStyles.themeSwitchLabel}>Dark Mode</Text>
            <Switch
                trackColor={{ false: "#767577", true: appTheme === 'light' ? "#3498DB" : "#81b0ff" }}
                thumbColor={appTheme === 'dark' ? "#f5dd4b" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleTheme}
                value={appTheme === 'dark'}
            />
        </View>
        <Text style={dynamicStyles.headerTitle}>Study Planner</Text>

        <View style={styles.sectionContainer}>
            <TouchableOpacity onPress={exportToPDF} style={styles.utilityButton}>
                <Text style={styles.utilityButtonText}>Export to PDF</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>My Courses</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => openCourseModal()}>
              <Text style={styles.addButtonText}>+ Course</Text>
            </TouchableOpacity>
          </View>
          {courses.length === 0 ? (
            <Text style={dynamicStyles.emptyText}>No courses added yet.</Text>
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
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteCourse(item.id)} style={styles.actionButton}>
                      <Text style={[styles.actionButtonText, styles.deleteText]}>Delete</Text>
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
            <Text style={dynamicStyles.sectionTitle}>Notes</Text>
            <TouchableOpacity 
                style={[styles.addButton, courses.length === 0 && styles.disabledButton]} 
                onPress={() => openNoteModal(undefined, selectedCourseIdForNotes || (courses.length > 0 ? courses[0].id : undefined) )}
                disabled={courses.length === 0}
            >
              <Text style={styles.addButtonText}>+ Note</Text>
            </TouchableOpacity>
          </View>
          {courses.length > 0 && (
            <View style={styles.filterContainer}>
              <Text style={dynamicStyles.filterLabel}>Filter by course:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollView}>
                <TouchableOpacity onPress={() => setSelectedCourseIdForNotes(null)} style={[styles.courseFilterButton, !selectedCourseIdForNotes && styles.courseFilterButtonActive]}>
                    <Text style={[styles.courseFilterButtonText, !selectedCourseIdForNotes && styles.courseFilterButtonTextActive]}>All</Text>
                </TouchableOpacity>
                {courses.map(course => (
                    <TouchableOpacity
                    key={course.id}
                    style={[
                        styles.courseFilterButton,
                        selectedCourseIdForNotes === course.id && styles.courseFilterButtonActive,
                    ]}
                    onPress={() => setSelectedCourseIdForNotes(course.id)}>
                    <Text style={[styles.courseFilterButtonText, selectedCourseIdForNotes === course.id && styles.courseFilterButtonTextActive]}>{course.name}</Text>
                    </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {filteredNotes.length === 0 ? (
             <Text style={dynamicStyles.emptyText}>
                {courses.length === 0 ? "Add a course first to create notes." : 
                 selectedCourseIdForNotes ? "No notes for this course." : "No notes yet."}
            </Text>
          ) : (
            <FlatList
              data={filteredNotes}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={[styles.listItem, item.completed && styles.completedNote]}>
                  <View style={styles.noteInfoContainer}>
                    <Text style={dynamicStyles.listItemText}>{item.title}</Text>
                    <Text style={dynamicStyles.noteContentPreview} numberOfLines={2}>
                        {item.content}
                    </Text>
                    <Text style={styles.noteCourseName}>
                        Course: {courses.find(c=>c.id === item.courseId)?.name || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.listItemActions}>
                    <TouchableOpacity onPress={() => openNoteModal(item)} style={styles.actionButton}>
                       <Text style={styles.actionButtonText}>View/Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteNote(item.id)} style={styles.actionButton}>
                       <Text style={[styles.actionButtonText, styles.deleteText]}>Delete</Text>
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
            <Text style={dynamicStyles.sectionTitle}>Deadlines & Events</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => openEventModal()}>
              <Text style={styles.addButtonText}>+ Event</Text>
            </TouchableOpacity>
          </View>
          {studyEvents.length === 0 ? (
            <Text style={dynamicStyles.emptyText}>No deadlines or events scheduled.</Text>
          ) : (
            <FlatList
              data={studyEvents}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={[styles.listItem, getPriorityStyle(item.priority)]}>
                    <View style={styles.eventInfoContainer}>
                        <Text style={dynamicStyles.listItemText}>{item.title}</Text>
                        <Text style={dynamicStyles.eventDate}>{new Date(item.date  + "T00:00:00").toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                        {item.courseId && <Text style={styles.noteCourseName}>Course: {courses.find(c=>c.id === item.courseId)?.name || "N/A"}</Text>}
                        {item.priority && <Text style={[styles.priorityTextPill, getPriorityStyle(item.priority)]}>{item.priority}</Text>}
                        {item.description && <Text style={dynamicStyles.noteContentPreview} numberOfLines={2}>{item.description}</Text>}
                    </View>
                  <View style={styles.listItemActions}>
                  <TouchableOpacity onPress={() => openEventModal(item)} style={styles.actionButton}>
                       <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteEvent(item.id)} style={styles.actionButton}>
                       <Text style={[styles.actionButtonText, styles.deleteText]}>Delete</Text>
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
            <View style={[styles.modalContent, {backgroundColor: appTheme === 'light' ? '#FFFFFF' : '#2D3748'}]}>
              <Text style={[styles.modalTitle, {color: appTheme === 'light' ? '#2c3e50' : '#E2E8F0'}]}>{editingCourse ? 'Edit Course' : 'New Course'}</Text>
              <TextInput
                style={[styles.input, {backgroundColor: appTheme === 'light' ? '#FFFFFF' : '#4A5568', color: appTheme === 'light' ? '#2c3e50' : '#E2E8F0'}]}
                placeholder="Course name"
                value={currentCourseName}
                onChangeText={setCurrentCourseName}
                placeholderTextColor={appTheme === 'light' ? '#a0aec0' : '#718096'}
              />
              <View style={styles.modalActions}>
                <Button title="Cancel" onPress={closeCourseModal} color="#FF6347" />
                <Button title={editingCourse ? 'Save Changes' : 'Add Course'} onPress={handleSaveCourse} />
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
            <View style={[styles.modalContent, {backgroundColor: appTheme === 'light' ? '#FFFFFF' : '#2D3748'}]}>
              <Text style={[styles.modalTitle, {color: appTheme === 'light' ? '#2c3e50' : '#E2E8F0'}]}>{editingNote ? 'Edit Note' : 'New Note'}</Text>
              <TextInput
                style={[styles.input, {backgroundColor: appTheme === 'light' ? '#FFFFFF' : '#4A5568', color: appTheme === 'light' ? '#2c3e50' : '#E2E8F0'}]}
                placeholder="Note title"
                value={currentNoteTitle}
                onChangeText={setCurrentNoteTitle}
                placeholderTextColor={appTheme === 'light' ? '#a0aec0' : '#718096'}
              />
               <ScrollView style={styles.pickerContainerScrollView} horizontal={true} showsHorizontalScrollIndicator={false}>
                <Text style={dynamicStyles.filterLabel}>Course:</Text>
                {courses.length > 0 ? (
                    courses.map(course => (
                        <TouchableOpacity 
                            key={course.id} 
                            style={[styles.coursePickerButton, {backgroundColor: appTheme === 'light' ? (noteSelectedCourseId === course.id ? '#3498DB' : '#ECF0F1') : (noteSelectedCourseId === course.id ? '#3498DB' : '#4A5568') } ]}
                            onPress={() => setNoteSelectedCourseId(course.id)}
                        >
                            <Text style={[styles.coursePickerButtonText, {color: appTheme === 'light' ? '#2C3E50' : (noteSelectedCourseId === course.id ? '#FFFFFF' : '#A0AEC0')}]}>{course.name}</Text>
                        </TouchableOpacity>
                    ))
                ) : <Text style={[styles.emptyPickerText, {color: appTheme === 'light' ? '#7F8C8D' : '#A0AEC0'}]}> No courses. Create one.</Text>}
               </ScrollView>
              <TextInput
                style={[styles.input, styles.textArea, {backgroundColor: appTheme === 'light' ? '#FFFFFF' : '#4A5568', color: appTheme === 'light' ? '#2c3e50' : '#E2E8F0'}]}
                placeholder="Note content..."
                value={currentNoteContent}
                onChangeText={setCurrentNoteContent}
                multiline
                numberOfLines={4}
                placeholderTextColor={appTheme === 'light' ? '#a0aec0' : '#718096'}
              />
              <View style={styles.completedToggleContainer}>
                  <Text style={dynamicStyles.filterLabel}>Completed:</Text>
                  <TouchableOpacity 
                    style={[styles.toggleButton, currentNoteCompleted && styles.toggleButtonActive]}
                    onPress={() => setCurrentNoteCompleted(!currentNoteCompleted)}
                  >
                      <Text style={styles.toggleButtonText}>{currentNoteCompleted ? "Yes" : "No"}</Text>
                  </TouchableOpacity>
              </View>
              <View style={styles.modalActions}>
                <Button title="Cancel" onPress={closeNoteModal} color="#FF6347" />
                <Button title={editingNote ? 'Save Changes' : 'Add Note'} onPress={handleSaveNote} disabled={!noteSelectedCourseId}/>
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
                <View style={[styles.modalContent, {backgroundColor: appTheme === 'light' ? '#FFFFFF' : '#2D3748'}]}>
                <Text style={[styles.modalTitle, {color: appTheme === 'light' ? '#2c3e50' : '#E2E8F0'}]}>{editingEvent ? 'Edit Event' : 'New Event'}</Text>
                <TextInput
                    style={[styles.input, {backgroundColor: appTheme === 'light' ? '#FFFFFF' : '#4A5568', color: appTheme === 'light' ? '#2c3e50' : '#E2E8F0'}]}
                    placeholder="Event title"
                    value={currentEventTitle}
                    onChangeText={setCurrentEventTitle}
                    placeholderTextColor={appTheme === 'light' ? '#a0aec0' : '#718096'}
                />
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.datePickerButton, {backgroundColor: appTheme === 'light' ? '#ECF0F1' : '#4A5568'}]}>
                    <Text style={[styles.datePickerButtonText, {color: appTheme === 'light' ? '#2c3e50' : '#E2E8F0'}]}>
                        Date: {currentEventDate.toLocaleDateString('en-GB')}
                    </Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                    value={currentEventDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    // themeVariant={appTheme} // Potrebbe non essere supportato o causare problemi su alcune versioni
                    />
                )}
                <ScrollView style={styles.pickerContainerScrollView} horizontal={true} showsHorizontalScrollIndicator={false}>
                    <Text style={dynamicStyles.filterLabel}>Course (Opt.):</Text>
                    {courses.length > 0 ? (
                        courses.map(course => (
                            <TouchableOpacity 
                                key={course.id} 
                                style={[styles.coursePickerButton, {backgroundColor: appTheme === 'light' ? (eventSelectedCourseId === course.id ? '#3498DB' : '#ECF0F1') : (eventSelectedCourseId === course.id ? '#3498DB' : '#4A5568') }]}
                                onPress={() => setEventSelectedCourseId(eventSelectedCourseId === course.id ? null : course.id)}
                            >
                                <Text style={[styles.coursePickerButtonText, {color: appTheme === 'light' ? '#2C3E50' : (eventSelectedCourseId === course.id ? '#FFFFFF' : '#A0AEC0')}]}>{course.name}</Text>
                            </TouchableOpacity>
                        ))
                    ) : <Text style={[styles.emptyPickerText, {color: appTheme === 'light' ? '#7F8C8D' : '#A0AEC0'}]}> No courses available.</Text>}
                </ScrollView>
                <View style={styles.pickerContainer}>
                    <Text style={dynamicStyles.filterLabel}>Priority:</Text>
                    <View style={styles.priorityOptionsContainer}>
                        {(['Low', 'Medium', 'High'] as EventPriority[]).map(prio => (
                             <TouchableOpacity 
                                key={prio} 
                                style={[styles.coursePickerButton, {backgroundColor: appTheme === 'light' ? (currentEventPriority === prio ? '#3498DB' : '#ECF0F1') : (currentEventPriority === prio ? '#3498DB' : '#4A5568') }]}
                                onPress={() => setCurrentEventPriority(prio)}
                            >
                                <Text style={[styles.coursePickerButtonText, {color: appTheme === 'light' ? '#2C3E50' : (currentEventPriority === prio ? '#FFFFFF' : '#A0AEC0')}]}>{prio}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <TextInput
                    style={[styles.input, styles.textAreaShort, {backgroundColor: appTheme === 'light' ? '#FFFFFF' : '#4A5568', color: appTheme === 'light' ? '#2c3e50' : '#E2E8F0'}]}
                    placeholder="Description (optional)"
                    value={currentEventDescription}
                    onChangeText={setCurrentEventDescription}
                    multiline
                    placeholderTextColor={appTheme === 'light' ? '#a0aec0' : '#718096'}
                />
                <View style={styles.modalActions}>
                    <Button title="Cancel" onPress={closeEventModal} color="#FF6347" />
                    <Button title={editingEvent ? 'Save Changes' : 'Add Event'} onPress={handleSaveEvent} />
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
    backgroundColor: 'rgba(255,255,255,0.8)',
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
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 12,
  },
  addButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 8,
    paddingHorizontal: 15,
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
    backgroundColor: 'rgba(236, 240, 241,0.7)',
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#95A5A6',
    marginTop: 4, 
    minWidth: 75,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 25,
    borderRadius: 15,
    width: '90%',
    maxHeight: '90%', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
    fontSize: 16,
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
    marginTop: 25,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterScrollView: {
    maxHeight: 40,
  },
  courseFilterButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  courseFilterButtonActive: {
  },
  courseFilterButtonText: {
    fontSize: 13,
  },
  courseFilterButtonTextActive: {
    fontWeight: 'bold',
  },
  noteCourseName: {
    fontSize: 12,
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
    marginRight: 8, 
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderWidth: 1,
  },
  coursePickerButtonSelected: {
  },
  coursePickerButtonText:{
    fontSize: 13,
  },
  datePickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
  },
  utilityButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  utilityButtonText: {
    color: 'purple',
    fontWeight: '500',
    fontSize: 15,
  },
  courseItemInfo: {
    flex: 1,
  },
  completedNote: {
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
  },
  toggleButtonActive: {
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyPickerText: {
    alignSelf: 'center',
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    overflow: 'hidden', 
    color: 'white',
  },
  priorityHigh: { backgroundColor: '#E74C3C' },
  priorityMedium: { backgroundColor: '#F39C12' },
  priorityLow: { backgroundColor: '#3498DB' },
});
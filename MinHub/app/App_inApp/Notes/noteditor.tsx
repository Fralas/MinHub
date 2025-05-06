import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const NOTES_STORAGE_KEY = '@notesApp_notes_v1';

export default function NoteEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ noteId?: string }>();
  const noteId = params.noteId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [originalNote, setOriginalNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (noteId) {
      setIsLoading(true);
      setIsEditing(true);
      const loadNoteDetails = async () => {
        try {
          const storedNotes = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
          if (storedNotes) {
            const notes: Note[] = JSON.parse(storedNotes);
            const noteToEdit = notes.find(n => n.id === noteId);
            if (noteToEdit) {
              setTitle(noteToEdit.title);
              setContent(noteToEdit.content);
              setOriginalNote(noteToEdit);
            } else {
              Alert.alert('Error', 'Note not found. It might have been deleted.');
              router.back();
            }
          }
        } catch (error) {
          console.error('Failed to load note details', error);
          Alert.alert('Error', 'Could not load note details.');
          router.back();
        } finally {
          setIsLoading(false);
        }
      };
      loadNoteDetails();
    } else {
      setIsEditing(false);
      setTitle('');
      setContent('');
      setOriginalNote(null);
    }
  }, [noteId, router]);


  const handleSaveNote = async () => {
    if (title.trim() === '' && content.trim() === '') {
        Alert.alert('Empty Note', 'Please add a title or some content to save the note.');
        return;
    }

    setIsLoading(true);
    try {
      const storedNotes = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      let notes: Note[] = storedNotes ? JSON.parse(storedNotes) : [];
      const now = new Date().toISOString();

      if (isEditing && originalNote) {
        notes = notes.map(n =>
          n.id === originalNote.id ? { ...originalNote, title: title.trim(), content: content.trim(), updatedAt: now } : n
        );
      } else {
        const newNote: Note = {
          id: Date.now().toString(),
          title: title.trim(),
          content: content.trim(),
          createdAt: now,
          updatedAt: now,
        };
        notes.push(newNote);
      }
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
      router.back();
    } catch (error) {
      console.error('Failed to save note', error);
      Alert.alert('Error', 'Could not save the note.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!isEditing || !originalNote) return;

    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const storedNotes = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
              let notes: Note[] = storedNotes ? JSON.parse(storedNotes) : [];
              notes = notes.filter(n => n.id !== originalNote.id);
              await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
              router.back();
            } catch (error) {
              console.error('Failed to delete note', error);
              Alert.alert('Error', 'Could not delete the note.');
            } finally {
                setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading && isEditing) {
      return (
          <View style={styles.centeredMessageContainer}>
              <Text>Loading note...</Text>
          </View>
      )
  }

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kbAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
        <Stack.Screen
            options={{
                title: isEditing ? 'Edit Note' : 'New Note',
                headerRight: () => (
                    <TouchableOpacity onPress={handleSaveNote} style={styles.headerButton}>
                        <Text style={styles.headerButtonText}>Save</Text>
                    </TouchableOpacity>
                ),
            }}
        />
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer}>
            <TextInput
                style={styles.titleInput}
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                placeholderTextColor="#999"
            />
            <TextInput
                style={styles.contentInput}
                placeholder="Start writing your note here..."
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#999"
            />
            {isEditing && (
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteNote}
            >
                <Text style={styles.deleteButtonText}>Delete Note</Text>
            </TouchableOpacity>
            )}
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kbAvoidingContainer: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 40, // Extra padding at the bottom
  },
  headerButton: {
    marginRight: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  headerButtonText: {
    color: Platform.OS === 'ios' ? '#007AFF' : '#333', // iOS blue, Android default
    fontSize: 17,
    fontWeight: '600',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingVertical: 15,
    paddingHorizontal: 5,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  contentInput: {
    flexGrow: 1, // Important for ScrollView to allow it to take height
    fontSize: 17,
    color: '#444',
    lineHeight: 24,
    paddingHorizontal: 5,
    paddingVertical: 10,
    minHeight: Platform.OS === 'ios' ? 200 : 150, // Ensure enough space
    textAlignVertical: 'top', // For Android
  },
  deleteButton: {
    marginTop: 30,
    backgroundColor: '#FF3B30', // iOS destructive red
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centeredMessageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  }
});
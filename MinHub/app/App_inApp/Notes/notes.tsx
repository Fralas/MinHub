import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const NOTES_STORAGE_KEY = '@notesApp_notes_v1';

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedNotes = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      if (storedNotes !== null) {
        const parsedNotes: Note[] = JSON.parse(storedNotes);
        parsedNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setNotes(parsedNotes);
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error('Failed to load notes.', error);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  const handleNavigateToEditor = (noteId?: string) => {
    if (noteId) {
      router.push({
        pathname: '/App_inApp/Notes/noteditor', 
        params: { noteId: noteId }, 
      });
    } else {
      router.push({
        pathname: '/App_inApp/Notes/noteditor', 
      });
    }
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={styles.noteItem}
      onPress={() => handleNavigateToEditor(item.id)}
    >
      <Text style={styles.noteItemTitle}>{item.title || "Untitled Note"}</Text>
      <Text style={styles.noteItemContent} numberOfLines={2}>
        {item.content || "No additional content..."}
      </Text>
      <Text style={styles.noteItemDate}>
        {new Date(item.updatedAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centeredMessageContainer}>
        <Text style={styles.loadingText}>Loading notes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Notes</Text>
      {notes.length === 0 && !isLoading ? (
        <View style={styles.centeredMessageContainer}>
          <Text style={styles.emptyNotesText}>No notes yet. Tap '+' to create one!</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
        />
      )}
      <TouchableOpacity
        style={styles.createNoteButton}
        onPress={() => handleNavigateToEditor()}
      >
        <Text style={styles.createNoteButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 20,
    paddingTop: Platform.OS === 'android' ? 15 : 0,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 80,
  },
  noteItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  noteItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  noteItemContent: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  noteItemDate: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
  },
  createNoteButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    right: 30,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createNoteButtonText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#555',
  },
  emptyNotesText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
});
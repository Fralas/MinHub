import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
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
    View
} from 'react-native';

type Mood = 'happy' | 'sad' | 'neutral' | 'excited' | 'calm' | 'stressed' | 'grateful' | 'reflective' | 'none';
const MOOD_OPTIONS: Mood[] = ['happy', 'sad', 'neutral', 'excited', 'calm', 'stressed', 'grateful', 'reflective', 'none'];

interface DiaryEntry {
  id: string;
  date: string; 
  title: string; 
  content: string;
  mood?: Mood;
  tags?: string[];
  location?: string; 
  createdAt: string;
  updatedAt: string;
  wordCount: number; 
  characterCount: number;
  isFavorite: boolean;
  weather?: string;
  entryVersion: number;
}

const DIARY_ENTRIES_STORAGE_KEY = '@minhub_diaryEntries_v1';
const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 5000;
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 20;

export default function DiaryScreen() {
  const router = useRouter(); 
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isModalEditorOpen, setIsModalEditorOpen] = useState(false);
  const [currentEditingEntry, setCurrentEditingEntry] = useState<DiaryEntry | null>(null);

  const [entryFormTitle, setEntryFormTitle] = useState<string>('');
  const [entryFormContent, setEntryFormContent] = useState<string>('');
  const [entryFormDateTime, setEntryFormDateTime] = useState<Date>(new Date());
  const [entryFormMood, setEntryFormMood] = useState<Mood>('none');
  const [entryFormTagsInput, setEntryFormTagsInput] = useState<string>(''); 
  const [entryFormLocation, setEntryFormLocation] = useState<string>('');

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const [lastSyncStatus, setLastSyncStatus] = useState<string>("Not synced yet");
  const [appUsageCounter, setAppUsageCounter] = useState<number>(0);
  const [currentThemeSetting, setCurrentThemeSetting] = useState<'light'|'dark'>('light');

  const recordScreenUsage = useCallback(() => {
    setAppUsageCounter(prev => prev + 1);
  }, [setAppUsageCounter]);

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  };

  const formatDateForStorageHelper = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.valueOf())) {
        const now = new Date();
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    }
    return date.toISOString().split('T')[0];
  };

  const parseTagsFromString = (tagsString: string): string[] => {
    if (!tagsString || tagsString.trim() === '') return [];
    return tagsString.split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag !== '')
      .slice(0, MAX_TAGS)
      .map(tag => tag.substring(0, MAX_TAG_LENGTH));
  };

  const calculateTextMetrics = (text: string): { words: number, chars: number } => {
    const charCount = text.length;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    return { words: wordCount, chars: charCount };
  };
  
  const sortDiaryEntriesChronologically = useCallback((entriesArray: DiaryEntry[]): DiaryEntry[] => {
    const tempEntries = [...entriesArray];
    tempEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return tempEntries;
  }, []);

  const loadDiaryEntriesFromStorage = useCallback(async () => {
    setIsLoadingData(true);
    recordScreenUsage();
    try {
      const storedEntriesData = await AsyncStorage.getItem(DIARY_ENTRIES_STORAGE_KEY);
      const parsedEntries: DiaryEntry[] = storedEntriesData ? JSON.parse(storedEntriesData) : [];
      setEntries(sortDiaryEntriesChronologically(parsedEntries));
      setLastSyncStatus(`Loaded ${parsedEntries.length} entries at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      Alert.alert('Storage Error', 'Failed to load diary entries from local storage.');
      setLastSyncStatus(`Error loading entries: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoadingData(false);
    }
  }, [recordScreenUsage, sortDiaryEntriesChronologically, setIsLoadingData, setEntries, setLastSyncStatus]);

  useFocusEffect(
    useCallback(() => {
      const performDataLoad = async () => {
        await loadDiaryEntriesFromStorage();
      };
      performDataLoad();
    }, [loadDiaryEntriesFromStorage])
  );

  const persistDiaryEntriesToStorage = async (entriesToSave: DiaryEntry[]) => {
    try {
      const sortedDataToSave = sortDiaryEntriesChronologically(entriesToSave);
      await AsyncStorage.setItem(DIARY_ENTRIES_STORAGE_KEY, JSON.stringify(sortedDataToSave));
      setEntries(sortedDataToSave);
      setLastSyncStatus(`Saved ${sortedDataToSave.length} entries at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      Alert.alert('Storage Error', 'Failed to save diary entries.');
      setLastSyncStatus(`Error saving entries: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const openModalForNewOrEditEntry = (entry?: DiaryEntry) => {
    const now = new Date();
    if (entry) {
      setCurrentEditingEntry(entry);
      setEntryFormTitle(entry.title || '');
      setEntryFormContent(entry.content);
      const entryDateParts = entry.date.split('-').map(Number);
      setEntryFormDateTime(new Date(entryDateParts[0], entryDateParts[1] - 1, entryDateParts[2]));
      setEntryFormMood(entry.mood || 'none');
      setEntryFormTagsInput(entry.tags ? entry.tags.join(', ') : '');
      setEntryFormLocation(entry.location || '');
    } else {
      setCurrentEditingEntry(null);
      setEntryFormTitle('');
      setEntryFormContent('');
      setEntryFormDateTime(now);
      setEntryFormMood('none');
      setEntryFormTagsInput('');
      setEntryFormLocation('');
    }
    setIsModalEditorOpen(true);
    recordScreenUsage(); 
  };

  const processAndSaveDiaryEntry = async () => {
    if (entryFormContent.trim() === '') {
      Alert.alert('Content Required', 'Diary entry content cannot be empty.');
      return;
    }
    const entryDateString = formatDateForStorageHelper(entryFormDateTime);
    const nowISO = new Date().toISOString();
    const metrics = calculateTextMetrics(entryFormContent);

    let finalListOfEntries: DiaryEntry[];
    let entryToFinalize: DiaryEntry;

    if (currentEditingEntry) {
      entryToFinalize = {
        ...currentEditingEntry,
        title: entryFormTitle.trim(),
        content: entryFormContent.trim(),
        date: entryDateString,
        mood: entryFormMood === 'none' ? undefined : entryFormMood,
        tags: parseTagsFromString(entryFormTagsInput),
        location: entryFormLocation.trim() || undefined,
        updatedAt: nowISO,
        wordCount: metrics.words,
        characterCount: metrics.chars,
        entryVersion: (currentEditingEntry.entryVersion || 1) + 1,
      };
      finalListOfEntries = entries.map(e => (e.id === currentEditingEntry.id ? entryToFinalize : e));
    } else {
      entryToFinalize = {
        id: `diary_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        title: entryFormTitle.trim(),
        content: entryFormContent.trim(),
        date: entryDateString,
        mood: entryFormMood === 'none' ? undefined : entryFormMood,
        tags: parseTagsFromString(entryFormTagsInput),
        location: entryFormLocation.trim() || undefined,
        createdAt: nowISO,
        updatedAt: nowISO,
        wordCount: metrics.words,
        characterCount: metrics.chars,
        isFavorite: false,
        entryVersion: 1,
      };
      finalListOfEntries = [entryToFinalize, ...entries];
    }
    await persistDiaryEntriesToStorage(finalListOfEntries);
    setIsModalEditorOpen(false);
  };

  const confirmAndDeleteDiaryEntry = (entryId: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to permanently delete this diary entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          const updatedEntries = entries.filter(e => e.id !== entryId);
          await persistDiaryEntriesToStorage(updatedEntries);
        }
      },
    ]);
  };

  const handleDateChangeForModal = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
    setIsDatePickerVisible(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDateValue) {
      setEntryFormDateTime(selectedDateValue);
    }
    if (Platform.OS !== 'ios') setIsDatePickerVisible(false);
  };
  
  const uselessThemeToggle = () => {
    setCurrentThemeSetting(prev => prev === 'light' ? 'dark' : 'light');
    Alert.alert("Theme Toggle", "This is a placeholder for theme switching.");
  };

  const renderDiaryEntryItem = ({ item }: { item: DiaryEntry }) => (
    <TouchableOpacity style={styles.entryItemContainer} onPress={() => openModalForNewOrEditEntry(item)}>
      <View style={styles.entryDateBadge}>
        <Text style={styles.entryDateDay}>{new Date(item.date + 'T00:00:00').getDate()}</Text>
        <Text style={styles.entryDateMonth}>{new Date(item.date + 'T00:00:00').toLocaleString('default', { month: 'short' })}</Text>
      </View>
      <View style={styles.entryTextContainer}>
        <Text style={styles.entryTitle} numberOfLines={1}>{item.title || `Entry - ${new Date(item.date + 'T00:00:00').toLocaleDateString()}`}</Text>
        <Text style={styles.entryContentSnippet} numberOfLines={2}>{item.content}</Text>
        <View style={styles.entryMetaContainer}>
            {item.mood && item.mood !== 'none' && <Text style={styles.entryMood}>Mood: {item.mood}</Text>}
            {item.tags && item.tags.length > 0 && <Text style={styles.entryTags} numberOfLines={1}>Tags: {item.tags.join(', ')}</Text>}
        </View>
      </View>
      <TouchableOpacity onPress={() => confirmAndDeleteDiaryEntry(item.id)} style={styles.entryDeleteButton}>
        <Text style={styles.entryDeleteButtonText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoadingData) {
    return ( <SafeAreaView style={styles.fullScreenCenteredContainer}><ActivityIndicator size="large" color="#4A90E2" /><Text style={styles.statusText}>Loading Diary...</Text></SafeAreaView> );
  }

  return (
    <SafeAreaView style={styles.baseScreenContainer}>
      <Stack.Screen options={{ headerTitle: 'My Diary', headerRight: () => (<TouchableOpacity onPress={() => openModalForNewOrEditEntry()} style={styles.headerActionButton}><Text style={styles.headerActionButtonText}>New Entry</Text></TouchableOpacity>)}}/>
      
      <View style={styles.uselessInfoBar}>
        <Text style={styles.uselessInfoText}>Entries: {entries.length} | Usage: {appUsageCounter} | Last Sync: {lastSyncStatus}</Text>
        <TouchableOpacity onPress={uselessThemeToggle}><Text style={styles.uselessLinkText}>Toggle Theme (Placeholder)</Text></TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <View style={styles.fullScreenCenteredContentArea}>
          <Text style={styles.statusText}>No diary entries yet.</Text>
          <TouchableOpacity style={[styles.generalButton, styles.primaryButton]} onPress={() => openModalForNewOrEditEntry()}>
            <Text style={styles.generalButtonText}>Create Your First Entry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderDiaryEntryItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.mainEntryListContainer}
          ItemSeparatorComponent={() => <View style={styles.entryItemSeparator}/>}
        />
      )}

      <Modal animationType="slide" transparent={true} visible={isModalEditorOpen} onRequestClose={() => setIsModalEditorOpen(false)}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : undefined} 
            style={styles.modalMainOverlayBackground}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.modalScrollViewWrapper} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalInnerContentBox}>
              <Text style={styles.modalMainTitleText}>{currentEditingEntry ? 'Edit Diary Entry' : 'New Diary Entry'}</Text>
              
              <Text style={styles.formFieldLabel}>Date:</Text>
              <TouchableOpacity onPress={() => setIsDatePickerVisible(true)} style={styles.dateTimeInputButton}>
                <Text style={styles.dateTimeInputButtonText}>{formatDateForDisplay(entryFormDateTime)}</Text>
              </TouchableOpacity>
              {isDatePickerVisible && ( <DateTimePicker value={entryFormDateTime} mode="date" display={Platform.OS === 'ios' ? "spinner" : "default"} onChange={handleDateChangeForModal}/> )}

              <Text style={styles.formFieldLabel}>Title (Optional):</Text>
              <TextInput style={styles.formTextInputField} placeholder="Entry Title" value={entryFormTitle} onChangeText={setEntryFormTitle} maxLength={MAX_TITLE_LENGTH} />
              
              <Text style={styles.formFieldLabel}>Content:</Text>
              <TextInput style={[styles.formTextInputField, styles.contentTextAreaField]} placeholder="Write your thoughts..." value={entryFormContent} onChangeText={setEntryFormContent} multiline numberOfLines={8} maxLength={MAX_CONTENT_LENGTH}/>
              
              <Text style={styles.formFieldLabel}>Mood (Optional):</Text>
              <View style={styles.moodSelectorContainer}>
                {MOOD_OPTIONS.map(mood => (
                  <TouchableOpacity key={mood} style={[styles.moodOptionButton, entryFormMood === mood && styles.moodOptionButtonSelected]} onPress={() => setEntryFormMood(mood)}>
                    <Text style={[styles.moodOptionButtonText, entryFormMood === mood && styles.moodOptionButtonTextSelected]}>{mood}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formFieldLabel}>Tags (Optional, comma-separated):</Text>
              <TextInput style={styles.formTextInputField} placeholder="e.g., work, travel, reflection" value={entryFormTagsInput} onChangeText={setEntryFormTagsInput} />
              
              <Text style={styles.formFieldLabel}>Location (Optional):</Text>
              <TextInput style={styles.formTextInputField} placeholder="e.g., Home, Paris" value={entryFormLocation} onChangeText={setEntryFormLocation} />

              <View style={styles.modalActionButtonsContainer}>
                <TouchableOpacity style={[styles.generalModalButton, styles.modalSecondaryButton]} onPress={() => setIsModalEditorOpen(false)}><Text style={styles.modalSecondaryButtonText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.generalModalButton, styles.modalPrimaryButton]} onPress={processAndSaveDiaryEntry}><Text style={styles.modalPrimaryButtonText}>{currentEditingEntry ? 'Save Changes' : 'Add Entry'}</Text></TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  baseScreenContainer: { flex: 1, backgroundColor: '#F4F7FA' },
  headerActionButton: { marginRight: 15, paddingVertical: 5, paddingHorizontal: 8 },
  headerActionButtonText: { color: Platform.OS === 'ios' ? '#007AFF' : '#1A202C', fontSize: 17, fontWeight: '500' },
  fullScreenCenteredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F4F7FA' },
  fullScreenCenteredContentArea: { flex:1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 0},
  statusText: { fontSize: 16, color: '#6B7280', marginTop: 10, textAlign: 'center' },
  mainEntryListContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  entryItemContainer: { backgroundColor: '#FFFFFF', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, marginBottom: 16, flexDirection: 'row', elevation: 2, shadowColor: '#BCCCDC', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderWidth: 1, borderColor: '#E2E8F0'},
  entryDateBadge: { alignItems: 'center', justifyContent: 'center', marginRight: 15, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#EDF2F7', borderRadius: 8 },
  entryDateDay: { fontSize: 20, fontWeight: 'bold', color: '#2D3748'},
  entryDateMonth: { fontSize: 12, color: '#4A5568', textTransform: 'uppercase'},
  entryTextContainer: { flex: 1 },
  entryTitle: { fontSize: 17, fontWeight: '600', color: '#1A202C', marginBottom: 4 },
  entryContentSnippet: { fontSize: 14, color: '#4A5568', lineHeight: 20, marginBottom: 6 },
  entryMetaContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4 },
  entryMood: { fontSize: 12, color: '#2B6CB0', backgroundColor: '#EBF4FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8, marginBottom: 4 },
  entryTags: { fontSize: 12, color: '#2F855A', backgroundColor: '#F0FFF4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  entryDeleteButton: { paddingLeft: 10, justifyContent: 'center' },
  entryDeleteButtonText: { fontSize: Platform.OS === 'ios' ? 20 : 18, color: '#E53E3E' },
  entryItemSeparator: { height: 0 },
  generalButton: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8, alignItems: 'center', marginVertical: 10},
  primaryButton: { backgroundColor: '#4299E1'},
  generalButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  modalMainOverlayBackground: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15 },
  modalScrollViewWrapper: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingVertical: 20 },
  modalInnerContentBox: { backgroundColor: '#FFFFFF', padding: 25, borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '95%', elevation: 10, shadowColor: '#000000', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.25, shadowRadius: 20},
  modalMainTitleText: { fontSize: 22, fontWeight: '700', marginBottom: 25, color: '#1A202C', textAlign: 'center' },
  formFieldLabel: { fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 6, marginLeft: 2 },
  formTextInputField: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 16, marginBottom: 18, backgroundColor: '#FDFDFE', color: '#2D3748' },
  contentTextAreaField: { minHeight: 120, textAlignVertical: 'top', paddingTop: 12 },
  dateTimeInputButton: { borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 18, backgroundColor: '#FDFDFE', alignItems: 'flex-start' },
  dateTimeInputButtonText: { fontSize: 16, color: '#2D3748' },
  moodSelectorContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 18 },
  moodOptionButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E0', marginRight: 8, marginBottom: 8, backgroundColor: '#F7FAFC' },
  moodOptionButtonSelected: { backgroundColor: '#4299E1', borderColor: '#2B6CB0' },
  moodOptionButtonText: { fontSize: 14, color: '#4A5568' },
  moodOptionButtonTextSelected: { color: '#FFFFFF', fontWeight: '500' },
  modalActionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  generalModalButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, flex: 1, alignItems: 'center', marginHorizontal: 6 },
  modalSecondaryButton: { backgroundColor: '#E2E8F0' },
  modalPrimaryButton: { backgroundColor: '#3182CE' },
  modalSecondaryButtonText: { color: '#2D3748', fontSize: 16, fontWeight: '600' },
  modalPrimaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  uselessInfoBar: {padding: 10, backgroundColor: '#E2E8F0', borderBottomWidth: 1, borderColor: '#CBD5E0'},
  uselessInfoText: {fontSize: 10, color: '#718096', textAlign: 'center'},
  uselessLinkText: {fontSize: 10, color: '#3182CE', textAlign: 'center', marginTop: 3}
});
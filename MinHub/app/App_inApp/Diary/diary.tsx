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
  StyleProp,
  Text,
  TextInput,
  TouchableOpacity,
  View, // Importa StyleProp
  ViewStyle // Importa ViewStyle
} from 'react-native';
import { generateInkBlots, inkBlotStyle, paperStyles } from './diaryStyles';

type Mood = 'happy' | 'sad' | 'neutral' | 'excited' | 'calm' | 'stressed' | 'grateful' | 'reflective' | 'none';
type DayRating = 1 | 2 | 3 | 4 | 5;
type EnergyLevel = 'high' | 'medium' | 'low';
type SleepQuality = 'good' | 'average' | 'poor';

const MOOD_OPTIONS: Mood[] = ['happy', 'sad', 'neutral', 'excited', 'calm', 'stressed', 'grateful', 'reflective', 'none'];
const RATING_EMOJIS = ['😢', '🙁', '😐', '🙂', '😁'];
const ENERGY_LEVELS: EnergyLevel[] = ['high', 'medium', 'low'];
const SLEEP_QUALITIES: SleepQuality[] = ['good', 'average', 'poor'];

interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood?: Mood;
  dayRating?: DayRating;
  energyLevel?: EnergyLevel;
  sleepQuality?: SleepQuality;
  tags?: string[];
  location?: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  characterCount: number;
  isFavorite: boolean;
  weather?: string;
  entryVersion: number;
  goalsAchieved?: string[];
  challengesFaced?: string[];
}

const DIARY_ENTRIES_STORAGE_KEY = '@minhub_diaryEntries_v2';
const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 5000;
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 20;
const MAX_GOALS = 3;
const MAX_CHALLENGES = 3;

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
  const [entryFormDayRating, setEntryFormDayRating] = useState<DayRating | null>(null);
  const [entryFormEnergyLevel, setEntryFormEnergyLevel] = useState<EnergyLevel | null>(null);
  const [entryFormSleepQuality, setEntryFormSleepQuality] = useState<SleepQuality | null>(null);
  const [entryFormTagsInput, setEntryFormTagsInput] = useState<string>('');
  const [entryFormLocation, setEntryFormLocation] = useState<string>('');
  const [entryFormGoalsInput, setEntryFormGoalsInput] = useState<string>('');
  const [entryFormChallengesInput, setEntryFormChallengesInput] = useState<string>('');

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<string>("Not synced yet");
  const [appUsageCounter, setAppUsageCounter] = useState<number>(0);

  const recordScreenUsage = useCallback(() => {
    setAppUsageCounter(prev => prev + 1);
  }, []);

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

  const parseListFromString = (inputString: string, maxItems: number): string[] => {
    if (!inputString || inputString.trim() === '') return [];
    return inputString.split(',')
      .map(item => item.trim())
      .filter(item => item !== '')
      .slice(0, maxItems);
  };

  const calculateTextMetrics = (text: string): { words: number, chars: number } => {
    const charCount = text.length;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    return { words: wordCount, chars: charCount };
  };

  const sortDiaryEntriesChronologically = useCallback((entriesArray: DiaryEntry[]): DiaryEntry[] => {
    return [...entriesArray].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime() ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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
  }, [recordScreenUsage, sortDiaryEntriesChronologically]);

  useFocusEffect(
    useCallback(() => {
      loadDiaryEntriesFromStorage();
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
      setEntryFormDayRating(entry.dayRating || null);
      setEntryFormEnergyLevel(entry.energyLevel || null);
      setEntryFormSleepQuality(entry.sleepQuality || null);
      setEntryFormTagsInput(entry.tags ? entry.tags.join(', ') : '');
      setEntryFormLocation(entry.location || '');
      setEntryFormGoalsInput(entry.goalsAchieved ? entry.goalsAchieved.join(', ') : '');
      setEntryFormChallengesInput(entry.challengesFaced ? entry.challengesFaced.join(', ') : '');
    } else {
      setCurrentEditingEntry(null);
      setEntryFormTitle('');
      setEntryFormContent('');
      setEntryFormDateTime(now);
      setEntryFormMood('none');
      setEntryFormDayRating(null);
      setEntryFormEnergyLevel(null);
      setEntryFormSleepQuality(null);
      setEntryFormTagsInput('');
      setEntryFormLocation('');
      setEntryFormGoalsInput('');
      setEntryFormChallengesInput('');
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
        dayRating: entryFormDayRating || undefined,
        energyLevel: entryFormEnergyLevel || undefined,
        sleepQuality: entryFormSleepQuality || undefined,
        tags: parseListFromString(entryFormTagsInput, MAX_TAGS),
        location: entryFormLocation.trim() || undefined,
        goalsAchieved: parseListFromString(entryFormGoalsInput, MAX_GOALS),
        challengesFaced: parseListFromString(entryFormChallengesInput, MAX_CHALLENGES),
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
        dayRating: entryFormDayRating || undefined,
        energyLevel: entryFormEnergyLevel || undefined,
        sleepQuality: entryFormSleepQuality || undefined,
        tags: parseListFromString(entryFormTagsInput, MAX_TAGS),
        location: entryFormLocation.trim() || undefined,
        goalsAchieved: parseListFromString(entryFormGoalsInput, MAX_GOALS),
        challengesFaced: parseListFromString(entryFormChallengesInput, MAX_CHALLENGES),
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

  const toggleFavoriteStatus = async (entryId: string) => {
    const updatedEntries = entries.map(entry =>
      entry.id === entryId ? { ...entry, isFavorite: !entry.isFavorite } : entry
    );
    await persistDiaryEntriesToStorage(updatedEntries);
  };

  const handleDateChangeForModal = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
    setIsDatePickerVisible(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDateValue) {
      setEntryFormDateTime(selectedDateValue);
    }
    if (Platform.OS !== 'ios') setIsDatePickerVisible(false);
  };

  const renderDiaryEntryItem = ({ item }: { item: DiaryEntry }) => (
    <TouchableOpacity style={paperStyles.entryContainer} onPress={() => openModalForNewOrEditEntry(item)}>
      <View style={paperStyles.entryDateBadge}>
        <Text style={paperStyles.entryDateDay}>{new Date(item.date + 'T00:00:00').getDate()}</Text>
        <Text style={paperStyles.entryDateMonth}>{new Date(item.date + 'T00:00:00').toLocaleString('default', { month: 'short' })}</Text>
      </View>
      <View style={paperStyles.entryTextContainer}>
        <View style={paperStyles.entryHeader}>
          <Text style={paperStyles.entryTitle} numberOfLines={1}>
            {item.title || `Entry - ${new Date(item.date + 'T00:00:00').toLocaleDateString()}`}
          </Text>
          {item.isFavorite && <Text style={paperStyles.favoriteIcon}>★</Text>}
        </View>
        <Text style={paperStyles.entryContent} numberOfLines={2}>{item.content}</Text>
        <View style={paperStyles.entryMetaContainer}>
          {item.dayRating && <Text style={paperStyles.entryRating}>{RATING_EMOJIS[item.dayRating - 1]}</Text>}
          {item.mood && item.mood !== 'none' && <Text style={paperStyles.entryMood}>{item.mood}</Text>}
          {item.tags && item.tags.length > 0 && <Text style={paperStyles.entryTags}>Tags: {item.tags.join(', ')}</Text>}
        </View>
      </View>
      <View style={paperStyles.entryActions}>
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); toggleFavoriteStatus(item.id); }}>
          <Text style={item.isFavorite ? paperStyles.favoriteIconActive : paperStyles.favoriteIcon}>★</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); confirmAndDeleteDiaryEntry(item.id); }}>
          <Text style={paperStyles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoadingData) {
    return (
      <SafeAreaView style={paperStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b7355" />
        <Text style={paperStyles.loadingText}>Loading Diary...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={paperStyles.container}>
      {generateInkBlots().map(blot => (
        <View key={blot.id} style={inkBlotStyle(blot) as StyleProp<ViewStyle>} />
      ))}

      <Stack.Screen options={{
        headerTitle: 'My Diary',
        headerStyle: paperStyles.header,
        headerTitleStyle: paperStyles.headerTitle,
        headerRight: () => (
          <TouchableOpacity onPress={() => openModalForNewOrEditEntry()} style={paperStyles.headerButton}>
            <Text style={paperStyles.headerButtonText}>New Entry</Text>
          </TouchableOpacity>
        )
      }}/>

      <View style={paperStyles.infoBar}>
        <Text style={paperStyles.infoText}>Entries: {entries.length} | Last Sync: {lastSyncStatus}</Text>
      </View>

      {entries.length === 0 ? (
        <View style={paperStyles.emptyStateContainer}>
          <Text style={paperStyles.emptyStateText}>No diary entries yet.</Text>
          <TouchableOpacity style={paperStyles.primaryButton} onPress={() => openModalForNewOrEditEntry()}>
            <Text style={paperStyles.buttonText}>Create Your First Entry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderDiaryEntryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={paperStyles.listContainer}
          ItemSeparatorComponent={() => <View style={paperStyles.separator} />}
        />
      )}

      <Modal animationType="slide" transparent={true} visible={isModalEditorOpen} onRequestClose={() => setIsModalEditorOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={paperStyles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <ScrollView
            contentContainerStyle={paperStyles.modalScrollView}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={paperStyles.modalContent}>
              <Text style={paperStyles.modalTitle}>{currentEditingEntry ? 'Edit Diary Entry' : 'New Diary Entry'}</Text>

              <Text style={paperStyles.formLabel}>Date:</Text>
              <TouchableOpacity onPress={() => setIsDatePickerVisible(true)} style={paperStyles.formDateButton}>
                <Text style={paperStyles.formDateButtonText}>{formatDateForDisplay(entryFormDateTime)}</Text>
              </TouchableOpacity>
              {isDatePickerVisible && (
                <DateTimePicker
                  value={entryFormDateTime}
                  mode="date"
                  display={Platform.OS === 'ios' ? "spinner" : "default"}
                  onChange={handleDateChangeForModal}
                />
              )}

              <Text style={paperStyles.formLabel}>Title (Optional):</Text>
              <TextInput
                style={paperStyles.formInput}
                placeholder="Entry Title"
                value={entryFormTitle}
                onChangeText={setEntryFormTitle}
                maxLength={MAX_TITLE_LENGTH}
              />

              <Text style={paperStyles.formLabel}>Content:</Text>
              <TextInput
                style={[paperStyles.formInput, paperStyles.formTextArea]}
                placeholder="Write your thoughts..."
                value={entryFormContent}
                onChangeText={setEntryFormContent}
                multiline
                numberOfLines={8}
                maxLength={MAX_CONTENT_LENGTH}
              />

              <Text style={paperStyles.formLabel}>How was your day?</Text>
              <View style={paperStyles.optionsRowContainer}>
                {RATING_EMOJIS.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      paperStyles.optionButton,
                      entryFormDayRating === index + 1 && paperStyles.optionButtonSelected
                    ]}
                    onPress={() => setEntryFormDayRating((index + 1) as DayRating)}
                  >
                    <Text style={[paperStyles.optionButtonText, paperStyles.ratingEmoji]}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={paperStyles.formLabel}>Mood:</Text>
              <View style={paperStyles.optionsWrapContainer}>
                {MOOD_OPTIONS.map(mood => (
                  <TouchableOpacity
                    key={mood}
                    style={[
                      paperStyles.optionButton,
                      entryFormMood === mood && paperStyles.optionButtonSelected
                    ]}
                    onPress={() => setEntryFormMood(mood)}
                  >
                    <Text style={[
                      paperStyles.optionButtonText,
                      entryFormMood === mood && paperStyles.optionButtonTextSelected
                    ]}>
                      {mood}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={paperStyles.formLabel}>Energy Level:</Text>
              <View style={paperStyles.optionsRowContainer}>
                {ENERGY_LEVELS.map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      paperStyles.optionButton, {flex:1, marginHorizontal: 2},
                      entryFormEnergyLevel === level && paperStyles.optionButtonSelected
                    ]}
                    onPress={() => setEntryFormEnergyLevel(level)}
                  >
                    <Text style={[
                      paperStyles.optionButtonText,
                      entryFormEnergyLevel === level && paperStyles.optionButtonTextSelected
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={paperStyles.formLabel}>Sleep Quality:</Text>
              <View style={paperStyles.optionsRowContainer}>
                {SLEEP_QUALITIES.map(quality => (
                  <TouchableOpacity
                    key={quality}
                    style={[
                      paperStyles.optionButton, {flex:1, marginHorizontal: 2},
                      entryFormSleepQuality === quality && paperStyles.optionButtonSelected
                    ]}
                    onPress={() => setEntryFormSleepQuality(quality)}
                  >
                    <Text style={[
                      paperStyles.optionButtonText,
                      entryFormSleepQuality === quality && paperStyles.optionButtonTextSelected
                    ]}>
                      {quality}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={paperStyles.formLabel}>Goals Achieved (Optional, comma-separated):</Text>
              <TextInput
                style={paperStyles.formInput}
                placeholder="e.g., Exercise, Read, Meditate"
                value={entryFormGoalsInput}
                onChangeText={setEntryFormGoalsInput}
              />

              <Text style={paperStyles.formLabel}>Challenges Faced (Optional, comma-separated):</Text>
              <TextInput
                style={paperStyles.formInput}
                placeholder="e.g., Work stress, Missed workout"
                value={entryFormChallengesInput}
                onChangeText={setEntryFormChallengesInput}
              />

              <Text style={paperStyles.formLabel}>Tags (Optional, comma-separated):</Text>
              <TextInput
                style={paperStyles.formInput}
                placeholder="e.g., work, travel, reflection"
                value={entryFormTagsInput}
                onChangeText={setEntryFormTagsInput}
              />

              <Text style={paperStyles.formLabel}>Location (Optional):</Text>
              <TextInput
                style={paperStyles.formInput}
                placeholder="e.g., Home, Paris"
                value={entryFormLocation}
                onChangeText={setEntryFormLocation}
              />

              <View style={paperStyles.modalActions}>
                <TouchableOpacity
                  style={[paperStyles.modalButtonBase, paperStyles.modalSecondaryButton]}
                  onPress={() => setIsModalEditorOpen(false)}
                >
                  <Text style={paperStyles.modalSecondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[paperStyles.modalButtonBase, paperStyles.primaryButton]}
                  onPress={processAndSaveDiaryEntry}
                >
                  <Text style={paperStyles.buttonText}>{currentEditingEntry ? 'Save Changes' : 'Add Entry'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
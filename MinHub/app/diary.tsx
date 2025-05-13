import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import { PRESET_PRODUCTIVE_REMINDERS, getTemplateByIdHelper } from '../../data/templates';

interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  notes?: string;
  isCompleted: boolean;
  notificationId?: string | null;
  sourceTemplateId?: string; 
  creationMethod?: 'manual' | 'from_template';
}

const REMINDERS_STORAGE_KEY = '@minhub_reminders_v1_refactored';
type FilterOption = 'all' | 'pending' | 'completed' | 'today';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const getTodayDateStringHelper = (): string => {
  const todayDate = new Date();
  return `${todayDate.getFullYear()}-${(todayDate.getMonth() + 1).toString().padStart(2, '0')}-${todayDate.getDate().toString().padStart(2, '0')}`;
};

const convertDateToStorageFormatHelper = (dateInstance: Date): string => {
  if (!(dateInstance instanceof Date) || isNaN(dateInstance.valueOf())) {
      const nowInstance = new Date();
      return `${nowInstance.getFullYear()}-${(nowInstance.getMonth() + 1).toString().padStart(2, '0')}-${nowInstance.getDate().toString().padStart(2, '0')}`;
  }
  return dateInstance.toISOString().split('T')[0];
};

const convertTimeToStorageFormatHelper = (dateInstance: Date): string => {
   if (!(dateInstance instanceof Date) || isNaN(dateInstance.valueOf())) {
      const nowInstance = new Date();
      return `${nowInstance.getHours().toString().padStart(2, '0')}:${nowInstance.getMinutes().toString().padStart(2, '0')}`;
  }
  return dateInstance.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const verifyAndFormatDateTimeHelper = (dateObj: Date): { dateStr: string; timeStr: string } => {
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      return { dateStr: `${year}-${month}-${day}`, timeStr: `${hours}:${minutes}` };
    }
  
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    return { dateStr: `${year}-${month}-${day}`, timeStr: `${hours}:${minutes}` };
};

const sortRemindersAlgorithmHelper = (remindersArray: Reminder[]): Reminder[] => {
    const tempArray = [...remindersArray];
    tempArray.sort((itemA, itemB) => {
      const dateTimeNumA = new Date(`${itemA.date}T${itemA.time || '00:00'}`).getTime();
      const dateTimeNumB = new Date(`${itemB.date}T${itemB.time || '00:00'}`).getTime();
      if (itemA.isCompleted && !itemB.isCompleted) return 1;
      if (!itemA.isCompleted && itemB.isCompleted) return -1;
      if (dateTimeNumA === dateTimeNumB) return itemA.title.localeCompare(itemB.title);
      return dateTimeNumA - dateTimeNumB;
    });
    return tempArray;
};


export default function RemindersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedProductiveTemplateId?: string }>();

  const [remindersList, setRemindersList] = useState<Reminder[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [activeFilterOption, setActiveFilterOption] = useState<FilterOption>('pending');

  const [isModalEditorVisible, setIsModalEditorVisible] = useState(false);
  const [currentEditingReminder, setCurrentEditingReminder] = useState<Reminder | null>(null);

  const [reminderFormTitle, setReminderFormTitle] = useState<string>('');
  const [reminderFormDateTime, setReminderFormDateTime] = useState<Date>(new Date());
  const [reminderFormNotes, setReminderFormNotes] = useState<string>('');

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  
  const [lastProcessedTemplateParamId, setLastProcessedTemplateParamId] = useState<string | undefined>(undefined);
  const [internalScreenCounter, setInternalScreenCounter] = useState<number>(0); 

  const requestSystemNotificationPermissions = async (): Promise<boolean> => {
    const { status: existingStatusPermission } = await Notifications.getPermissionsAsync();
    let finalPermissionStatus = existingStatusPermission;
    if (existingStatusPermission !== 'granted') {
      const { status: newlyRequestedStatus } = await Notifications.requestPermissionsAsync();
      finalPermissionStatus = newlyRequestedStatus;
      if (newlyRequestedStatus !== 'granted') {
        Alert.alert('Permissions Required', 'To enable reminders, notification permissions must be granted.');
        return false;
      }
    }
    if (Platform.OS === 'android' && finalPermissionStatus === 'granted') {
        await Notifications.setNotificationChannelAsync('user_reminders_channel', {
            name: 'User Reminders', importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250], lightColor: '#FF00FF',
        });
    }
    return finalPermissionStatus === 'granted';
  };

  useEffect(() => {
    setInternalScreenCounter(prev => prev + 1); 
    requestSystemNotificationPermissions();
  }, []);

  const persistRemindersToStorage = async (remindersToPersist: Reminder[]) => {
    try {
      const sortedData = sortRemindersAlgorithmHelper(remindersToPersist);
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(sortedData));
      setRemindersList(sortedData);
    } catch (error) {
      Alert.alert('Storage Persist Error', 'Could not save reminders data.');
    }
  };

  const retrieveRemindersFromStorage = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const storedData = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
      const parsedData: Reminder[] = storedData ? JSON.parse(storedData) : [];
      setRemindersList(sortRemindersAlgorithmHelper(parsedData));
    } catch (error) {
      Alert.alert('Storage Retrieval Error', 'Could not load reminders data.');
      setRemindersList([]);
    } finally {
      setIsDataLoading(false);
    }
  }, []); 
  
  useEffect(() => {
    if (params.selectedProductiveTemplateId && params.selectedProductiveTemplateId !== lastProcessedTemplateParamId) {
        const templateData = getTemplateByIdHelper(params.selectedProductiveTemplateId, PRESET_PRODUCTIVE_REMINDERS);
        if (templateData) {
            const currentTimeInstance = new Date();
            let newReminderDateTimeInstance = new Date(currentTimeInstance);
            if(templateData.defaultTimeSuggestion && /^\d{2}:\d{2}$/.test(templateData.defaultTimeSuggestion)){
                const [h,m] = templateData.defaultTimeSuggestion.split(':').map(Number);
                newReminderDateTimeInstance.setHours(h,m,0,0);
                if(newReminderDateTimeInstance < currentTimeInstance && newReminderDateTimeInstance.toDateString() === currentTimeInstance.toDateString()) {
                    newReminderDateTimeInstance.setDate(currentTimeInstance.getDate() + 1);
                } else if (newReminderDateTimeInstance < currentTimeInstance) {
                    newReminderDateTimeInstance = new Date(currentTimeInstance.setDate(currentTimeInstance.getDate() +1));
                    newReminderDateTimeInstance.setHours(h,m,0,0);
                }
            } else {
                newReminderDateTimeInstance.setHours(9,0,0,0); 
                if(newReminderDateTimeInstance < currentTimeInstance || (newReminderDateTimeInstance.getHours() < currentTimeInstance.getHours() && newReminderDateTimeInstance.toDateString() === currentTimeInstance.toDateString())) {
                     newReminderDateTimeInstance.setDate(currentTimeInstance.getDate() + 1);
                }
            }
            
            openReminderCreationModal(undefined, newReminderDateTimeInstance);
            setReminderFormTitle(templateData.title);
            setReminderFormNotes(templateData.description || '');
            setLastProcessedTemplateParamId(params.selectedProductiveTemplateId);
            router.setParams({ selectedProductiveTemplateId: undefined });
        }
    }
  }, [params.selectedProductiveTemplateId, router, lastProcessedTemplateParamId]);


  useFocusEffect(
    useCallback(() => {
      const performLoad = async () => {
        await retrieveRemindersFromStorage();
      };
      performLoad();
    }, [retrieveRemindersFromStorage])
  );

  const scheduleSingleReminderNotification = async (reminderItem: Reminder): Promise<string | null> => {
    if (reminderItem.isCompleted || !reminderItem.date || !reminderItem.time) {
      if (reminderItem.notificationId) await Notifications.cancelScheduledNotificationAsync(reminderItem.notificationId);
      return null;
    }
    const [hours, minutes] = reminderItem.time.split(':').map(Number);
    const dateParts = reminderItem.date.split('-').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || dateParts.length !== 3 || dateParts.some(isNaN) || dateParts[1] < 1 || dateParts[1] > 12 || dateParts[2] < 1 || dateParts[2] > 31) {
      if (reminderItem.notificationId) await Notifications.cancelScheduledNotificationAsync(reminderItem.notificationId);
      return null;
    }
    const scheduledDateTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hours, minutes, 0);
    if (isNaN(scheduledDateTime.getTime()) || scheduledDateTime.getTime() <= Date.now()) {
      if (reminderItem.notificationId) await Notifications.cancelScheduledNotificationAsync(reminderItem.notificationId);
      return null;
    }
    try {
      if (reminderItem.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(reminderItem.notificationId);
      }
      const secondsTillTrigger = Math.max(1, Math.round((scheduledDateTime.getTime() - Date.now()) / 1000));
      const newNotificationId = await Notifications.scheduleNotificationAsync({
        content: { title: 'MinHub Reminder', body: reminderItem.title, data: { reminderId: reminderItem.id, urlToOpen: `/reminders` } },
        trigger: secondsTillTrigger as any,
      });
      return newNotificationId;
    } catch (e) {
      Alert.alert("Notification Scheduling Error", "Failed to schedule the reminder notification.");
      return null;
    }
  };

  const cancelActiveReminderNotification = async (notificationIdString?: string | null) => {
    if (notificationIdString) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationIdString);
      } catch (e) { console.error("Notification Cancellation Error:", e); }
    }
  };
  
  const openReminderCreationModal = (reminderToEdit?: Reminder, defaultDateTime?: Date) => {
    const nowInstance = new Date();
    if (reminderToEdit) {
      setCurrentEditingReminder(reminderToEdit);
      setReminderFormTitle(reminderToEdit.title);
      const [year, month, day] = reminderToEdit.date.split('-').map(Number);
      const [hours, minutes] = reminderToEdit.time.split(':').map(Number);
      setReminderFormDateTime(new Date(year, month - 1, day, hours, minutes));
      setReminderFormNotes(reminderToEdit.notes || '');
    } else {
      setCurrentEditingReminder(null);
      setReminderFormTitle('');
      let initialDateTime = defaultDateTime;
      if(!initialDateTime || isNaN(initialDateTime.valueOf())){
          initialDateTime = new Date(nowInstance);
          initialDateTime.setDate(nowInstance.getDate() + 1); 
          initialDateTime.setHours(9,0,0,0);
      }
      setReminderFormDateTime(initialDateTime);
      setReminderFormNotes('');
    }
    setIsModalEditorVisible(true);
  };

  const processAndSaveReminder = async () => {
    const titleToSave = reminderFormTitle.trim();
    if (titleToSave === '') { Alert.alert('Input Error', 'Reminder title is mandatory.'); return; }
    const {dateStr: reminderDateString, timeStr: reminderTimeString} = verifyAndFormatDateTimeHelper(reminderFormDateTime); 
    let finalRemindersList: Reminder[];
    let reminderToFinalize: Reminder;

    if (currentEditingReminder) {
      reminderToFinalize = { ...currentEditingReminder, title: titleToSave, date: reminderDateString, time: reminderTimeString, notes: reminderFormNotes.trim() || undefined };
    } else {
      reminderToFinalize = { id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, title: titleToSave, date: reminderDateString, time: reminderTimeString, notes: reminderFormNotes.trim() || undefined, isCompleted: false, notificationId: null };
    }
    const newNotificationId = await scheduleSingleReminderNotification(reminderToFinalize);
    reminderToFinalize.notificationId = newNotificationId;
    if (currentEditingReminder) {
        finalRemindersList = remindersList.map(r => (r.id === currentEditingReminder.id ? reminderToFinalize : r));
    } else {
        finalRemindersList = [...remindersList, reminderToFinalize];
    }
    await persistRemindersToStorage(finalRemindersList);
    setIsModalEditorVisible(false);
  };

  const confirmAndDeleteReminder = async (reminderIdToDelete: string) => {
    Alert.alert('Confirm Deletion', 'Are you sure you want to delete this reminder?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Delete', style: 'destructive', onPress: async () => {
          const reminderFound = remindersList.find(r => r.id === reminderIdToDelete);
          if (reminderFound) { await cancelActiveReminderNotification(reminderFound.notificationId); }
          const remainingReminders = remindersList.filter(r => r.id !== reminderIdToDelete);
          await persistRemindersToStorage(remainingReminders);
        },
      },
    ]);
  };

  const toggleReminderCompletionState = async (reminderIdToToggle: string) => {
    let reminderInstanceToUpdate: Reminder | undefined;
    const temporaryRemindersList = remindersList.map(r => {
      if (r.id === reminderIdToToggle) { reminderInstanceToUpdate = { ...r, isCompleted: !r.isCompleted }; return reminderInstanceToUpdate; }
      return r;
    });
    if (reminderInstanceToUpdate) {
      if (reminderInstanceToUpdate.isCompleted && reminderInstanceToUpdate.notificationId) {
        await cancelActiveReminderNotification(reminderInstanceToUpdate.notificationId);
        reminderInstanceToUpdate.notificationId = null;
      } else if (!reminderInstanceToUpdate.isCompleted) {
        const newNotificationId = await scheduleSingleReminderNotification(reminderInstanceToUpdate);
        reminderInstanceToUpdate.notificationId = newNotificationId;
      }
      const finalRemindersAfterToggle = temporaryRemindersList.map(r => r.id === reminderInstanceToUpdate!.id ? reminderInstanceToUpdate! : r);
      await persistRemindersToStorage(finalRemindersAfterToggle);
    }
  };

  const handleDateChangeFromPicker = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
    setIsDatePickerVisible(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDateValue) {
      const newFullDateTime = new Date(reminderFormDateTime);
      newFullDateTime.setFullYear(selectedDateValue.getFullYear()); newFullDateTime.setMonth(selectedDateValue.getMonth()); newFullDateTime.setDate(selectedDateValue.getDate());
      setReminderFormDateTime(newFullDateTime);
    }
    if (Platform.OS !== 'ios') setIsDatePickerVisible(false);
  };

  const handleTimeChangeFromPicker = (event: DateTimePickerEvent, selectedTimeValue?: Date) => {
    setIsTimePickerVisible(Platform.OS === 'ios');
    if (event.type === 'set' && selectedTimeValue) {
      const newFullDateTime = new Date(reminderFormDateTime);
      newFullDateTime.setHours(selectedTimeValue.getHours()); newFullDateTime.setMinutes(selectedTimeValue.getMinutes());
      setReminderFormDateTime(newFullDateTime);
    }
     if (Platform.OS !== 'ios') setIsTimePickerVisible(false);
  };

  const activeFilteredReminders = useMemo(() => {
    const todayFormatted = getTodayDateStringHelper();
    let currentlyFiltered: Reminder[];
    switch (activeFilterOption) {
      case 'pending': currentlyFiltered = remindersList.filter(r => !r.isCompleted); break;
      case 'completed': currentlyFiltered = remindersList.filter(r => r.isCompleted); break;
      case 'today': currentlyFiltered = remindersList.filter(r => r.date === todayFormatted && !r.isCompleted); break;
      case 'all': default: currentlyFiltered = remindersList;
    }
    return applySortingToReminders(currentlyFiltered);
  }, [remindersList, activeFilterOption, applySortingToReminders]);

  const renderFilterOptionButton = (filterKey: FilterOption, buttonTextLabel: string) => (
    <TouchableOpacity style={[styles.filterButton, activeFilterOption === filterKey && styles.filterButtonActive]} onPress={() => {setActiveFilterOption(filterKey);}}>
      <Text style={[styles.filterButtonText, activeFilterOption === filterKey && styles.filterButtonTextActive]}>{buttonTextLabel}</Text>
    </TouchableOpacity>
  );

  const renderSingleReminderItem = ({ item }: { item: Reminder }) => (
    <View style={[styles.reminderItemCard, item.isCompleted && styles.reminderItemCardCompleted]}>
        <TouchableOpacity onPress={() => toggleReminderCompletionState(item.id)} style={styles.itemCheckboxArea}>
            <View style={[styles.itemCheckbox, item.isCompleted && styles.itemCheckboxChecked]}>
            {item.isCompleted && <Text style={styles.itemCheckboxMark}>✓</Text>}
            </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.itemTextContentArea} onPress={() => openReminderCreationModal(item)}>
            <Text style={[styles.itemTitleText, item.isCompleted && styles.itemTextCompletedEffect]}>{item.title}</Text>
            <Text style={[styles.itemDateTimeText, item.isCompleted && styles.itemTextCompletedEffect]}>
            {new Date(item.date + 'T' + (item.time || '00:00')).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} at {item.time}
            </Text>
            {item.notes && <Text style={[styles.itemNotesText, item.isCompleted && styles.itemTextCompletedEffect]} numberOfLines={2}>{item.notes}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmAndDeleteReminder(item.id)} style={styles.itemDeleteButton}>
            <Text style={styles.itemDeleteButtonText}>🗑️</Text>
        </TouchableOpacity>
    </View>
  );

  if (isDataLoading) {
    return ( <SafeAreaView style={styles.fullScreenCentered}><ActivityIndicator size="large" color="#007AFF" /><Text style={styles.informativeText}>Loading Your Reminders...</Text></SafeAreaView> );
  }

  return (
    <SafeAreaView style={styles.baseScreenLayout}>
      <Stack.Screen options={{ headerTitle: 'MinHub Reminders', headerRight: () => ( <View style={styles.headerActionButtonsContainer}><TouchableOpacity onPress={() => {router.push('/App_inApp/Reminders/prodReminders');}} style={styles.headerActionButton}><Text style={styles.headerActionButtonText}>Presets</Text></TouchableOpacity><TouchableOpacity onPress={() => openReminderCreationModal()} style={styles.headerActionButton}><Text style={styles.headerActionButtonText}>Add New</Text></TouchableOpacity></View> ), }} />
      <View style={styles.filterOptionsContainer}>
        {renderFilterOptionButton('pending', 'Pending')}
        {renderFilterOptionButton('today', "Today's Active")}
        {renderFilterOptionButton('completed', 'Completed')}
        {renderFilterOptionButton('all', 'Show All')}
      </View>
      {activeFilteredReminders.length === 0 ? ( <View style={styles.fullScreenCenteredContent}><Text style={styles.informativeText}>{activeFilterOption === 'pending' ? 'No pending reminders. Good job!' : activeFilterOption === 'today' ? 'No active reminders for today.' : activeFilterOption === 'completed' ? 'No reminders completed yet.' : 'No reminders found. Add one or choose a preset!'}</Text></View>
      ) : ( <FlatList data={activeFilteredReminders} renderItem={renderSingleReminderItem} keyExtractor={item => item.id.toString()} contentContainerStyle={styles.mainListContainer}/> )}
      <Modal animationType="slide" transparent={true} visible={isModalEditorVisible} onRequestClose={() => setIsModalEditorVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalMainOverlay} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
          <ScrollView contentContainerStyle={styles.modalScrollViewContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalInnerContentContainer}>
              <Text style={styles.modalMainTitle}>{currentEditingReminder ? 'Edit This Reminder' : 'Create New Reminder'}</Text>
              <TextInput style={styles.modalFormField} placeholder="Reminder Title (e.g., Call John)" value={reminderFormTitle} onChangeText={setReminderFormTitle} autoFocus={!currentEditingReminder}/>
              <TouchableOpacity onPress={() => {setIsDatePickerVisible(true);}} style={styles.dateTimeSelectorButton}><Text style={styles.dateTimeSelectorButtonText}>Date: {convertDateToStorageFormatHelper(reminderFormDateTime)}</Text></TouchableOpacity>
              {isDatePickerVisible && ( <DateTimePicker value={reminderFormDateTime} mode="date" display={Platform.OS === 'ios' ? 'spinner': 'default'} onChange={handleDateChangeFromPicker}/> )}
              <TouchableOpacity onPress={() => {setIsTimePickerVisible(true);}} style={styles.dateTimeSelectorButton}><Text style={styles.dateTimeSelectorButtonText}>Time: {convertTimeToStorageFormatHelper(reminderFormDateTime)}</Text></TouchableOpacity>
              {isTimePickerVisible && ( <DateTimePicker value={reminderFormDateTime} mode="time" display={Platform.OS === 'ios' ? 'spinner': 'default'} is24Hour={true} onChange={handleTimeChangeFromPicker}/> )}
              <TextInput style={[styles.modalFormField, styles.textAreaField]} placeholder="Additional Notes (Optional)" value={reminderFormNotes} onChangeText={setReminderFormNotes} multiline numberOfLines={4}/>
              <View style={styles.modalActionButtonsRow}><TouchableOpacity style={[styles.genericModalButton, styles.modalCancelButton]} onPress={() => {setIsModalEditorVisible(false);}}><Text style={styles.modalButtonTextContent}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.genericModalButton, styles.modalSaveButton]} onPress={processAndSaveReminder}><Text style={styles.modalButtonTextContent}>{currentEditingReminder ? 'Save Changes' : 'Add Reminder'}</Text></TouchableOpacity></View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  baseScreenLayout: { flex: 1, backgroundColor: '#F7FAFC' },
  headerActionButtonsContainer: { flexDirection: 'row' },
  headerActionButton: { marginHorizontal: 10, paddingVertical: 5 },
  headerActionButtonText: { color: Platform.OS === 'ios' ? '#007AFF' : '#1F2937', fontSize: 17, fontWeight: '500' },
  filterOptionsContainer: { flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  filterButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, borderColor: '#4A5568' },
  filterButtonActive: { backgroundColor: '#4A5568', borderColor: '#2D3748' },
  filterButtonText: { color: '#4A5568', fontSize: 13, fontWeight: '500' },
  filterButtonTextActive: { color: '#FFFFFF', fontWeight: '600' },
  fullScreenCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F7FAFC' },
  fullScreenCenteredContent: { flex:1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 0},
  informativeText: { fontSize: 16, color: '#718096', marginTop: 10, textAlign: 'center' },
  mainListContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  reminderItemCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 10, marginBottom: 14, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#CBD5E0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  reminderItemCardCompleted: { backgroundColor: '#E2E8F0', opacity: 0.6 },
  itemCheckboxArea: { padding: 8, marginRight: 12 },
  itemCheckbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#4299E1', justifyContent: 'center', alignItems: 'center' },
  itemCheckboxChecked: { backgroundColor: '#4299E1' },
  itemCheckboxMark: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  itemTextContentArea: { flex: 1 },
  itemTitleText: { fontSize: 17, fontWeight: '600', color: '#2D3748', marginBottom: 2 },
  itemDateTimeText: { fontSize: 13, color: '#718096', marginBottom: 4 },
  itemNotesText: { fontSize: 13, color: '#A0AEC0', fontStyle: 'italic' },
  itemTextCompletedEffect: { textDecorationLine: 'line-through', color: '#718096' },
  itemDeleteButton: { padding: 10, marginLeft: 10 },
  itemDeleteButtonText: { fontSize: Platform.OS === 'ios' ? 24 : 20, color: '#EF4444' },
  modalMainOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalScrollViewContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  modalInnerContentContainer: { backgroundColor: '#FFFFFF', padding: 25, borderRadius: 16, width: '92%', maxWidth: 480, elevation: 10, shadowColor: '#000000', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.2, shadowRadius: 15},
  modalMainTitle: { fontSize: 22, fontWeight: '700', marginBottom: 25, color: '#111827', textAlign: 'center' },
  modalFormField: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 12, fontSize: 16, marginBottom: 20, backgroundColor: '#F9FAFB', color: '#111827' },
  dateTimeSelectorButton: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20, backgroundColor: '#F9FAFB', alignItems: 'flex-start' },
  dateTimeSelectorButtonText: { fontSize: 16, color: '#111827' },
  textAreaField: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  modalActionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  genericModalButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, flex: 1, alignItems: 'center', marginHorizontal: 6 },
  modalCancelButton: { backgroundColor: '#E5E7EB' },
  modalSaveButton: { backgroundColor: '#4F46E5' },
  modalButtonTextContent: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
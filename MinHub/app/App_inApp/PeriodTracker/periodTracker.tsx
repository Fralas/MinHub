import { lightTheme } from '@/src/styles/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy';

interface Symptom {
  name: string;
  intensity: 'mild' | 'moderate' | 'severe';
}

interface DailyLog {
  date: string;
  flow?: FlowIntensity;
  symptoms?: Symptom[];
  notes?: string;
  mood?: 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad';
}

interface PeriodData {
  id: string;
  startDate: string;
  endDate: string | null;
  dailyLogs?: DailyLog[];
}

interface CycleSettings {
  averageCycleLength: number;
  averagePeriodLength: number;
}

interface FertilityData {
  ovulationDay: number;
  fertileWindow: {
    start: number;
    end: number;
  };
}

interface Medication {
  name: string;
  dosage: string;
  times: string[];
  reminderEnabled: boolean;
}

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
};

const getAverageCycleLength = (periods: PeriodData[]): number => {
  if (periods.length < 2) return 28;
  const cycleLengths: number[] = [];
  const sortedPeriods = [...periods].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  for (let i = 0; i < sortedPeriods.length - 1; i++) {
    const diffTime = new Date(sortedPeriods[i+1].startDate).getTime() - new Date(sortedPeriods[i].startDate).getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && diffDays < 100) cycleLengths.push(diffDays);
  }
  return calculateAverage(cycleLengths) || 28;
};

const getAveragePeriodLength = (periods: PeriodData[]): number => {
  const periodLengths: number[] = [];
  periods.forEach(period => {
    if (period.endDate) {
      const diffDays = Math.round((new Date(period.endDate).getTime() - new Date(period.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0 && diffDays < 20) periodLengths.push(diffDays);
    }
  });
  return calculateAverage(periodLengths) || 5;
};

const calculateFertilityWindow = (cycleLength: number): FertilityData => {
  const ovulationDay = cycleLength > 14 ? cycleLength - 14 : Math.round(cycleLength / 2);
  return {
    ovulationDay,
    fertileWindow: { start: Math.max(1, ovulationDay - 5), end: Math.min(cycleLength > 0 ? cycleLength : 35, ovulationDay + 1) }
  };
};

const PERIODS_KEY = 'periodTracker_periods';
const SETTINGS_KEY = 'periodTracker_settings';
const MEDICATIONS_KEY = 'medications';

const loadPeriods = async (): Promise<PeriodData[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(PERIODS_KEY);
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch (e) { return []; }
};

const savePeriods = async (periods: PeriodData[]): Promise<void> => {
  try { await AsyncStorage.setItem(PERIODS_KEY, JSON.stringify(periods)); } catch (e) {}
};

const loadSettings = async (): Promise<CycleSettings> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    return jsonValue ? JSON.parse(jsonValue) : { averageCycleLength: 28, averagePeriodLength: 5 };
  } catch (e) { return { averageCycleLength: 28, averagePeriodLength: 5 }; }
};

const saveSettings = async (settings: CycleSettings): Promise<void> => {
  try { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
};

const PeriodTrackerScreen = () => {
  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [settings, setSettings] = useState<CycleSettings>({ averageCycleLength: 28, averagePeriodLength: 5 });
  const [currentActivePeriod, setCurrentActivePeriod] = useState<PeriodData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerTarget, setDatePickerTarget] = useState<'startPeriod' | 'endPeriod' | 'editStartDate' | 'editEndDate' | null>(null);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loadedPeriods, loadedSettingsFromStorage, loadedMedsString] = await Promise.all([
        loadPeriods(), loadSettings(), AsyncStorage.getItem(MEDICATIONS_KEY)
      ]);
      const sortedPeriods = [...loadedPeriods].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      const newAvgCycle = getAverageCycleLength(sortedPeriods);
      const newAvgPeriod = getAveragePeriodLength(sortedPeriods);
      const finalSettings = {
        averageCycleLength: newAvgCycle || loadedSettingsFromStorage.averageCycleLength,
        averagePeriodLength: newAvgPeriod || loadedSettingsFromStorage.averagePeriodLength
      };
      await saveSettings(finalSettings);
      setSettings(finalSettings);
      setPeriods(sortedPeriods);
      setCurrentActivePeriod(sortedPeriods.find(p => p.endDate === null) || null);
      if (loadedMedsString) setMedications(JSON.parse(loadedMedsString));
    } catch (error) { Alert.alert("Error", "Failed to load cycle data"); }
    finally { setIsLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const showDatePicker = (mode: 'startPeriod' | 'endPeriod' | 'editStartDate' | 'editEndDate', periodId?: string) => {
    setDatePickerTarget(mode);
    if (periodId) setEditingPeriodId(periodId);
    let dateToSet = new Date();
    if ((mode === 'editStartDate' || mode === 'editEndDate') && periodId) {
        const periodToEdit = periods.find(p => p.id === periodId);
        if (periodToEdit) {
            dateToSet = new Date((mode === 'editStartDate' ? periodToEdit.startDate : periodToEdit.endDate || new Date()) + "T00:00:00");
        }
    }
    setSelectedDate(dateToSet);
    setDatePickerVisible(true);
  };

  const handleDateChange = async (event: DateTimePickerEvent, date?: Date) => {
    const isIOS = Platform.OS === 'ios';
    if(!isIOS) setDatePickerVisible(false);
    if (event.type === 'dismissed' || !date || !datePickerTarget) {
        if(isIOS && event.type !== 'neutralButtonPressed') setDatePickerVisible(false);
        return;
    }
    if(isIOS) {
        setSelectedDate(date); 
    } else {
        await applySelectedDate(date);
    }
  };

  const applySelectedDateFromIOSPicker = async () => {
    setDatePickerVisible(false);
    await applySelectedDate(selectedDate);
  };

  const applySelectedDate = async (date: Date) => {
    const dateStr = formatDateToYYYYMMDD(date);
    let updatedPeriodsList = [...periods];
    let requiresRecalculation = false;

    switch (datePickerTarget) {
      case 'startPeriod':
        if (periods.some(p => p.endDate === null)) { Alert.alert("Active Period", "An active period already exists. Please end it first."); return; }
        if (periods.some(p => p.startDate === dateStr)) { Alert.alert("Duplicate", "A period starting on this date already exists."); return; }
        const newPeriod: PeriodData = { id: Date.now().toString(), startDate: dateStr, endDate: null, dailyLogs: [] };
        updatedPeriodsList = [newPeriod, ...periods];
        setCurrentActivePeriod(newPeriod);
        requiresRecalculation = true;
        break;
      case 'endPeriod':
        if (currentActivePeriod) {
          if (new Date(dateStr) < new Date(currentActivePeriod.startDate)) { Alert.alert("Invalid Date", "End date cannot be before start date."); return; }
          updatedPeriodsList = periods.map(p => p.id === currentActivePeriod.id ? { ...p, endDate: dateStr } : p);
          setCurrentActivePeriod(null);
          requiresRecalculation = true;
        }
        break;
      case 'editStartDate':
        updatedPeriodsList = periods.map(p => {
          if (p.id === editingPeriodId) {
            if (p.endDate && new Date(dateStr) > new Date(p.endDate)) { Alert.alert("Invalid Date", "Start date cannot be after end date."); return p; }
            requiresRecalculation = true; return { ...p, startDate: dateStr };
          } return p;
        });
        break;
      case 'editEndDate':
        updatedPeriodsList = periods.map(p => {
          if (p.id === editingPeriodId) {
            if (new Date(dateStr) < new Date(p.startDate)) { Alert.alert("Invalid Date", "End date cannot be before start date."); return p; }
            requiresRecalculation = true; return { ...p, endDate: dateStr };
          } return p;
        });
        break;
    }
    updatedPeriodsList.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    setPeriods(updatedPeriodsList);
    await savePeriods(updatedPeriodsList);
    if (requiresRecalculation) {
      const newAvgCycle = getAverageCycleLength(updatedPeriodsList);
      const newAvgPeriod = getAveragePeriodLength(updatedPeriodsList);
      const newSettings = { averageCycleLength: newAvgCycle, averagePeriodLength: newAvgPeriod };
      await saveSettings(newSettings);
      setSettings(newSettings);
    }
    setCurrentActivePeriod(updatedPeriodsList.find(p => p.endDate === null) || null);
    setEditingPeriodId(null);
    setDatePickerTarget(null);
  };
  
  const logFlow = async (flow: FlowIntensity) => {
    if (!currentActivePeriod) return;
    const today = formatDateToYYYYMMDD(new Date());
    const updatedLogs = currentActivePeriod.dailyLogs ? [...currentActivePeriod.dailyLogs] : [];
    const existingLogIndex = updatedLogs.findIndex(log => log.date === today);
    if (existingLogIndex >= 0) { updatedLogs[existingLogIndex].flow = flow; }
    else { updatedLogs.push({ date: today, flow }); }
    updatedLogs.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const updatedPeriod = { ...currentActivePeriod, dailyLogs: updatedLogs };
    const updatedPeriods = periods.map(p => p.id === currentActivePeriod.id ? updatedPeriod : p);
    setPeriods(updatedPeriods);
    setCurrentActivePeriod(updatedPeriod);
    await savePeriods(updatedPeriods);
  };

  const getPrediction = () => {
    if (isLoading) return "Loading predictions...";
    if (periods.length === 0 && !currentActivePeriod) return "Log your first period to see predictions.";
    if (currentActivePeriod) return "Currently on period";
    const lastPeriod = periods[0];
    if (!lastPeriod) return "Log a period to see predictions.";
    const lastStartDate = new Date(lastPeriod.startDate + "T00:00:00");
    const nextPredictedStartDate = new Date(lastStartDate);
    nextPredictedStartDate.setDate(lastStartDate.getDate() + (settings.averageCycleLength || 28));
    const today = new Date(); today.setHours(0,0,0,0); nextPredictedStartDate.setHours(0,0,0,0);
    const diffTime = nextPredictedStartDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `Next period was expected ${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return "Period expected today!";
    if (diffDays === 1) return "Period expected tomorrow";
    return `Next period expected in ${diffDays} days`;
  };

  const getCurrentDay = () => {
    if (!currentActivePeriod) return "No active period";
    const start = new Date(currentActivePeriod.startDate + "T00:00:00");
    const today = new Date(); today.setHours(0,0,0,0);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `Day ${diffDays}`;
  };

  const trackSymptom = async (symptom: Symptom) => {
    if (!currentActivePeriod) return;
    const today = formatDateToYYYYMMDD(new Date());
    const updatedLogs = currentActivePeriod.dailyLogs ? [...currentActivePeriod.dailyLogs] : [];
    let dailyLog = updatedLogs.find(log => log.date === today);
    if (!dailyLog) { dailyLog = { date: today, symptoms: [] }; updatedLogs.push(dailyLog); }
    if (!dailyLog.symptoms) dailyLog.symptoms = [];
    const existingIndex = dailyLog.symptoms.findIndex(s => s.name === symptom.name);
    if (existingIndex >= 0) { dailyLog.symptoms[existingIndex] = symptom; }
    else { dailyLog.symptoms.push(symptom); }
    updatedLogs.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const updatedPeriod = { ...currentActivePeriod, dailyLogs: updatedLogs };
    const updatedPeriods = periods.map(p => p.id === currentActivePeriod.id ? updatedPeriod : p);
    setPeriods(updatedPeriods);
    setCurrentActivePeriod(updatedPeriod);
    await savePeriods(updatedPeriods);
  };

  const trackMood = async (mood: NonNullable<DailyLog['mood']>) => {
    if (!currentActivePeriod) return;
    const today = formatDateToYYYYMMDD(new Date());
    const updatedLogs = currentActivePeriod.dailyLogs ? [...currentActivePeriod.dailyLogs] : [];
    let dailyLog = updatedLogs.find(log => log.date === today);
    if (!dailyLog) { dailyLog = { date: today }; updatedLogs.push(dailyLog); }
    dailyLog.mood = mood;
    updatedLogs.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const updatedPeriod = { ...currentActivePeriod, dailyLogs: updatedLogs };
    const updatedPeriods = periods.map(p => p.id === currentActivePeriod.id ? updatedPeriod : p);
    setPeriods(updatedPeriods);
    setCurrentActivePeriod(updatedPeriod);
    await savePeriods(updatedPeriods);
  };
  
  const getCycleInsights = () => {
    if (periods.length < 1) return null;
    const symptomMap: Record<string, {count: number, severeDays: number}> = {};
    let positiveDays = 0, negativeDays = 0, totalMoodDays = 0;
    periods.forEach(period => {
        period.dailyLogs?.forEach(log => {
            log.symptoms?.forEach(symptom => {
                if (!symptomMap[symptom.name]) symptomMap[symptom.name] = {count: 0, severeDays: 0};
                symptomMap[symptom.name].count++;
                if (symptom.intensity === 'severe') symptomMap[symptom.name].severeDays++;
            });
            if (log.mood) {
                totalMoodDays++;
                if (log.mood === 'very_happy' || log.mood === 'happy') positiveDays++;
                if (log.mood === 'sad' || log.mood === 'very_sad') negativeDays++;
            }
        });
    });
    return {
        frequentSymptoms: Object.entries(symptomMap).sort((a,b) => b[1].count - a[1].count).slice(0,3).map(([name, data]) => ({name, ...data})),
        moodBalance: { positive: positiveDays, negative: negativeDays, total: totalMoodDays },
        averageCycleLength: settings.averageCycleLength,
        averagePeriodLength: settings.averagePeriodLength
    };
  };

  const exportData = async () => {
    if (!Sharing.isAvailableAsync()) {
      Alert.alert("Sharing Not Available", "Sharing is not available on this device.");
      return;
    }
    const cycleInsightsData = getCycleInsights();
    const fertilityInfo = calculateFertilityWindow(settings.averageCycleLength);
    const dataToExport = {
      appName: "MinHubPeriodTracker",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      settings,
      periods,
      medications,
      statistics: cycleInsightsData,
      currentFertilityInfo: fertilityInfo,
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const filename = "MinHub_PeriodTracker_Data.json";
    const fileUri = FileSystem.cacheDirectory + filename;

    try {
      await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Period Tracker Data',
        UTI: 'public.json',
      });
    } catch (error) {
      console.error('Failed to export data', error);
      Alert.alert('Export Error', 'Could not export your data.');
    }
  };
  
  const fertilityData = calculateFertilityWindow(settings.averageCycleLength);

  if (isLoading) {
    return <View style={styles.loadingContainer}><Text>Loading period tracker...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.headerText}>Period Tracker</Text>
          
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>{getCurrentDay()}</Text>
            <Text style={styles.statusSubtitle}>{getPrediction()}</Text>
          </View>

          {!currentActivePeriod ? (
            <TouchableOpacity 
              style={[styles.button, styles.startButton]}
              onPress={() => showDatePicker('startPeriod')}
            >
              <Text style={styles.buttonText}>Start Period</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activePeriodContainer}>
              <Text style={styles.activePeriodTitle}>Current Period</Text>
              <Text style={styles.activePeriodDate}>Started: {new Date(currentActivePeriod.startDate + "T00:00:00").toLocaleDateString('en-GB')}</Text>
              
              <Text style={styles.sectionTitleSmall}>Log Flow</Text>
              <View style={styles.flowButtonsContainer}>
                {(['spotting', 'light', 'medium', 'heavy'] as FlowIntensity[]).map(flow => (
                  <TouchableOpacity
                    key={flow}
                    style={[
                      styles.flowButton,
                      currentActivePeriod.dailyLogs?.find(
                        log => log.date === formatDateToYYYYMMDD(new Date()) && log.flow === flow
                      ) && styles.flowButtonSelected
                    ]}
                    onPress={() => logFlow(flow)}
                  >
                    <Text style={styles.flowButtonText}>
                      {flow.charAt(0).toUpperCase() + flow.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={[styles.button, styles.endButton]}
                onPress={() => showDatePicker('endPeriod')}
              >
                <Text style={styles.buttonText}>End Period</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {currentActivePeriod && (
            <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Track Symptoms Today</Text>
              <View style={styles.symptomButtons}>
                {['Headache', 'Cramps', 'Fatigue', 'Bloating', 'Nausea', 'Backache'].map(symptomName => {
                  const currentSymptom = currentActivePeriod.dailyLogs
                                        ?.find(log => log.date === formatDateToYYYYMMDD(new Date()))
                                        ?.symptoms?.find(s => s.name === symptomName);
                  return (
                  <TouchableOpacity
                    key={symptomName}
                    style={[ styles.symptomButton, currentSymptom && styles.symptomButtonSelected ]}
                    onPress={() => trackSymptom({name: symptomName, intensity: currentSymptom?.intensity === 'moderate' ? 'severe' : (currentSymptom?.intensity === 'mild' ? 'moderate' : 'mild')})}
                  >
                    <Text style={styles.symptomButtonText}>{symptomName} {currentSymptom ? `(${currentSymptom.intensity})` : ''}</Text>
                  </TouchableOpacity>
                );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Track Mood Today</Text>
              <View style={styles.moodButtons}>
                {(['very_happy', 'happy', 'neutral', 'sad', 'very_sad'] as NonNullable<DailyLog['mood']>[]).map(moodValue => {
                  const currentMood = currentActivePeriod.dailyLogs
                                        ?.find(log => log.date === formatDateToYYYYMMDD(new Date()))?.mood;
                  return (
                  <TouchableOpacity
                    key={moodValue}
                    style={[ styles.moodButton, currentMood === moodValue && styles.moodButtonSelected ]}
                    onPress={() => trackMood(moodValue)}
                  >
                    <Text style={styles.moodButtonText}>{moodValue.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                );
                })}
              </View>
            </View>
            </>
          )}

          {getCycleInsights() && (
            <View style={styles.insightsContainer}>
              <Text style={styles.insightsTitle}>Cycle Insights</Text>
              <Text style={styles.insightItem}>Avg. Cycle Length: {getCycleInsights()!.averageCycleLength} days</Text>
              <Text style={styles.insightItem}>Avg. Period Length: {getCycleInsights()!.averagePeriodLength} days</Text>
              
              <Text style={styles.insightsSubtitle}>Frequent Symptoms (Top 3):</Text>
              {getCycleInsights()!.frequentSymptoms.length > 0 ? getCycleInsights()!.frequentSymptoms.map(symptom => (
                <Text key={symptom.name} style={styles.insightItem}>
                  {symptom.name}: {symptom.count} occurrences ({symptom.severeDays} severe)
                </Text>
              )) : <Text style={styles.insightItem}>No symptom data yet.</Text>}

              <Text style={styles.insightsSubtitle}>Mood Balance:</Text> 
              {getCycleInsights()!.moodBalance.total > 0 ? (
                <>
                  <Text style={styles.insightItem}>Positive Days: {getCycleInsights()!.moodBalance.positive}</Text>
                  <Text style={styles.insightItem}>Negative Days: {getCycleInsights()!.moodBalance.negative}</Text>
                </>
              ) : <Text style={styles.insightItem}>No mood data yet.</Text>}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fertility Window</Text>
            <View style={styles.phaseIndicator}>
              <View style={[styles.phasePill, styles.fertilePill]}>
                <Text style={styles.phasePillText}>Fertile: Day {fertilityData.fertileWindow.start}-{fertilityData.fertileWindow.end}</Text>
              </View>
              <View style={[styles.phasePill, styles.ovulationPill]}>
                <Text style={styles.phasePillText}>Ovulation: Day {fertilityData.ovulationDay}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
             <TouchableOpacity style={[styles.button, styles.exportButton]} onPress={exportData}>
                <Text style={styles.buttonText}>Export Data</Text>
            </TouchableOpacity>
          </View>

          {datePickerVisible && (
             Platform.OS === 'ios' ? (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={datePickerVisible}
                    onRequestClose={() => setDatePickerVisible(false)}
                >
                    <View style={styles.datePickerModalOverlay}>
                        <View style={styles.datePickerModalContent}>
                            <View style={styles.datePickerHeader}>
                                <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                                    <Text style={styles.datePickerActionText}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.datePickerTitleText}>Select Date</Text>
                                <TouchableOpacity onPress={applySelectedDateFromIOSPicker}>
                                    <Text style={styles.datePickerActionText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="spinner"
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                                textColor={lightTheme.text}
                            />
                        </View>
                    </View>
                </Modal>
            ) : (
                 <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                />
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: lightTheme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightTheme.background,
  },
  centeredLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightTheme.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: lightTheme.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: lightTheme.card,
    padding: 18,
    borderRadius: 15,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: lightTheme.primary,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 16,
    color: lightTheme.text,
    textAlign: 'center',
  },
  activePeriodContainer: {
    width: '100%',
    backgroundColor: '#FFFAEB',
    borderRadius: 15,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activePeriodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: lightTheme.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  activePeriodDate: {
    fontSize: 15,
    color: lightTheme.text,
    textAlign: 'center',
    marginBottom: 15,
  },
  sectionTitleSmall: {
    fontSize: 15,
    fontWeight: '600',
    color: lightTheme.primary,
    marginTop: 10,
    marginBottom: 8,
  },
  flowButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  flowButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: lightTheme.border,
    minWidth: 70,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: lightTheme.subtleText,
  },
  flowButtonSelected: {
    backgroundColor: lightTheme.primary,
    borderColor: lightTheme.primary,
  },
  flowButtonText: {
    color: lightTheme.text,
    fontWeight: '500',
    fontSize: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  startButton: {
    backgroundColor: lightTheme.primary,
  },
  endButton: {
    backgroundColor: lightTheme.danger,
    marginTop: 10,
  },
  exportButton: {
    backgroundColor: '#1ABC9C',
  },
  buttonText: {
    color: lightTheme.card,
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    marginTop: 15,
    width: '100%',
    padding: 15,
    backgroundColor: lightTheme.card,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: lightTheme.primary,
  },
  symptomButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  symptomButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    backgroundColor: lightTheme.border,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: lightTheme.subtleText,
  },
  symptomButtonSelected: {
    backgroundColor: lightTheme.primary,
    borderColor: lightTheme.primary,
  },
  symptomButtonText: {
    color: lightTheme.text,
    fontSize: 13,
  },
  moodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  moodButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    margin: 4,
    backgroundColor: lightTheme.border,
    borderRadius: 18,
    minWidth: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: lightTheme.subtleText,
  },
  moodButtonSelected: {
    backgroundColor: lightTheme.primary,
    borderColor: lightTheme.primary,
  },
  moodButtonText: {
    color: lightTheme.text,
    fontSize: 13,
    textAlign: 'center',
  },
  insightsContainer: {
    marginTop: 20,
    padding: 18,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    width: '100%',
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2E7D32',
    textAlign: 'center',
  },
  insightsSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#388E3C',
    marginTop: 10,
    marginBottom: 5,
  },
  insightItem: {
    fontSize: 14,
    color: '#1B5E20',
    marginBottom: 5,
    paddingLeft: 10,
  },
  phaseIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  phasePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    elevation: 1,
  },
  phasePillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4E342E',
  },
  fertilePill: {
    backgroundColor: '#FFCDD2',
  },
  ovulationPill: {
    backgroundColor: '#F8BBD0',
  },
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  datePickerModalContent: {
    backgroundColor: lightTheme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.border,
  },
  datePickerActionText: {
    color: lightTheme.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  datePickerTitleText:{
    fontSize: 17,
    fontWeight: '600',
    color: lightTheme.text,
  },
});

export default PeriodTrackerScreen;
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


import { formatDateToYYYYMMDD, getAverageCycleLength, getAveragePeriodLength } from '../../utils/cycleLogic';
import { loadPeriods, loadSettings, savePeriods, saveSettings } from '../../utils/cycleStore';
import { CycleSettings, DailyLog, FlowIntensity, Mood, PeriodData, Symptom } from '../../utils/cycleTypes';

const FLOW_OPTIONS: FlowIntensity[] = ['spotting', 'light', 'medium', 'heavy'];
const SYMPTOM_OPTIONS: Symptom[] = ['cramps', 'headache', 'fatigue', 'nausea', 'acne', 'tender_breasts', 'backache', 'bloating'];
const MOOD_OPTIONS: Mood[] = ['happy', 'sad', 'irritable', 'anxious', 'calm', 'energetic', 'mood_swings', 'stressed'];

const defaultInitialSettings: CycleSettings = { averageCycleLength: 28, averagePeriodLength: 5 };

export default function PeriodTrackerScreen() {
  const router = useRouter();
  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [settings, setSettings] = useState<CycleSettings>(defaultInitialSettings);
  const [currentActivePeriod, setCurrentActivePeriod] = useState<PeriodData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerTarget, setDatePickerTarget] = useState<'startPeriod' | 'endPeriod' | 'editStartDate' | 'editEndDate' | null>(null);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

        const loadedPeriodsData = await loadPeriods();
        const loadedSettingsData = await loadSettings();

        const newAvgCycle = getAverageCycleLength(loadedPeriodsData);
        const newAvgPeriod = getAveragePeriodLength(loadedPeriodsData);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

interface DailyLog {
  date: string;
  flow?: FlowIntensity;
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

type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy';


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
  const sortedPeriods = [...periods].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  for (let i = 0; i < sortedPeriods.length - 1; i++) {
      const currentCycleStartDate = new Date(sortedPeriods[i].startDate);
      const nextCycleStartDate = new Date(sortedPeriods[i + 1].startDate);
      const diffTime = Math.abs(nextCycleStartDate.getTime() - currentCycleStartDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 15 && diffDays < 60) {
          cycleLengths.push(diffDays);
      }
  }
  return calculateAverage(cycleLengths) || 28;
};

const getAveragePeriodLength = (periods: PeriodData[]): number => {
  const periodLengths: number[] = [];
  periods.forEach(period => {
    if (period.endDate) {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
       if (diffDays > 0 && diffDays < 15) {
          periodLengths.push(diffDays);
      }
    }
  });
  return calculateAverage(periodLengths) || 5;
};

const PERIODS_KEY = '@periodTracker_periods_v_mix';
const SETTINGS_KEY = '@periodTracker_settings_v_mix';

const loadPeriods = async (): Promise<PeriodData[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(PERIODS_KEY);
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to load periods', e);
    return [];
  }
};

const savePeriods = async (periods: PeriodData[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(PERIODS_KEY, JSON.stringify(periods));
  } catch (e) {
    console.error('Failed to save periods', e);
  }
};

const loadSettings = async (): Promise<CycleSettings> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    return jsonValue ? JSON.parse(jsonValue) : { averageCycleLength: 28, averagePeriodLength: 5 };
  } catch (e) {
    console.error('Failed to load settings', e);
    return { averageCycleLength: 28, averagePeriodLength: 5 };
  }
};

const saveSettings = async (settings: CycleSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
};


export default function PeriodTrackerScreen() {
  const router = useRouter();
  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [settings, setSettings] = useState<CycleSettings>({ averageCycleLength: 28, averagePeriodLength: 5 });
  const [currentActivePeriod, setCurrentActivePeriod] = useState<PeriodData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerTarget, setDatePickerTarget] = useState<'startPeriod' | 'endPeriod' | null>(null);


  const fetchDataInternal = useCallback(async () => {
    setIsLoading(true);
    try {
        const [loadedPeriodsData, loadedSettingsData] = await Promise.all([
            loadPeriods(),
            loadSettings()
        ]);
        
        const newAvgCycle = getAverageCycleLength(loadedPeriodsData);
        const newAvgPeriod = getAveragePeriodLength(loadedPeriodsData);

        let finalSettings = loadedSettingsData;
        if (newAvgCycle !== loadedSettingsData.averageCycleLength || newAvgPeriod !== loadedSettingsData.averagePeriodLength ) {
            finalSettings = { 
                averageCycleLength: newAvgCycle || 28, 
                averagePeriodLength: newAvgPeriod || 5
            };
            await saveSettings(finalSettings);
        }
        
        setSettings(finalSettings);
        const sortedPeriods = [...loadedPeriodsData].sort((a, b) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        setPeriods(sortedPeriods);
        setCurrentActivePeriod(sortedPeriods.find(p => p.endDate === null) || null);
    } catch (error) {
        Alert.alert("Errore", "Impossibile caricare i dati del ciclo");
    } finally {
        setIsLoading(false);
    }
  }, []);

  useFocusEffect(fetchDataInternal);

  const showDatePicker = (mode: 'startPeriod' | 'endPeriod') => {
    setDatePickerTarget(mode);
    setSelectedDate(new Date());
    setDatePickerVisible(true);
  };

  const handleDateChange = async (event: DateTimePickerEvent, date?: Date) => {
    const currentTarget = datePickerTarget; 
    setDatePickerVisible(Platform.OS === 'ios');

    if (event.type === 'set' && date && currentTarget) {
        const dateStr = formatDateToYYYYMMDD(date);
        let updatedPeriods = [...periods];
        let needsSave = false;

        if (currentTarget === 'startPeriod') {
            if (currentActivePeriod) {
                Alert.alert("Ciclo Attivo", "C'è già un ciclo attivo.");
            } else {
                const newPeriod: PeriodData = {
                    id: Date.now().toString(),
                    startDate: dateStr,
                    endDate: null,
                    dailyLogs: [{date: dateStr}]
                };
                updatedPeriods = [newPeriod, ...periods].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
                setPeriods(updatedPeriods);
                setCurrentActivePeriod(newPeriod);
                needsSave = true;
            }
        } else if (currentTarget === 'endPeriod' && currentActivePeriod) {
            if (new Date(dateStr) < new Date(currentActivePeriod.startDate)) {
                Alert.alert("Data non valida", "La data di fine non può precedere l'inizio.");
            } else {
                updatedPeriods = periods.map(p => 
                    p.id === currentActivePeriod.id ? { ...p, endDate: dateStr } : p
                );
                setPeriods(updatedPeriods);
                setCurrentActivePeriod(null);
                needsSave = true;
            }
        }

        if (needsSave) {
            await savePeriods(updatedPeriods);
            const newAvgCycle = getAverageCycleLength(updatedPeriods);
            const newAvgPeriod = getAveragePeriodLength(updatedPeriods);
            const newSettings = { averageCycleLength: newAvgCycle || 28, averagePeriodLength: newAvgPeriod || 5 };
            await saveSettings(newSettings);
            setSettings(newSettings);
        }
    }
    setDatePickerTarget(null); 
  };


  const getPrediction = (): string => {
    if (periods.length === 0 || !periods[0]?.startDate) return "Registra il tuo primo ciclo.";
    if (currentActivePeriod) return "Ciclo attualmente in corso.";
    
    const lastPeriod = periods[0];
    const lastStart = new Date(lastPeriod.startDate);
    const nextStart = new Date(lastStart);
    nextStart.setDate(lastStart.getDate() + settings.averageCycleLength);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextStart.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((nextStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < -5) return `Prossimo previsto: ${nextStart.toLocaleDateString()} (in ritardo?)`;
    if (diffDays < 0) return `Prossimo previsto: ${nextStart.toLocaleDateString()} (in ritardo?)`;
    if (diffDays === 0) return "Ciclo previsto oggi!";
    if (diffDays === 1) return "Ciclo previsto domani";
    return `Ciclo previsto tra ${diffDays} giorni`;
  };

  const getCurrentDayInfo = (): string => {
    if (!currentActivePeriod) return "Nessun ciclo attivo";
    const start = new Date(currentActivePeriod.startDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `Giorno ${diffDays} del ciclo`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.headerText}>Traccia Ciclo</Text>
          
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>{getCurrentDayInfo()}</Text>
            <Text style={styles.statusSubtitle}>{getPrediction()}</Text>
            {currentActivePeriod && <Text style={styles.infoTextLight}>Inizio: {new Date(currentActivePeriod.startDate).toLocaleDateString()}</Text>}
          </View>

          {!currentActivePeriod ? (
            <TouchableOpacity 
              style={[styles.button, styles.startButton]}
              onPress={() => showDatePicker('startPeriod')}
            >
              <Text style={styles.buttonText}>Inizia Periodo</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activePeriodContainer}>
              <Text style={styles.activePeriodTitle}>Periodo Attuale</Text>
              <TouchableOpacity
                style={[styles.button, styles.endButton]}
                onPress={() => showDatePicker('endPeriod')}
              >
                <Text style={styles.buttonText}>Termina Periodo</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.infoBox}>
              <Text style={styles.infoTextBold}>Info Medie:</Text>
              <Text style={styles.infoText}>Lunghezza ciclo: ~{settings.averageCycleLength} giorni</Text>
              <Text style={styles.infoText}>Durata periodo: ~{settings.averagePeriodLength} giorni</Text>
          </View>

          {datePickerVisible && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF0F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F5'},
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, alignItems: 'center', paddingTop: 30, paddingHorizontal: 20, paddingBottom: 30 },
  headerText: { fontSize: 30, fontWeight: 'bold', color: '#D81B60', marginBottom: 25, fontFamily: Platform.OS === 'ios' ? 'Papyrus' : 'serif' },
  statusCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius:20, marginBottom:25, width: '100%', alignItems:'center', shadowColor: "#FF69B4", shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.25, shadowRadius: 4, elevation: 7, borderWidth: 1, borderColor: '#FFE4E1'},
  statusTitle: { fontSize: 22, fontWeight: '600', color: '#C2185B', marginBottom: 7, textAlign: 'center' },
  statusSubtitle: { fontSize: 16, color: '#AD1457', marginBottom: 12, textAlign: 'center', fontStyle: 'italic' },
  activePeriodContainer: { width: '100%', alignItems: 'center', marginBottom: 20, padding:15, backgroundColor: 'rgba(255,235,238, 0.6)', borderRadius:15, borderWidth:1, borderColor: 'rgba(255,182,193, 0.5)'},
  activePeriodTitle: { fontSize:18, fontWeight:'500', color: '#C2185B', marginBottom:15},
  button: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, marginBottom: 20, width: '95%', alignItems: 'center', elevation: 3, shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.15, shadowRadius: 2.5},
  startButton: { backgroundColor: '#4CAF50' },
  endButton: { backgroundColor: '#F44336', marginTop:10 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  infoBox: { marginTop: 15, padding: 18, backgroundColor: 'rgba(255, 235, 238, 0.75)', borderRadius: 15, width: '100%', alignItems:'flex-start' },
  infoText: { fontSize: 15, color: '#C2185B', marginBottom: 6,},
  infoTextLight: {fontSize: 14, color: '#E91E63', textAlign: 'center'},
  infoTextBold: {fontSize: 16, color: '#AD1457', marginBottom: 8, fontWeight:'bold'}
});
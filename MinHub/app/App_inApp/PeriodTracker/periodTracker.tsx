import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet } from 'react-native';

// ===== TYPES =====
type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy';

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

// ===== UTILITY FUNCTIONS =====
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getAverageCycleLength = (periods: PeriodData[]): number => {
  if (periods.length < 2) return 28;
  // ... (implementazione esistente)
  return 28; // Default
};

const getAveragePeriodLength = (periods: PeriodData[]): number => {
  if (periods.length === 0) return 5;
  // ... (implementazione esistente)
  return 5; // Default
};

// ===== STORAGE FUNCTIONS =====
const PERIODS_KEY = 'periodTracker_periods';
const SETTINGS_KEY = 'periodTracker_settings';

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

// ===== MAIN COMPONENT =====
const PeriodTrackerScreen = () => {
  const router = useRouter();
  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [settings, setSettings] = useState<CycleSettings>({ averageCycleLength: 28, averagePeriodLength: 5 });
  const [currentActivePeriod, setCurrentActivePeriod] = useState<PeriodData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerTarget, setDatePickerTarget] = useState<'startPeriod' | 'endPeriod' | 'editStartDate' | 'editEndDate' | null>(null);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loadedPeriods, loadedSettings] = await Promise.all([loadPeriods(), loadSettings()]);
      
      const newAvgCycle = getAverageCycleLength(loadedPeriods);
      const newAvgPeriod = getAveragePeriodLength(loadedPeriods);

      let finalSettings = loadedSettings;
      if (newAvgCycle !== loadedSettings.averageCycleLength || newAvgPeriod !== loadedSettings.averagePeriodLength) {
        finalSettings = {
          averageCycleLength: newAvgCycle,
          averagePeriodLength: newAvgPeriod
        };
        await saveSettings(finalSettings);
      }

      setSettings(finalSettings);
      const sortedPeriods = [...loadedPeriods].sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      setPeriods(sortedPeriods);
      setCurrentActivePeriod(sortedPeriods.find(p => p.endDate === null) || null);
    } catch (error) {
      Alert.alert("Error", "Failed to load cycle data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      
      const fetchDataWrapper = async () => {
        try {
          await fetchData();
        } catch (error) {
          if (isActive) {
            Alert.alert("Error", "Failed to load data");
          }
        }
      };

      fetchDataWrapper();

      return () => {
        isActive = false;
      };
    }, [fetchData])
  );

  // ... (resto delle funzioni rimangono uguali)

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
        {/* UI rimanente uguale */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FFF0F5' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFF0F5'
  },
  scrollContainer: { 
    flexGrow: 1 
  },
  container: { 
    flex: 1, 
    alignItems: 'center', 
    paddingTop: 30, 
    paddingHorizontal: 20, 
    paddingBottom: 30 
  },
  headerText: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#D81B60', 
    marginBottom: 25, 
    fontFamily: Platform.OS === 'ios' ? 'Papyrus' : 'serif' 
  },
  // Aggiungi qui tutti gli altri stili che usi nel componente
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
    width: '100%',
    alignItems: 'center',
    shadowColor: "#FF69B4",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#FFE4E1'
  },
  // Continua con tutti gli altri stili...
});

export default PeriodTrackerScreen;
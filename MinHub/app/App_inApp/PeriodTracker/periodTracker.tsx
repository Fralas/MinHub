import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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




const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
};

const getAverageCycleLength = (periods: PeriodData[]): number => {
  if (periods.length < 2) return 28;
  
  const cycleLengths: number[] = [];
  
  for (let i = 0; i < periods.length - 1; i++) {
    const current = periods[i];
    const next = periods[i + 1];
    
    if (current.endDate && next.endDate) {
      const currentEnd = new Date(current.endDate);
      const nextStart = new Date(next.startDate);
      const diffDays = Math.round((nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        cycleLengths.push(diffDays);
      }
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
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      periodLengths.push(diffDays);
    }
  });
  
  return calculateAverage(periodLengths) || 5;
};

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

const PeriodTrackerScreen = () => {
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
      const [loadedPeriods, loadedSettings] = await Promise.all([
        loadPeriods(),
        loadSettings()
      ]);
      
      const newAvgCycle = getAverageCycleLength(loadedPeriods);
      const newAvgPeriod = getAveragePeriodLength(loadedPeriods);

      const finalSettings = {
        averageCycleLength: newAvgCycle,
        averagePeriodLength: newAvgPeriod
      };
      
      await saveSettings(finalSettings);
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

  const showDatePicker = (mode: 'startPeriod' | 'endPeriod' | 'editStartDate' | 'editEndDate', periodId?: string) => {
    setDatePickerTarget(mode);
    if (periodId) setEditingPeriodId(periodId);
    setSelectedDate(new Date());
    setDatePickerVisible(true);
  };

  const handleDateChange = async (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      setDatePickerVisible(false);
      return;
    }

    if (!date || !datePickerTarget) return;
    
    const dateStr = formatDateToYYYYMMDD(date);
    let updatedPeriods = [...periods];

    try {
      switch (datePickerTarget) {
        case 'startPeriod':
          if (!currentActivePeriod) {
            const newPeriod: PeriodData = {
              id: Date.now().toString(),
              startDate: dateStr,
              endDate: null,
              dailyLogs: []
            };
            updatedPeriods = [newPeriod, ...periods];
            setCurrentActivePeriod(newPeriod);
          }
          break;

        case 'endPeriod':
          if (currentActivePeriod) {
            updatedPeriods = periods.map(p => 
              p.id === currentActivePeriod.id ? { ...p, endDate: dateStr } : p
            );
            setCurrentActivePeriod(null);
          }
          break;

        case 'editStartDate':
          updatedPeriods = periods.map(p => 
            p.id === editingPeriodId ? { ...p, startDate: dateStr } : p
          );
          break;

        case 'editEndDate':
          updatedPeriods = periods.map(p => 
            p.id === editingPeriodId ? { ...p, endDate: dateStr } : p
          );
          break;
      }

      setPeriods(updatedPeriods);
      await savePeriods(updatedPeriods);
      
      const newAvgCycle = getAverageCycleLength(updatedPeriods);
      const newAvgPeriod = getAveragePeriodLength(updatedPeriods);
      const newSettings = {
        averageCycleLength: newAvgCycle,
        averagePeriodLength: newAvgPeriod
      };
      
      await saveSettings(newSettings);
      setSettings(newSettings);

    } catch (error) {
      Alert.alert("Error", "Failed to save changes");
    } finally {
      setDatePickerVisible(false);
    }
  };

  const logFlow = async (flow: FlowIntensity) => {
    if (!currentActivePeriod) return;
    
    const today = formatDateToYYYYMMDD(new Date());
    const updatedLogs = currentActivePeriod.dailyLogs 
      ? [...currentActivePeriod.dailyLogs] 
      : [];
    
    const existingLogIndex = updatedLogs.findIndex(log => log.date === today);
    
    if (existingLogIndex >= 0) {
      updatedLogs[existingLogIndex] = { ...updatedLogs[existingLogIndex], flow };
    } else {
      updatedLogs.push({ date: today, flow });
    }

    const updatedPeriod = {
      ...currentActivePeriod,
      dailyLogs: updatedLogs
    };

    const updatedPeriods = periods.map(p => 
      p.id === currentActivePeriod.id ? updatedPeriod : p
    );

    setPeriods(updatedPeriods);
    setCurrentActivePeriod(updatedPeriod);
    await savePeriods(updatedPeriods);
  };

  const getPrediction = () => {
    if (!periods.length) return "Register your first period";
    if (currentActivePeriod) return "Currently on period";
    
    const lastPeriod = periods[0];
    const lastStart = new Date(lastPeriod.startDate);
    const nextStart = new Date(lastStart);
    nextStart.setDate(lastStart.getDate() + settings.averageCycleLength);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextStart.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((nextStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Next period was expected ${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return "Period expected today!";
    if (diffDays === 1) return "Period expected tomorrow";
    return `Period expected in ${diffDays} days`;
  };
  

  const getCurrentDay = () => {
    if (!currentActivePeriod) return "No active period";
    
    const start = new Date(currentActivePeriod.startDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `Day ${diffDays} of cycle`;
  };



  const trackSymptom = async (symptom: Symptom) => {
  if (!currentActivePeriod) return;
  
  const today = formatDateToYYYYMMDD(new Date());
  const updatedLogs = currentActivePeriod.dailyLogs ? [...currentActivePeriod.dailyLogs] : [];
  
  let dailyLog = updatedLogs.find(log => log.date === today);
  if (!dailyLog) {
    dailyLog = { date: today };
    updatedLogs.push(dailyLog);
  }

  if (!dailyLog.symptoms) {
    dailyLog.symptoms = [];
  }

  const existingIndex = dailyLog.symptoms.findIndex(s => s.name === symptom.name);
  if (existingIndex >= 0) {
    dailyLog.symptoms[existingIndex] = symptom;
  } else {
    dailyLog.symptoms.push(symptom);
  }

  const updatedPeriod = {
    ...currentActivePeriod,
    dailyLogs: updatedLogs
  };

  const updatedPeriods = periods.map(p => 
    p.id === currentActivePeriod.id ? updatedPeriod : p
  );

  setPeriods(updatedPeriods);
  setCurrentActivePeriod(updatedPeriod);
  await savePeriods(updatedPeriods);
};

const addNote = async (note: string) => {
  if (!currentActivePeriod) return;
  
  const today = formatDateToYYYYMMDD(new Date());
  const updatedLogs = currentActivePeriod.dailyLogs ? [...currentActivePeriod.dailyLogs] : [];
  
  let dailyLog = updatedLogs.find(log => log.date === today);
  if (!dailyLog) {
    dailyLog = { date: today };
    updatedLogs.push(dailyLog);
  }


  const updatedPeriod = {
    ...currentActivePeriod,
    dailyLogs: updatedLogs
  };

  const updatedPeriods = periods.map(p => 
    p.id === currentActivePeriod.id ? updatedPeriod : p
  );

  setPeriods(updatedPeriods);
  setCurrentActivePeriod(updatedPeriod);
  await savePeriods(updatedPeriods);
};


const trackMood = async (mood: DailyLog['mood']) => {
  if (!currentActivePeriod) return;
  
  const today = formatDateToYYYYMMDD(new Date());
  const updatedLogs = currentActivePeriod.dailyLogs ? [...currentActivePeriod.dailyLogs] : [];
  
  let dailyLog = updatedLogs.find(log => log.date === today);
  if (!dailyLog) {
    dailyLog = { date: today };
    updatedLogs.push(dailyLog);
  }

  dailyLog.mood = mood;

  const updatedPeriod = {
    ...currentActivePeriod,
    dailyLogs: updatedLogs
  };

  const updatedPeriods = periods.map(p => 
    p.id === currentActivePeriod.id ? updatedPeriod : p
  );

  setPeriods(updatedPeriods);
  setCurrentActivePeriod(updatedPeriod);
  await savePeriods(updatedPeriods);
};

const getCycleInsights = () => {
  if (periods.length < 3) return null;

  const completedPeriods = periods.filter(p => p.endDate);
  
  // 1. Analisi sintomi ricorrenti
  const symptomMap: Record<string, {count: number, days: number}> = {};
  
  completedPeriods.forEach(period => {
    period.dailyLogs?.forEach(log => {
      log.symptoms?.forEach(symptom => {
        if (!symptomMap[symptom.name]) {
          symptomMap[symptom.name] = {count: 0, days: 0};
        }
        symptomMap[symptom.name].count++;
        if (symptom.intensity === 'severe') {
          symptomMap[symptom.name].days++;
        }
      });
    });
  });

  let positiveDays = 0;
  let negativeDays = 0;
  
  completedPeriods.forEach(period => {
    period.dailyLogs?.forEach(log => {
      if (log.mood) {
        if (log.mood === 'very_happy' || log.mood === 'happy') positiveDays++;
        if (log.mood === 'sad' || log.mood === 'very_sad') negativeDays++;
      }
    });
  });

  return {
    frequentSymptoms: Object.entries(symptomMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3),
    moodBalance: {
      positive: positiveDays,
      negative: negativeDays
    },
    averageCycleLength: settings.averageCycleLength,
    averagePeriodLength: settings.averagePeriodLength
  };
};

const getFlowStatistics = () => {
  const flowStats = {
    spotting: 0,
    light: 0,
    medium: 0,
    heavy: 0
  };

  periods.forEach(period => {
    period.dailyLogs?.forEach(log => {
      if (log.flow) {
        flowStats[log.flow]++;
      }
    });
  });

  

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
              <Text style={styles.activePeriodDate}>Started: {new Date(currentActivePeriod.startDate).toLocaleDateString()}</Text>
              
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
                    style={[
                        styles.symptomButton,
                        currentSymptom && styles.symptomButtonSelected 
                    ]}
                    onPress={() => {
                        const newIntensity = currentSymptom?.intensity === 'moderate' ? 'mild' : 'moderate'; 
                        trackSymptom({
                            name: symptomName,
                            intensity: newIntensity 
                        })
                    }}
                  >
                    <Text style={styles.symptomButtonText}>{symptomName} {currentSymptom ? `(${currentSymptom.intensity})` : ''}</Text>
                  </TouchableOpacity>
                );
                })}
              </View>
            </View>
          )}

          {currentActivePeriod && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mood Today</Text>
              <View style={styles.moodButtons}>
                {(['very_happy', 'happy', 'neutral', 'sad', 'very_sad'] as DailyLog['mood'][]).map(moodValue => {
                  if (!moodValue) return null; 
                  const currentMood = currentActivePeriod.dailyLogs
                                        ?.find(log => log.date === formatDateToYYYYMMDD(new Date()))?.mood;
                  return (
                  <TouchableOpacity
                    key={moodValue}
                    style={[
                        styles.moodButton,
                        currentMood === moodValue && styles.moodButtonSelected 
                    ]}
                    onPress={() => trackMood(moodValue)}
                  >
                    <Text style={styles.moodButtonText}>{moodValue.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                );
                })}
              </View>
            </View>
          )}

          {cycleInsights && (
            <View style={styles.insightsContainer}>
              <Text style={styles.insightsTitle}>Cycle Insights</Text>
              <Text style={styles.insightItem}>Avg. Cycle Length: {cycleInsights.averageCycleLength} days</Text>
              <Text style={styles.insightItem}>Avg. Period Length: {cycleInsights.averagePeriodLength} days</Text>
              
              <Text style={styles.insightsSubtitle}>Frequent Symptoms (Top 3):</Text>
              {cycleInsights.frequentSymptoms.length > 0 ? cycleInsights.frequentSymptoms.map(symptom => (
                <Text key={symptom.name} style={styles.insightItem}>
                  {symptom.name}: {symptom.count} days ({symptom.days} severe)
                </Text>
              )) : <Text  style={styles.insightItem}>No symptom data yet.</Text>}

              <Text style={styles.insightsSubtitle}>Mood Balance (Completed Periods):</Text>
              {cycleInsights.moodBalance.total > 0 ? (
                <>
                  <Text style={styles.insightItem}>Positive Days: {cycleInsights.moodBalance.positive}</Text>
                  <Text style={styles.insightItem}>Negative Days: {cycleInsights.moodBalance.negative}</Text>
                </>
              ) : <Text style={styles.insightItem}>No mood data yet.</Text>}
            </View>
          )}


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
    flexGrow: 1,
    paddingBottom: 30 
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20
  },
  headerText: {
    fontSize: 30, 
    fontWeight: 'bold',
    color: '#D81B60', 
    marginBottom: 20, 
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statusTitle: {
    fontSize: 22, 
    fontWeight: '600',
    color: '#C2185B', 
    marginBottom: 8
  },
  statusSubtitle: {
    fontSize: 17, 
    color: '#AD1457', 
    textAlign: 'center'
  },
  activePeriodContainer: {
    width: '100%',
    backgroundColor: '#FFFDE7', 
    borderRadius: 15,
    padding: 20, 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  activePeriodTitle: {
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#C2185B',
    marginBottom: 10, 
    textAlign: 'center'
  },
  activePeriodDate: {
    fontSize: 16,
    color: '#7B1FA2', 
    textAlign: 'center',
    marginBottom: 15,
  },
  sectionTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: '#880E4F', 
    marginTop: 10,
    marginBottom: 8,
  },
  flowButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', 
    marginBottom: 20 
  },
  flowButton: {
    paddingVertical: 10, 
    paddingHorizontal: 10, 
    borderRadius: 25, 
    backgroundColor: '#F8BBD0', 
    minWidth: 75, 
    alignItems: 'center',
    marginHorizontal: 4, 
    borderWidth: 1,
    borderColor: '#F48FB1' 
  },
  flowButtonSelected: {
    backgroundColor: '#F06292', 
    borderColor: '#D81B60', 
    transform: [{ scale: 1.05 }], 
  },
  flowButtonText: {
    color: '#880E4F', 
    fontWeight: '500',
    fontSize: 13, 
  },
  button: {
    paddingVertical: 14, 
    borderRadius: 30, 
    width: '90%', 
    alignItems: 'center',
    alignSelf: 'center', 
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4 
  },
  startButton: {
    backgroundColor: '#4CAF50', 
  },
  endButton: {
    backgroundColor: '#F44336', 
    marginTop: 10, 
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  section: {
    marginTop: 20,
    width: '100%',
    padding: 15,
    backgroundColor: '#FFFFFF', 
    borderRadius: 10,
    marginBottom: 15, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18, 
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#D81B60' 
  },
  symptomButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', 
  },
  symptomButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 5,
    backgroundColor: '#E1BEE7', 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CE93D8'
  },
  symptomButtonSelected: {
    backgroundColor: '#BA68C8', 
    borderColor: '#9C27B0',
  },
  symptomButtonText: {
    color: '#6A1B9A', 
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
    margin: 5, 
    backgroundColor: '#BBDEFB', 
    borderRadius: 20,
    minWidth: '30%', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#90CAF9'
  },
  moodButtonSelected: {
    backgroundColor: '#64B5F6', 
    borderColor: '#2196F3',
  },
  moodButtonText: {
      color: '#0D47A1', 
      fontSize: 13,
      textAlign: 'center'
  },
  insightsContainer: {
    marginTop: 25, 
    padding: 20, 
    backgroundColor: '#E8F5E9', 
    borderRadius: 10,
    width: '100%',
  },
  insightsTitle: {
    fontSize: 20, 
    fontWeight: 'bold',
    marginBottom: 15, 
    color: '#2E7D32', 
    textAlign: 'center',
  },
  insightsSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#388E3C', 
    marginTop: 10,
    marginBottom: 5,
  },
  insightItem: {
    fontSize: 15,
    color: '#1B5E20', 
    marginBottom: 5,
    paddingLeft: 10, 
  }
});

export default PeriodTrackerScreen;
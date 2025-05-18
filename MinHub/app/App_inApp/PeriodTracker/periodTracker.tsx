import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDateToYYYYMMDD, getAverageCycleLength, getAveragePeriodLength } from '../../../utils/cycleLogic';
import { loadPeriods, loadSettings, savePeriods, saveSettings } from '../../../utils/cycleStore';
import { CycleSettings, DailyLog, FlowIntensity, PeriodData } from '../../../utils/cycleTypes';

const FLOW_OPTIONS: FlowIntensity[] = ['spotting', 'light', 'medium', 'heavy'];
const defaultInitialState = initializePlantStateHelper(); // Chiamata per i default in fetchData

function initializePlantStateHelper(): { settings: CycleSettings } { // Semplificata per i default necessari qui
    return {
      settings: { averageCycleLength: 28, averagePeriodLength: 5 }
    };
};

export default function PeriodTrackerScreen() {
  const router = useRouter();
  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [settings, setSettings] = useState<CycleSettings>({ averageCycleLength: 28, averagePeriodLength: 5 });
  const [currentActivePeriod, setCurrentActivePeriod] = useState<PeriodData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerTarget, setDatePickerTarget] = useState<'startPeriod' | 'endPeriod' | 'editStartDate' | 'editEndDate' | null>(null);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const loadedPeriodsData = await loadPeriods();
        const loadedSettingsData = await loadSettings();

        const newAvgCycle = getAverageCycleLength(loadedPeriodsData);
        const newAvgPeriod = getAveragePeriodLength(loadedPeriodsData);

        let finalSettings = loadedSettingsData;
        if ((newAvgCycle !== loadedSettingsData.averageCycleLength && newAvgCycle > 0) || (newAvgPeriod !== loadedSettingsData.averagePeriodLength && newAvgPeriod > 0) ) {
            finalSettings = { 
                averageCycleLength: newAvgCycle || defaultInitialState.settings.averageCycleLength, 
                averagePeriodLength: newAvgPeriod || defaultInitialState.settings.averagePeriodLength
            };
            await saveSettings(finalSettings);
        }

        setSettings(finalSettings);
        const sortedPeriods = [...loadedPeriodsData].sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        setPeriods(sortedPeriods);
        const active = sortedPeriods.find(p => p.endDate === null);
        setCurrentActivePeriod(active || null);
    } catch (error) {
        Alert.alert("Errore", "Impossibile caricare i dati del ciclo");
    } finally {
        setIsLoading(false);
    }
  }, []);

  useFocusEffect(fetchData);

  const showDatePickerForMode = (mode: 'startPeriod' | 'endPeriod' | 'editStartDate' | 'editEndDate', periodIdToEdit?: string) => {
    setDatePickerTarget(mode);
    let dateToSet = new Date();
    if ((mode === 'editStartDate' || mode === 'editEndDate') && periodIdToEdit) {
        const period = periods.find(p => p.id === periodIdToEdit);
        if (period) {
            if (mode === 'editStartDate') {
                dateToSet = new Date(period.startDate + "T00:00:00");
            } else if (mode === 'editEndDate' && period.endDate) {
                dateToSet = new Date(period.endDate + "T00:00:00");
            }
        }
        setEditingPeriodId(periodIdToEdit);
    } else {
        setEditingPeriodId(null);
    }
    setSelectedDate(dateToSet);
    setDatePickerVisible(true);
  };
  
  const handleDateSelectionLogic = async (date: Date, mode: 'startPeriod' | 'endPeriod' | 'editStartDate' | 'editEndDate', periodIdBeingEdited: string | null) => {
    const newDateString = formatDateToYYYYMMDD(date);
    let updatedPeriods = [...periods];
    let activePeriodNeedsUpdate = false;

    if (mode === 'startPeriod') {
      if (currentActivePeriod) {
        Alert.alert("Ciclo Attivo", "C'è già un ciclo attivo.");
      } else {
        const newPeriod: PeriodData = { 
          id: Date.now().toString(), 
          startDate: newDateString, 
          endDate: null,
          dailyLogs: [{date: newDateString}] 
        };
        updatedPeriods = [newPeriod, ...periods];
        setCurrentActivePeriod(newPeriod);
        activePeriodNeedsUpdate = true;
      }
    } else if (mode === 'endPeriod' && currentActivePeriod) {
      if (new Date(newDateString) < new Date(currentActivePeriod.startDate)) {
          Alert.alert("Data non valida", "La data di fine non può essere precedente alla data di inizio.");
      } else {
          updatedPeriods = periods.map(p => p.id === currentActivePeriod.id ? { ...p, endDate: newDateString } : p);
          setCurrentActivePeriod(null);
          activePeriodNeedsUpdate = true;
      }
    } else if (mode === 'editStartDate' && periodIdBeingEdited) {
        const periodIndex = updatedPeriods.findIndex(p=> p.id === periodIdBeingEdited);
        if (periodIndex > -1) {
            if (updatedPeriods[periodIndex].endDate && new Date(newDateString) > new Date(updatedPeriods[periodIndex].endDate!)) {
                 Alert.alert("Data non valida", "La data di inizio non può essere successiva alla data di fine.");
            } else {
                updatedPeriods[periodIndex] = {...updatedPeriods[periodIndex], startDate: newDateString};
                activePeriodNeedsUpdate = true;
                 if(currentActivePeriod?.id === periodIdBeingEdited && updatedPeriods[periodIndex].endDate === null) {
                    setCurrentActivePeriod(updatedPeriods[periodIndex]);
                }
            }
        }
    } else if (mode === 'editEndDate' && periodIdBeingEdited) {
        const periodIndex = updatedPeriods.findIndex(p=> p.id === periodIdBeingEdited);
        if (periodIndex > -1) {
            if (new Date(newDateString) < new Date(updatedPeriods[periodIndex].startDate)) {
                 Alert.alert("Data non valida", "La data di fine non può essere precedente alla data di inizio.");
            } else {
                updatedPeriods[periodIndex] = {...updatedPeriods[periodIndex], endDate: newDateString, dailyLogs: updatedPeriods[periodIndex].dailyLogs?.filter((log: DailyLog) => new Date(log.date) <= new Date(newDateString))};
                if (currentActivePeriod?.id === periodIdBeingEdited) setCurrentActivePeriod(null);
                activePeriodNeedsUpdate = true;
            }
        }
    }

    if (activePeriodNeedsUpdate) {
      updatedPeriods.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setPeriods(updatedPeriods);
      await savePeriods(updatedPeriods);
      
      const newAvgCycle = getAverageCycleLength(updatedPeriods);
      const newAvgPeriod = getAveragePeriodLength(updatedPeriods);
      const newSettings = { 
        averageCycleLength: newAvgCycle || defaultInitialState.settings.averageCycleLength, 
        averagePeriodLength: newAvgPeriod || defaultInitialState.settings.averagePeriodLength
      };
      await saveSettings(newSettings);
      setSettings(newSettings);
    }
  };

  const onDatePickerChange = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
    const currentDate = selectedDateValue || selectedDate;
    if (Platform.OS === 'android') {
      setDatePickerVisible(false); 
    }
    if (event.type === 'set' && currentDate && datePickerTarget) {
      setSelectedDate(currentDate);
      handleDateSelectionLogic(currentDate, datePickerTarget, editingPeriodId);
      if (Platform.OS === 'ios') setDatePickerVisible(false); 
      setDatePickerTarget(null);
      setEditingPeriodId(null);
    } else if (event.type === 'dismissed'){
        setDatePickerVisible(false);
        setDatePickerTarget(null);
        setEditingPeriodId(null);
    }
  };

  const handleLogFlow = async (flow: FlowIntensity) => {
    if (!currentActivePeriod) return;
    const todayStr = formatDateToYYYYMMDD(new Date());
    let updatedLogs = currentActivePeriod.dailyLogs ? [...currentActivePeriod.dailyLogs] : [];
    const existingLogIndex = updatedLogs.findIndex(log => log.date === todayStr);

    if (existingLogIndex > -1) {
        updatedLogs[existingLogIndex] = { ...updatedLogs[existingLogIndex], flow: flow };
    } else {
        updatedLogs.push({ date: todayStr, flow: flow });
    }
    updatedLogs.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const updatedPeriod: PeriodData = { ...currentActivePeriod, dailyLogs: updatedLogs };
    const newPeriods = periods.map(p => p.id === currentActivePeriod.id ? updatedPeriod : p);
    
    setPeriods(newPeriods);
    setCurrentActivePeriod(updatedPeriod);
    await savePeriods(newPeriods);
    Alert.alert("Flusso Registrato", `Hai registrato un flusso ${flow} per oggi.`);
  };

  const getNextPeriodPrediction = (): string => {
    if (periods.length === 0 || !periods[0]?.startDate) return "Registra il tuo primo ciclo.";
    const lastActualPeriod = periods.find(p => p.startDate);
    if (!lastActualPeriod) return "Dati insuff.";

    const lastStartDate = new Date(lastActualPeriod.startDate);
    const nextStartDate = new Date(lastStartDate);
    nextStartDate.setDate(lastStartDate.getDate() + settings.averageCycleLength);

    const today = new Date(); today.setHours(0,0,0,0);
    nextStartDate.setHours(0,0,0,0);

    const diffTime = nextStartDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (currentActivePeriod) return "Ciclo attivo.";
    if (diffDays < -5) return `Prossimo previsto: ${nextStartDate.toLocaleDateString()} (in ritardo?)`;
    if (diffDays < 0) return `Prossimo previsto: ${nextStartDate.toLocaleDateString()} (in ritardo?)`;
    if (diffDays === 0) return `Prossimo ciclo previsto oggi!`;
    if (diffDays === 1) return `Prossimo ciclo previsto domani.`;
    return `Prossimo ciclo tra ${diffDays} giorni (${nextStartDate.toLocaleDateString()}).`;
  };

  const getCurrentCycleDayInfo = (): string => {
    if (!currentActivePeriod) return "Nessun ciclo attivo";
    const startDate = new Date(currentActivePeriod.startDate);
    const today = new Date();
    startDate.setHours(0,0,0,0); today.setHours(0,0,0,0);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `Giorno ${diffDays} del ciclo`;
  };

  const getLastPeriod = (): PeriodData | null => {
    if (periods.length > 0) return periods[0];
    return null;
  }

  if (isLoading) {
    return <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color="#FF69B4" /></SafeAreaView>;
  }

  const lastPeriod = getLastPeriod();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.headerText}>Traccia Ciclo</Text>

          <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>{getCurrentCycleDayInfo()}</Text>
              <Text style={styles.statusSubtitle}>{getNextPeriodPrediction()}</Text>
              {currentActivePeriod && <Text style={styles.infoTextLight}>Inizio: {new Date(currentActivePeriod.startDate).toLocaleDateString()}</Text>}
          </View>

          {!currentActivePeriod ? (
            <TouchableOpacity style={[styles.button, styles.startButton]} onPress={() => showDatePickerForMode('startPeriod')}>
              <Text style={styles.buttonText}>Registra Inizio Ciclo</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activePeriodContainer}>
              <Text style={styles.activePeriodTitle}>Ciclo Attuale:</Text>
              <View style={styles.flowButtonsContainer}>
                {FLOW_OPTIONS.map(flow => (
                  <TouchableOpacity 
                    key={flow} 
                    style={[
                        styles.flowButton, 
                        currentActivePeriod?.dailyLogs?.find((log: DailyLog) => log.date === formatDateToYYYYMMDD(new Date()) && log.flow === flow) && styles.flowButtonSelected
                    ]} 
                    onPress={() => handleLogFlow(flow)}
                  >
                    <Text style={styles.flowButtonText}>{flow.charAt(0).toUpperCase() + flow.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.button, styles.endButton]} onPress={() => showDatePickerForMode('endPeriod')}>
                <Text style={styles.buttonText}>Registra Fine Ciclo</Text>
              </TouchableOpacity>
            </View>
          )}

          {lastPeriod && !currentActivePeriod && (
             <View style={styles.editSection}>
                <Text style={styles.editTextHeader}>Modifica Ultimo Periodo Registrato:</Text>
                <View style={styles.editButtonsContainer}>
                    <TouchableOpacity style={styles.editButton} onPress={() => showDatePickerForMode('editStartDate', lastPeriod.id)}>
                        <Text style={styles.editButtonText}>Modifica Inizio</Text>
                        <Text style={styles.editDateText}>({new Date(lastPeriod.startDate).toLocaleDateString()})</Text>
                    </TouchableOpacity>
                    {lastPeriod.endDate && (
                        <TouchableOpacity style={styles.editButton} onPress={() => showDatePickerForMode('editEndDate', lastPeriod.id)}>
                            <Text style={styles.editButtonText}>Modifica Fine</Text>
                            <Text style={styles.editDateText}>({new Date(lastPeriod.endDate).toLocaleDateString()})</Text>
                        </TouchableOpacity>
                    )}
                </View>
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
              onChange={onDatePickerChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF0F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0F5'},
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, alignItems: 'center', paddingTop: 30, paddingHorizontal: 20, paddingBottom: 30 },
  headerText: { fontSize: 32, fontWeight: 'bold', color: '#D81B60', marginBottom: 25, fontFamily: Platform.OS === 'ios' ? 'Papyrus' : 'serif' },
  statusCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius:20, marginBottom:25, width: '100%', alignItems:'center', shadowColor: "#FF69B4", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8, borderWidth: 1, borderColor: '#FFE4E1'},
  statusTitle: { fontSize: 22, fontWeight: '600', color: '#C2185B', marginBottom: 8, textAlign: 'center' },
  statusSubtitle: { fontSize: 16, color: '#AD1457', marginBottom: 10, textAlign: 'center', fontStyle: 'italic' },
  activePeriodContainer: { width: '100%', alignItems: 'center', marginBottom: 20, padding:15, backgroundColor: 'rgba(255,235,238, 0.5)', borderRadius:15},
  activePeriodTitle: { fontSize:18, fontWeight:'500', color: '#C2185B', marginBottom:15},
  flowButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20, flexWrap:'wrap' },
  flowButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#FF80AB', backgroundColor: '#FFF0F5', margin:5 },
  flowButtonSelected: { backgroundColor: '#FF69B4', borderColor: '#D81B60'},
  flowButtonText: { color: '#C2185B', fontSize: 12 },
  button: { paddingVertical: 16, paddingHorizontal: 30, borderRadius: 30, marginBottom: 20, width: '95%', alignItems: 'center', elevation: 4, shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 3},
  startButton: { backgroundColor: '#4CAF50' },
  endButton: { backgroundColor: '#F44336' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  editSection: { marginTop: 10, marginBottom:20, width: '100%', padding:15, backgroundColor: 'rgba(255, 249, 196, 0.7)', borderRadius:10},
  editTextHeader: {fontSize: 16, fontWeight:'bold', color: '#FBC02D', textAlign:'center', marginBottom:10},
  editButtonsContainer: {flexDirection:'row', justifyContent:'space-around'},
  editButton: {alignItems:'center', padding:10, backgroundColor: 'rgba(255, 253, 231, 0.9)', borderRadius:8, marginHorizontal: 5},
  editButtonText: {color: '#F9A825', fontSize:14},
  editDateText: {color: '#FBC02D', fontSize:12, marginTop:2},
  infoBox: { marginTop: 10, padding: 20, backgroundColor: 'rgba(255, 235, 238, 0.7)', borderRadius: 15, width: '100%', alignItems:'flex-start' },
  infoText: { fontSize: 15, color: '#C2185B', marginBottom: 6,},
  infoTextLight: {fontSize: 14, color: '#E91E63', textAlign: 'center'},
  infoTextBold: {fontSize: 16, color: '#AD1457', marginBottom: 8, fontWeight:'bold'}
});
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';
import { formatDateToYYYYMMDD, getAverageCycleLength, getAveragePeriodLength } from '../../../utils/cycleLogic';
import { loadPeriods, loadSettings, savePeriods, saveSettings } from '../../../utils/cycleStore';
import { CycleSettings, PeriodData } from '../../../utils/cycleTypes';
export default function PeriodTrackerScreen() {
  const router = useRouter();
  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [settings, setSettings] = useState<CycleSettings>({ averageCycleLength: 28, averagePeriodLength: 5 });
  const [currentActivePeriod, setCurrentActivePeriod] = useState<PeriodData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end' | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedPeriods = await loadPeriods();
      const loadedSettings = await loadSettings();

      const newAvgCycle = getAverageCycleLength(loadedPeriods);
      const newAvgPeriod = getAveragePeriodLength(loadedPeriods);

      let finalSettings = loadedSettings;
      if (newAvgCycle !== loadedSettings.averageCycleLength || newAvgPeriod !== loadedSettings.averagePeriodLength) {
        finalSettings = { 
          averageCycleLength: newAvgCycle || 28, 
          averagePeriodLength: newAvgPeriod || 5 
        };
        await saveSettings(finalSettings);
      }

      setSettings(finalSettings);
      const sortedPeriods = [...loadedPeriods].sort((a, b) => 
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

  useFocusEffect(useCallback(() => {
    fetchData();
  }, [fetchData]));

  const showDatePickerForMode = (mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    setSelectedDate(new Date());
    setDatePickerVisible(true);
  };

  const onDateSelected = (event: DateTimePickerEvent, date?: Date) => {
    setDatePickerVisible(false);
    
    if (event.type === 'set' && date && datePickerMode) {
      handleDateSelection(date);
    }
    setDatePickerMode(null);
  };

  const handleDateSelection = async (date: Date) => {
    const newDateString = formatDateToYYYYMMDD(date);
    let updatedPeriods = [...periods];
    let activePeriodUpdated = false;
    let userActionValid = true;

    if (datePickerMode === 'start') {
      if (currentActivePeriod) {
        Alert.alert("Ciclo Attivo", "C'è già un ciclo attivo. Termina prima quello attuale o modificalo.");
        userActionValid = false;
      } else {
        const newPeriod: PeriodData = { 
          id: Date.now().toString(), 
          startDate: newDateString, 
          endDate: null 
        };
        updatedPeriods = [newPeriod, ...periods];
        setCurrentActivePeriod(newPeriod);
        activePeriodUpdated = true;
      }
    } else if (datePickerMode === 'end' && currentActivePeriod) {
      if (new Date(newDateString) < new Date(currentActivePeriod.startDate)) {
        Alert.alert("Data non valida", "La data di fine non può essere precedente alla data di inizio.");
        userActionValid = false;
      } else {
        updatedPeriods = periods.map(p => 
          p.id === currentActivePeriod.id ? { ...p, endDate: newDateString } : p
        );
        setCurrentActivePeriod(null);
        activePeriodUpdated = true;
      }
    }

    if (userActionValid && activePeriodUpdated) {
      try {
        updatedPeriods.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        setPeriods(updatedPeriods);
        await savePeriods(updatedPeriods);

        const newAvgCycle = getAverageCycleLength(updatedPeriods);
        const newAvgPeriod = getAveragePeriodLength(updatedPeriods);
        const newSettings = { 
          averageCycleLength: newAvgCycle || 28, 
          averagePeriodLength: newAvgPeriod || 5 
        };
        await saveSettings(newSettings);
        setSettings(newSettings);
      } catch (error) {
        Alert.alert("Errore", "Impossibile salvare i dati");
      }
    }
  };

  const getNextPeriodPrediction = (): string => {
    if (periods.length === 0 || !periods[0]?.startDate) {
      return "Registra il tuo primo ciclo per le previsioni.";
    }

    const lastPeriod = periods.find(p => p.startDate);
    if (!lastPeriod) return "Dati insufficienti per una previsione.";

    const lastStartDate = new Date(lastPeriod.startDate);
    const nextStartDate = new Date(lastStartDate);
    nextStartDate.setDate(lastStartDate.getDate() + settings.averageCycleLength);

    const today = new Date();
    today.setHours(0,0,0,0);
    nextStartDate.setHours(0,0,0,0);

    const diffTime = nextStartDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (currentActivePeriod) return "Ciclo attualmente in corso.";
    if (diffDays < -5) return `Prossimo ciclo previsto per ${nextStartDate.toLocaleDateString()} (potrebbe essere in ritardo).`;
    if (diffDays < 0) return `Il tuo prossimo ciclo potrebbe essere in ritardo (${nextStartDate.toLocaleDateString()}).`;
    if (diffDays === 0) return `Il tuo prossimo ciclo potrebbe iniziare oggi! (${nextStartDate.toLocaleDateString()})`;
    if (diffDays === 1) return `Il tuo prossimo ciclo potrebbe iniziare domani (${nextStartDate.toLocaleDateString()}).`;
    return `Prossimo ciclo previsto tra ${diffDays} giorni (${nextStartDate.toLocaleDateString()}).`;
  };

  const getCurrentCycleDayInfo = (): string => {
    if (!currentActivePeriod) return "Nessun ciclo attivo";
    
    const startDate = new Date(currentActivePeriod.startDate);
    const today = new Date();
    startDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return `Giorno ${diffDays} del ciclo`;
  };

}

  
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
  container: { 
    flex: 1, 
    alignItems: 'center', 
    paddingTop: 30, 
    paddingHorizontal: 20 
  },
  headerText: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#D81B60', 
    marginBottom: 25, 
    fontFamily: Platform.OS === 'ios' ? 'Papyrus' : 'serif' 
  },
  statusCard: { 
    backgroundColor: '#FFFFFF', 
    padding: 25, 
    borderRadius: 20, 
    marginBottom: 30, 
    width: '100%', 
    alignItems: 'center', 
    shadowColor: "#FF69B4", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 5, 
    elevation: 8, 
    borderWidth: 1, 
    borderColor: '#FFE4E1'
  },
  statusTitle: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: '#C2185B', 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  statusSubtitle: { 
    fontSize: 17, 
    color: '#AD1457', 
    marginBottom: 15, 
    textAlign: 'center', 
    fontStyle: 'italic' 
  },
  button: { 
    paddingVertical: 18, 
    paddingHorizontal: 30, 
    borderRadius: 30, 
    marginBottom: 25, 
    width: '95%', 
    alignItems: 'center', 
    elevation: 4, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 3
  },
  startButton: { 
    backgroundColor: '#4CAF50' 
  },
  endButton: { 
    backgroundColor: '#F44336' 
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  infoBox: { 
    marginTop: 20, 
    padding: 20, 
    backgroundColor: 'rgba(255, 235, 238, 0.7)', 
    borderRadius: 15, 
    width: '100%', 
    alignItems: 'flex-start' 
  },
  infoText: { 
    fontSize: 15, 
    color: '#C2185B', 
    marginBottom: 6 
  },
  infoTextLight: {
    fontSize: 14, 
    color: '#E91E63', 
    textAlign: 'center'
  },
  infoTextBold: {
    fontSize: 16, 
    color: '#AD1457', 
    marginBottom: 8, 
    fontWeight: 'bold'
  }
});
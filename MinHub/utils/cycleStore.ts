import AsyncStorage from '@react-native-async-storage/async-storage';
import { CycleSettings, PeriodData } from './cycleTypes';

const PERIODS_STORAGE_KEY = '@periodTracker_periods_v1';
const SETTINGS_STORAGE_KEY = '@periodTracker_settings_v1';

export const savePeriods = async (periods: PeriodData[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(periods));
  } catch (error) {
    console.error("Failed to save periods to storage", error);
  }
};

export const loadPeriods = async (): Promise<PeriodData[]> => {
  try {
    const data = await AsyncStorage.getItem(PERIODS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load periods from storage", error);
    return [];
  }
};

export const saveSettings = async (settings: CycleSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to storage", error);
  }
};

export const loadSettings = async (): Promise<CycleSettings> => {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    return data ? JSON.parse(data) : { averageCycleLength: 28, averagePeriodLength: 5 };
  } catch (error) {
    console.error("Failed to load settings from storage", error);
    return { averageCycleLength: 28, averagePeriodLength: 5 };
  }
};
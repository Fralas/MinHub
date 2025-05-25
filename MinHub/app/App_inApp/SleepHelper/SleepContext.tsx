import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'SLEEP_LOGS';

type SleepLog = {
  day: string;
  hours: string;
};

type WeekData = Record<string, SleepLog[]>;

interface SleepContextType {
  allSleepData: WeekData;
  loadAllSleepData: () => Promise<void>;
  saveSleepLogs: (weekId: string, logs: SleepLog[]) => Promise<void>;
}

const SleepContext = createContext<SleepContextType | undefined>(undefined);

export const SleepProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allSleepData, setAllSleepData] = useState<WeekData>({});

  const loadAllSleepData = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAllSleepData(JSON.parse(stored));
      } else {
        setAllSleepData({});
      }
    } catch (error) {
      console.error("Failed to load sleep data from AsyncStorage", error);
    }
  }, []);

  const saveSleepLogs = useCallback(async (weekId: string, logs: SleepLog[]) => {
    try {
      const updatedAllData = {
        ...allSleepData,
        [weekId]: logs,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAllData));
      setAllSleepData(updatedAllData);
    } catch (error) {
      console.error("Failed to save sleep data to AsyncStorage", error);
    }
  }, [allSleepData]);

  useEffect(() => {
    loadAllSleepData();
  }, [loadAllSleepData]);

  return (
    <SleepContext.Provider value={{ allSleepData, loadAllSleepData, saveSleepLogs }}>
      {children}
    </SleepContext.Provider>
  );
};

export const useSleep = () => {
  const context = useContext(SleepContext);
  if (context === undefined) {
    throw new Error('useSleep must be used within a SleepProvider');
  }
  return context;
};
import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { ClockScreen } from './ClockScreen';
import { SleepDataScreen } from './SleepDataScreen'; 

export default function App() {  
  const [currentScreen, setCurrentScreen] = useState<'clock' | 'sleepData'>('clock');
  const navigateTo = useCallback((screen: 'clock' | 'sleepData') => {
    setCurrentScreen(screen);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Conditionally render ClockScreen or SleepDataScreen based on currentScreen state */}
      {currentScreen === 'clock' ? (
        <ClockScreen navigateTo={navigateTo} />
      ) : (
        <SleepDataScreen navigateTo={navigateTo} />
      )}
    </View>
  );
}

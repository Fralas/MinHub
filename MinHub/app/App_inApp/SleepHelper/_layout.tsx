import { Stack } from 'expo-router';
import React from 'react';
import { SleepProvider } from './SleepContext';

export default function SleepHelperLayout() {
  return (
    <SleepProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4CAF50', 
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Sleep Helper Screens */}
        <Stack.Screen
          name="sleep-helper" 
          options={{ title: 'Sleep Helper' }}
        />
        <Stack.Screen
          name="sleep-statistics"
          options={{ title: 'Statistiche Sonno' }}
        />
      </Stack>
    </SleepProvider>
  );
}
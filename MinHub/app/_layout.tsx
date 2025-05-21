import { Stack } from "expo-router";
import React from 'react';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#00796B', // Main app header color
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Main App Screens */}
      <Stack.Screen
        name="index"
        options={{ title: 'App Meditazione (Main)' }} // Renamed for clarity
      />
      <Stack.Screen
        name="App_inApp/Meditation/guided-meditations"
        options={{ title: 'Meditazioni Guidate' }}
      />
      <Stack.Screen
        name="App_inApp/Meditation/meditation-player/[id]"
        options={{ title: 'Meditazione' }}
      />

      <Stack.Screen name="App_inApp/SleepHelper" options={{ headerShown: false }} />
      {/* Sleephelper app */}
      <Stack.Screen
        name="sleep-helper"
        options={{ title: 'Sleep Helper' }}
      />
      <Stack.Screen
        name="sleep-statistics"
        options={{ title: 'Statistiche Sonno' }}
      />
    </Stack>
  );
}
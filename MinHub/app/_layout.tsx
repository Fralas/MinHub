import { Stack } from "expo-router";
import React from 'react';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#641E7A', 
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'App Meditazione (Main)' }} 
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
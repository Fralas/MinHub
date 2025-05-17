import { Stack } from "expo-router";
import React from 'react';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#00796B',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'MinHub', headerShown: false }}
      />
      <Stack.Screen
        name="home"
        options={{ title: 'MinHub Home' }}
      />
      <Stack.Screen
        name="App_inApp/Meditation/guided-meditations"
        options={{ title: 'Meditazioni Guidate' }}
      />
      <Stack.Screen
        name="App_inApp/Meditation/meditation-player/[id]"
        options={{ title: 'Meditazione' }}
      />
    </Stack>
  );
}
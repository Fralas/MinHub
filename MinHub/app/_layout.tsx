import { Stack } from 'expo-router';
import React from 'react';
import { ThemeProvider } from '../src/contexts/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="tutorial" options={{ headerShown: false }} />
          <Stack.Screen name="questionnaire" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen 
            name="settings"
            options={{ 
              title: 'Settings',
              presentation: 'modal',
            }} 
          />
          <Stack.Screen 
            name="App_inApp"
            options={{ headerShown: false }}
          />
        </Stack>
    </ThemeProvider>
  );
}
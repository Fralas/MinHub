import { Stack } from 'expo-router';
import React from 'react';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';

function ThemedStack() {
  const { theme } = useTheme();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="tutorial" options={{ headerShown: false }} />
      <Stack.Screen name="questionnaire" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: true }} />
      <Stack.Screen 
        name="settings"
        options={{ 
          headerShown: true,
          title: 'Settings',
          presentation: 'modal',
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
          headerTitleStyle: { color: theme.text },
        }} 
      />
      <Stack.Screen name="App_inApp" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}
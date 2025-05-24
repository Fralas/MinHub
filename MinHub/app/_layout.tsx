import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';

function ThemedStack() {
  const { theme, isDark } = useTheme();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="tutorial" options={{ headerShown: false }} />
      <Stack.Screen name="questionnaire" options={{ headerShown: false }} />
      <Stack.Screen
        name="home"
        options={({ navigation }) => ({
          headerShown: true,
          title: 'MinHub Home',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: isDark ? darkThemeForLayout.card : lightThemeForLayout.card,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: isDark ? darkThemeForLayout.card : lightThemeForLayout.card,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('settings')}
              style={{ marginRight: 15, padding: 5 }}
            >
              <Ionicons
                name="settings-outline"
                size={26}
                color={isDark ? darkThemeForLayout.card : lightThemeForLayout.card}
              />
            </TouchableOpacity>
          ),
        })}
      />
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
      <Stack.Screen
        name="notification-settings"
        options={{
          title: 'Notification Settings',
          headerShown: true,
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
          headerTitleStyle: { color: theme.text },
        }}
      />
      <Stack.Screen
        name="edit-profile" 
        options={{
          title: 'Edit Profile',
          headerShown: true,
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

const lightThemeForLayout = { card: '#ffffff' };
const darkThemeForLayout = { card: '#1c1c1e' };
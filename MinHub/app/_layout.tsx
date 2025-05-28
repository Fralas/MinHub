import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { I18nProvider, useI18n } from '../src/contexts/I18nContext';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';

function ThemedStack() {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();
  const headerTintColor = isDark ? '#FFFFFF' : '#FFFFFF'; 
  const modalHeaderStyle = { 
    backgroundColor: theme.card,
    shadowOpacity: 0, 
    elevation: 0, 
  };
  const modalHeaderTitleStyle = { color: theme.text };

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="tutorial" options={{ headerShown: false }} />
      <Stack.Screen name="questionnaire" options={{ headerShown: false }} />
      <Stack.Screen 
        name="enter-pin" 
        options={{ 
          headerShown: false, 
        }} 
      />
      <Stack.Screen
        name="home"
        options={({ navigation }) => ({
          headerShown: false,
          title: t('home.defaultTitle', { defaultValue: 'MinHub Home'}),
          headerStyle: { backgroundColor: theme.primary }, 
          headerTintColor: headerTintColor,
          headerTitleStyle: { fontWeight: 'bold', color: headerTintColor },
          headerLeft: () => null, 
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('settings')}
              style={{ marginRight: 15, padding: 5 }}
            >
              <Ionicons name="settings-outline" size={26} color={headerTintColor} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true, 
          title: t('settings.title', { defaultValue: 'Settings' }), 
          presentation: 'modal',
          headerStyle: modalHeaderStyle, 
          headerTintColor: theme.text,
          headerTitleStyle: modalHeaderTitleStyle,
        }}
      />
      <Stack.Screen
        name="notification-settings"
        options={{
          title: t('notificationSettings.title', { defaultValue: 'Notification Settings' }), 
          headerShown: true,
          headerStyle: modalHeaderStyle, 
          headerTintColor: theme.text,
          headerTitleStyle: modalHeaderTitleStyle,
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: t('editProfile.title', { defaultValue: 'Edit Profile' }), 
          headerShown: true,
          headerStyle: modalHeaderStyle, 
          headerTintColor: theme.text,
          headerTitleStyle: modalHeaderTitleStyle,
        }}
      />
       <Stack.Screen
        name="language-settings"
        options={{
          title: t('languages.select', { defaultValue: 'Select Language' }), 
          headerShown: true,
          headerStyle: modalHeaderStyle, 
          headerTintColor: theme.text,
          headerTitleStyle: modalHeaderTitleStyle,
        }}
      />
      <Stack.Screen
        name="set-pin"
        options={{
          title: t('setPin.title', { defaultValue: 'Set PIN' }), 
          headerShown: true,
          presentation: 'modal', 
          headerStyle: modalHeaderStyle,
          headerTintColor: theme.text,
          headerTitleStyle: modalHeaderTitleStyle,
        }}
      />
      <Stack.Screen
        name="recover-pin"
        options={{
          title: t('recoverPin.title', { defaultValue: 'Recover PIN' }), 
          headerShown: true,
          presentation: 'modal', 
          headerStyle: modalHeaderStyle,
          headerTintColor: theme.text, 
          headerTitleStyle: modalHeaderTitleStyle,
        }}
      />
      <Stack.Screen name="App_inApp" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ThemedStack />
      </ThemeProvider>
    </I18nProvider>
  );
}

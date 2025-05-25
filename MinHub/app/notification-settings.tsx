import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { cancelAllScheduledNotificationsAsync, requestPermissionsAsync } from '../src/services/notificationManager';

const GLOBAL_NOTIFICATIONS_ENABLED_KEY = 'minhub_global_notifications_enabled';
const TODO_REMINDERS_ENABLED_KEY = 'minhub_todo_reminders_enabled';
const CALENDAR_ALERTS_ENABLED_KEY = 'minhub_calendar_alerts_enabled';
const POMODORO_ALERTS_ENABLED_KEY = 'minhub_pomodoro_alerts_enabled';
const MEDITATION_REMINDERS_ENABLED_KEY = 'minhub_meditation_reminders_enabled';

export default function NotificationSettingsScreen() {
  const { theme } = useTheme();
  const styles = createThemedStyles(theme);

  const [isLoading, setIsLoading] = useState(true);
  const [globalNotificationsEnabled, setGlobalNotificationsEnabled] = useState(true);
  const [todoRemindersEnabled, setTodoRemindersEnabled] = useState(true);
  const [calendarAlertsEnabled, setCalendarAlertsEnabled] = useState(true);
  const [pomodoroAlertsEnabled, setPomodoroAlertsEnabled] = useState(true);
  const [meditationRemindersEnabled, setMeditationRemindersEnabled] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const globalSetting = await AsyncStorage.getItem(GLOBAL_NOTIFICATIONS_ENABLED_KEY);
        let currentGlobalEnabled = true;
        if (globalSetting !== null) {
          currentGlobalEnabled = JSON.parse(globalSetting);
        } else {
          currentGlobalEnabled = await requestPermissionsAsync();
          await AsyncStorage.setItem(GLOBAL_NOTIFICATIONS_ENABLED_KEY, JSON.stringify(currentGlobalEnabled));
        }
        setGlobalNotificationsEnabled(currentGlobalEnabled);

        const todoSetting = await AsyncStorage.getItem(TODO_REMINDERS_ENABLED_KEY);
        setTodoRemindersEnabled(todoSetting !== null ? JSON.parse(todoSetting) : true);

        const calendarSetting = await AsyncStorage.getItem(CALENDAR_ALERTS_ENABLED_KEY);
        setCalendarAlertsEnabled(calendarSetting !== null ? JSON.parse(calendarSetting) : true);

        const pomodoroSetting = await AsyncStorage.getItem(POMODORO_ALERTS_ENABLED_KEY);
        setPomodoroAlertsEnabled(pomodoroSetting !== null ? JSON.parse(pomodoroSetting) : true);

        const meditationSetting = await AsyncStorage.getItem(MEDITATION_REMINDERS_ENABLED_KEY);
        setMeditationRemindersEnabled(meditationSetting !== null ? JSON.parse(meditationSetting) : true);

      } catch (e) {
        console.error("Failed to load notification settings", e);
        setGlobalNotificationsEnabled(true); 
        setTodoRemindersEnabled(true);
        setCalendarAlertsEnabled(true);
        setPomodoroAlertsEnabled(true);
        setMeditationRemindersEnabled(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const toggleGlobalNotifications = async (value: boolean) => {
    setIsLoading(true);
    if (value) {
      const permissionsGranted = await requestPermissionsAsync();
      if (!permissionsGranted) {
        Alert.alert(
          "Permissions Required",
          "To enable notifications, please grant permission in your device settings.",
          [{ text: "OK" }]
        );
        setGlobalNotificationsEnabled(false);
        await AsyncStorage.setItem(GLOBAL_NOTIFICATIONS_ENABLED_KEY, JSON.stringify(false));
        setIsLoading(false);
        return;
      }
    }

    setGlobalNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem(GLOBAL_NOTIFICATIONS_ENABLED_KEY, JSON.stringify(value));
      if (!value) {
        await cancelAllScheduledNotificationsAsync();
      }
    } catch (e) {
      console.error("Failed to save global notification setting", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingToggle = async (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    key: string,
    newValue: boolean
  ) => {
    if (!globalNotificationsEnabled && newValue) {
        Alert.alert("Enable All Notifications", "Please enable all notifications first to change this setting.");
        return;
    }
    setter(newValue);
    try {
      await AsyncStorage.setItem(key, JSON.stringify(newValue));
    } catch (e) {
      console.error(`Failed to save setting for ${key}`, e);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Notification Preferences</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Enable All Notifications</Text>
            <Switch
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={globalNotificationsEnabled ? theme.primary : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleGlobalNotifications}
              value={globalNotificationsEnabled}
            />
          </View>
          <Text style={styles.rowDescription}>
            Toggle this to enable or disable all notifications from MinHub.
          </Text>
        </View>

        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specific Reminders</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>To-Do Task Reminders</Text>
              <Switch
                disabled={!globalNotificationsEnabled && Platform.OS !== "ios"}
                trackColor={{ false: '#767577', true: globalNotificationsEnabled ? theme.primary : theme.subtleText }}
                thumbColor={todoRemindersEnabled && globalNotificationsEnabled ? theme.primary : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(newValue) => handleSettingToggle(setTodoRemindersEnabled, TODO_REMINDERS_ENABLED_KEY, newValue)}
                value={todoRemindersEnabled && globalNotificationsEnabled}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Calendar Event Alerts</Text>
              <Switch
                disabled={!globalNotificationsEnabled && Platform.OS !== "ios"}
                trackColor={{ false: '#767577', true: globalNotificationsEnabled ? theme.primary : theme.subtleText }}
                thumbColor={calendarAlertsEnabled && globalNotificationsEnabled ? theme.primary : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(newValue) => handleSettingToggle(setCalendarAlertsEnabled, CALENDAR_ALERTS_ENABLED_KEY, newValue)}
                value={calendarAlertsEnabled && globalNotificationsEnabled}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Well-being Features</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Pomodoro Timer Sounds/Alerts</Text>
              <Switch
                disabled={!globalNotificationsEnabled && Platform.OS !== "ios"}
                trackColor={{ false: '#767577', true: globalNotificationsEnabled ? theme.primary : theme.subtleText }}
                thumbColor={pomodoroAlertsEnabled && globalNotificationsEnabled ? theme.primary : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(newValue) => handleSettingToggle(setPomodoroAlertsEnabled, POMODORO_ALERTS_ENABLED_KEY, newValue)}
                value={pomodoroAlertsEnabled && globalNotificationsEnabled}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Meditation Reminders</Text>
              <Switch
                disabled={!globalNotificationsEnabled && Platform.OS !== "ios"}
                trackColor={{ false: '#767577', true: globalNotificationsEnabled ? theme.primary : theme.subtleText }}
                thumbColor={meditationRemindersEnabled && globalNotificationsEnabled ? theme.primary : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(newValue) => handleSettingToggle(setMeditationRemindersEnabled, MEDITATION_REMINDERS_ENABLED_KEY, newValue)}
                value={meditationRemindersEnabled && globalNotificationsEnabled}
              />
            </View>
          </View>
        </>
      </SafeAreaView>
    </View>
  );
}

const createThemedStyles = (theme: import('../src/styles/themes').Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    safeArea: {
      flex: 1,
    },
    header: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text,
    },
    section: {
      marginTop: 10,
      marginBottom: 10,
      marginHorizontal: 16,
      backgroundColor: theme.card,
      borderRadius: 12,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.subtleText,
      paddingTop: 12,
      paddingBottom: 8,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      minHeight: 50,
    },
    rowLabel: {
      fontSize: 17,
      color: theme.text,
      flexShrink: 1,
      marginRight: 10,
    },
    rowDescription: {
      fontSize: 13,
      color: theme.subtleText,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
  });
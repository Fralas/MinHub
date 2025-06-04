import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { cancelAllScheduledNotificationsAsync, requestPermissionsAsync } from '../src/services/notificationManager';

const GLOBAL_NOTIFICATIONS_ENABLED_KEY = 'minhub_global_notifications_enabled';
const TODO_REMINDERS_ENABLED_KEY = 'minhub_todo_reminders_enabled';
const CALENDAR_ALERTS_ENABLED_KEY = 'minhub_calendar_alerts_enabled';
const POMODORO_ALERTS_ENABLED_KEY = 'minhub_pomodoro_alerts_enabled';
const MEDITATION_REMINDERS_ENABLED_KEY = 'minhub_meditation_reminders_enabled';

const lightPurplePalette = {
  primary: '#8A63D2',
  background: '#F5F3F9',
  card: '#FFFFFF',
  text: '#1A202C',
  labelText: '#553c9a',
  subtleText: '#A0AEC0',
  border: '#E2E8F0',
  danger: '#E53E3E',
  iconBackground: '#EDE9F6',
  switchThumbColor: '#FFFFFF',
  switchTrackColorFalse: '#DCDFE6',
};

export default function NotificationSettingsScreen() {
  const styles = createThemedStyles(lightPurplePalette);

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
    let permissionsFinalStatus = value;
    if (value) {
      const permissionsGranted = await requestPermissionsAsync();
      if (!permissionsGranted) {
        Alert.alert(
          "Permissions Required",
          "To enable notifications, please grant permission in your device settings.",
          [{ text: "OK" }]
        );
        permissionsFinalStatus = false;
      }
    }

    setGlobalNotificationsEnabled(permissionsFinalStatus);
    try {
      await AsyncStorage.setItem(GLOBAL_NOTIFICATIONS_ENABLED_KEY, JSON.stringify(permissionsFinalStatus));
      if (!permissionsFinalStatus) {
        await cancelAllScheduledNotificationsAsync();
        setTodoRemindersEnabled(false);
        await AsyncStorage.setItem(TODO_REMINDERS_ENABLED_KEY, JSON.stringify(false));
        setCalendarAlertsEnabled(false);
        await AsyncStorage.setItem(CALENDAR_ALERTS_ENABLED_KEY, JSON.stringify(false));
        setPomodoroAlertsEnabled(false);
        await AsyncStorage.setItem(POMODORO_ALERTS_ENABLED_KEY, JSON.stringify(false));
        setMeditationRemindersEnabled(false);
        await AsyncStorage.setItem(MEDITATION_REMINDERS_ENABLED_KEY, JSON.stringify(false));

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
        Alert.alert(
            "Enable All Notifications", 
            "Please enable 'All App Notifications' first to change this specific setting.",
            [{text: "OK"}]
        );
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
        <ActivityIndicator size="large" color={lightPurplePalette.primary} />
      </View>
    );
  }

  const renderNotificationRow = (
    label: string, 
    value: boolean, 
    onValueChange: (newValue: boolean) => void, 
    iconName: keyof typeof Ionicons.glyphMap,
    description?: string,
    disabled?: boolean
  ) => (
    <View>
        <View style={styles.row}>
            <View style={styles.rowLeft}>
                <View style={[styles.iconContainer, disabled && styles.iconContainerDisabled]}>
                    <Ionicons name={iconName} size={20} color={disabled ? lightPurplePalette.subtleText : lightPurplePalette.primary} />
                </View>
                <Text style={[styles.rowLabel, disabled && styles.rowLabelDisabled]}>{label}</Text>
            </View>
            <Switch
                trackColor={{ false: lightPurplePalette.switchTrackColorFalse, true: lightPurplePalette.primary }}
                thumbColor={lightPurplePalette.switchThumbColor}
                ios_backgroundColor={lightPurplePalette.switchTrackColorFalse}
                onValueChange={onValueChange}
                value={value}
                disabled={disabled}
            />
        </View>
        {description && <Text style={styles.rowDescription}>{description}</Text>}
    </View>
  );


  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>
            <Text style={styles.headerTitle}>Notification Settings</Text>

            {renderNotificationRow(
                "All App Notifications",
                globalNotificationsEnabled,
                toggleGlobalNotifications,
                "notifications-outline",
                "Toggle this to enable or disable all notifications from MinHub."
            )}
            
            <View style={styles.sectionSeparator} />

            <Text style={styles.subHeaderTitle}>Specific Reminders</Text>
            
            {renderNotificationRow(
                "To-Do Task Reminders",
                todoRemindersEnabled && globalNotificationsEnabled,
                (newValue) => handleSettingToggle(setTodoRemindersEnabled, TODO_REMINDERS_ENABLED_KEY, newValue),
                "list-circle-outline",
                undefined,
                !globalNotificationsEnabled
            )}

            {renderNotificationRow(
                "Calendar Event Alerts",
                calendarAlertsEnabled && globalNotificationsEnabled,
                (newValue) => handleSettingToggle(setCalendarAlertsEnabled, CALENDAR_ALERTS_ENABLED_KEY, newValue),
                "calendar-outline",
                undefined,
                !globalNotificationsEnabled
            )}

            <View style={styles.sectionSeparator} />
            <Text style={styles.subHeaderTitle}>Well-being Features</Text>

            {renderNotificationRow(
                "Pomodoro Timer Alerts",
                pomodoroAlertsEnabled && globalNotificationsEnabled,
                (newValue) => handleSettingToggle(setPomodoroAlertsEnabled, POMODORO_ALERTS_ENABLED_KEY, newValue),
                "timer-outline",
                undefined,
                !globalNotificationsEnabled
            )}
            
            {renderNotificationRow(
                "Meditation Reminders",
                meditationRemindersEnabled && globalNotificationsEnabled,
                (newValue) => handleSettingToggle(setMeditationRemindersEnabled, MEDITATION_REMINDERS_ENABLED_KEY, newValue),
                "leaf-outline",
                undefined,
                !globalNotificationsEnabled
            )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createThemedStyles = (theme: typeof lightPurplePalette) =>
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
    scrollContentContainer: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 40,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    subHeaderTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.labelText,
        marginTop: 24,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.card,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
      marginBottom: 12, 
      minHeight: 60, 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1, 
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: theme.iconBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconContainerDisabled: {
        backgroundColor: theme.border,
    },
    rowLabel: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '500',
      marginRight: 10,
    },
    rowLabelDisabled: {
        color: theme.subtleText,
    },
    rowDescription: {
      fontSize: 13,
      color: theme.subtleText,
      paddingHorizontal: 20,
      paddingBottom: 16,
      marginTop: -8, 
      backgroundColor: theme.card, 
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
      paddingTop: 4,
    },
    sectionSeparator: {
        height: 1,
        backgroundColor: theme.border,
        marginVertical: 16, 
        marginHorizontal: 4,
    }
  });

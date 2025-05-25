import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useI18n } from '../src/contexts/I18nContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { requestPermissionsAsync, scheduleLocalNotification } from '../src/services/notificationManager';

const USER_PROFILE_KEY = 'minhub_user_profile_data';
const ONBOARDING_COMPLETED_KEY = 'minhub_onboarding_completed';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, isDark, setTheme } = useTheme();
  const { t } = useI18n();
  const styles = createThemedStyles(theme);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      router.replace('/');
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const onToggleThemeSwitch = () => {
    setTheme(isDark ? 'light' : 'dark');
  };
  
  const handleSendTestNotification = async () => {
    const permissions = await Notifications.getPermissionsAsync();
    let permissionsGranted = permissions.granted;

    if (!permissionsGranted && !(permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL || permissions.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED)) {
        permissionsGranted = await requestPermissionsAsync();
        if(!permissionsGranted){
            Alert.alert("Permissions Required", "Notification permissions are not granted. Please enable them in settings.");
            return;
        }
    }
    
    scheduleLocalNotification(
      "MinHub Test! 🚀",
      "This notification should appear in 1 second.",
      { customData: "test_from_settings_main" },
      1
    );
    Alert.alert("Notification Scheduled", "Test notification has been scheduled. Check your device notifications.");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView>
            <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
            <TouchableOpacity style={styles.row} onPress={() => router.push('/edit-profile')}>
                <Text style={styles.rowLabel}>{t('settings.editProfile')}</Text>
                <Text style={styles.rowIcon}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.row} onPress={() => router.push('/notification-settings')}>
                <Text style={styles.rowLabel}>{t('settings.notifications')}</Text>
                <Text style={styles.rowIcon}>›</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
            <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('settings.darkMode')}</Text>
                <Switch
                value={isDark}
                onValueChange={onToggleThemeSwitch}
                trackColor={{ false: '#767577', true: theme.primary }}
                thumbColor={isDark ? theme.primary : '#f4f3f4'}
                />
            </View>
            <TouchableOpacity style={styles.row} onPress={() => router.push('/language-settings')}>
                <Text style={styles.rowLabel}>{t('settings.language')}</Text>
                <Text style={styles.rowIcon}>›</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.testing')}</Text>
            <TouchableOpacity style={styles.row} onPress={handleSendTestNotification}>
                <Text style={styles.rowLabel}>{t('settings.sendTestNotification')}</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>{t('settings.logout')}</Text>
            </TouchableOpacity>
            </View>
        </ScrollView>
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
    safeArea: {
      flex: 1,
    },
    section: {
      marginTop: 20,
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
      paddingBottom: 4,
      paddingHorizontal: 16,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    rowLabel: {
      fontSize: 17,
      color: theme.text,
    },
    rowIcon: {
      fontSize: 20,
      color: theme.subtleText,
    },
    logoutButton: {
      backgroundColor: theme.card,
      paddingVertical: 14,
      alignItems: 'center',
    },
    logoutButtonText: {
      fontSize: 17,
      color: theme.danger,
      fontWeight: '500',
    },
  });
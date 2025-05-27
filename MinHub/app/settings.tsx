import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useI18n } from '../src/contexts/I18nContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { requestPermissionsAsync, scheduleLocalNotification } from '../src/services/notificationManager';

const USER_PROFILE_KEY = 'minhub_user_profile_data';
const ONBOARDING_COMPLETED_KEY = 'minhub_onboarding_completed';
const PIN_ENABLED_KEY = 'minhub_pin_enabled_status';
const PIN_SECURE_STORE_KEY = 'minhub_user_pin';

const lightPurplePalette = {
  primary: '#8A63D2',    
  background: '#F5F3F9', 
  card: '#FFFFFF',        
  text: '#1A202C',        
  subtleText: '#718096',  
  border: '#E2E8F0',     
  danger: '#E53E3E',      
  iconBackground: '#EDE9F6', 
};

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, setTheme } = useTheme(); 
  const { t } = useI18n();
  const styles = createThemedStyles(lightPurplePalette);

  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [isLoadingPinStatus, setIsLoadingPinStatus] = useState(true);

  const loadPinStatus = useCallback(async () => {
    setIsLoadingPinStatus(true);
    try {
        const pinStatus = await AsyncStorage.getItem(PIN_ENABLED_KEY);
        setIsPinEnabled(pinStatus === 'true');
    } catch (error) {
        console.error("Failed to load PIN status", error);
        setIsPinEnabled(false);
    } finally {
        setIsLoadingPinStatus(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPinStatus();
    }, [loadPinStatus])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      await AsyncStorage.removeItem(PIN_ENABLED_KEY);
      await SecureStore.deleteItemAsync(PIN_SECURE_STORE_KEY);
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
      "MinHub Test! �",
      "This notification should appear in 1 second.",
      { customData: "test_from_settings_main" },
      1
    );
    Alert.alert("Notification Scheduled", "Test notification has been scheduled. Check your device notifications.");
  };

  const handleTogglePinSetting = async () => {
    if (isPinEnabled) {
      Alert.alert(
        "Disable PIN",
        "Are you sure you want to disable PIN lock?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Disable", 
            style: "destructive",
            onPress: async () => {
              setIsLoadingPinStatus(true);
              await SecureStore.deleteItemAsync(PIN_SECURE_STORE_KEY);
              await AsyncStorage.setItem(PIN_ENABLED_KEY, JSON.stringify(false));
              setIsPinEnabled(false);
              setIsLoadingPinStatus(false);
              Alert.alert("PIN Disabled", "PIN lock has been disabled.");
            }
          }
        ]
      );
    } else {
      router.push('/set-pin');
    }
  };

  const handlePasswordRecovery = () => {
    Alert.alert("Password Recovery", "Password recovery process would start here.");
  };

  if (isLoadingPinStatus) {
    return (
        <View style={[styles.container, styles.loadingIndicatorContainer]}>
            <ActivityIndicator size="large" color={lightPurplePalette.primary} />
        </View>
    );
  }

  const renderSettingRow = (iconName: keyof typeof Ionicons.glyphMap, text: string, onPress?: () => void, rightContent?: React.ReactNode) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={styles.rowLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={20} color={lightPurplePalette.primary} />
        </View>
        <Text style={styles.rowLabel}>{text}</Text>
      </View>
      {rightContent}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.headerTitle}>Settings</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('settings.account', { defaultValue: 'Account' })}</Text>
                {renderSettingRow('person-outline', t('settings.editProfile'), () => router.push('/edit-profile'), <Ionicons name="chevron-forward-outline" size={20} color={styles.rowIcon.color} />)}
                {renderSettingRow('key-outline', t('settings.passwordRecovery', {defaultValue: 'Password Recovery'}), handlePasswordRecovery, <Ionicons name="chevron-forward-outline" size={20} color={styles.rowIcon.color} />)}
                {renderSettingRow('notifications-outline', t('settings.notifications'), () => router.push('/notification-settings'), <Ionicons name="chevron-forward-outline" size={20} color={styles.rowIcon.color} />)}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('settings.security', {defaultValue: 'Security'})}</Text>
                {renderSettingRow('lock-closed-outline', t('settings.enablePin', {defaultValue: 'Enable PIN Lock'}), handleTogglePinSetting, 
                  <Switch
                      value={isPinEnabled}
                      onValueChange={handleTogglePinSetting}
                      trackColor={{ false: '#DCDFE6', true: lightPurplePalette.primary }}
                      thumbColor={'#FFFFFF'}
                      ios_backgroundColor="#DCDFE6"
                  />
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('settings.appearance', {defaultValue: 'Appearance'})}</Text>
                {renderSettingRow('moon-outline', t('settings.darkMode'), onToggleThemeSwitch, 
                  <Switch
                    value={isDark}
                    onValueChange={onToggleThemeSwitch}
                    trackColor={{ false: '#DCDFE6', true: lightPurplePalette.primary }}
                    thumbColor={'#FFFFFF'}
                    ios_backgroundColor="#DCDFE6"
                  />
                )}
                {renderSettingRow('language-outline', t('settings.language'), () => router.push('/language-settings'), <Ionicons name="chevron-forward-outline" size={20} color={styles.rowIcon.color} />)}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('settings.testing', {defaultValue: 'Testing'})}</Text>
                {renderSettingRow('send-outline', t('settings.sendTestNotification'), handleSendTestNotification)}
            </View>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color={lightPurplePalette.danger} />
                <Text style={styles.logoutButtonText}>{t('settings.logout')}</Text>
            </TouchableOpacity>

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
    safeArea: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 30,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
    },
    loadingIndicatorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    section: {
      marginTop: 16,
      marginHorizontal: 16,
      backgroundColor: theme.card,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.subtleText,
      paddingTop: 16,
      paddingBottom: 8,
      paddingHorizontal: 20,
      textTransform: 'uppercase',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.background,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.iconBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    rowLabel: {
      fontSize: 16,
      color: theme.text,
    },
    rowIcon: {
      color: theme.subtleText,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 16,
      marginTop: 30,
      backgroundColor: theme.card,
      paddingVertical: 14,
      borderRadius: 16,
    },
    logoutButtonText: {
      fontSize: 16,
      color: theme.danger,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

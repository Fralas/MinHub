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
const CUSTOM_DASHBOARD_ORDER_KEY = 'minhub_custom_dashboard_order'; 

const lightPurplePalette = {
  primary: '#8A63D2',    
  background: '#F5F3F9', 
  card: '#FFFFFF',        
  text: '#1A202C',        
  subtleText: '#718096',  
  border: '#E2E8F0',     
  danger: '#E53E3E',      
  iconBackground: '#EDE9F6', 
  switchThumbColor: '#FFFFFF', 
  switchTrackColorFalse: '#DCDFE6', 
};

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, setTheme } = useTheme(); 
  const { t } = useI18n();
  const styles = createThemedStyles(lightPurplePalette);

  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadAllSettings = async () => {
        setIsLoadingSettings(true);
        try {
            const pinStatus = await AsyncStorage.getItem(PIN_ENABLED_KEY);
            setIsPinEnabled(pinStatus === 'true');

        } catch (error) {
            console.error("Failed to load settings", error);
            setIsPinEnabled(false);
        } finally {
            setIsLoadingSettings(false);
        }
      };
      loadAllSettings();
    }, []) 
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
      "MinHub Test! 🚀",
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
              setIsLoadingSettings(true); 
              await SecureStore.deleteItemAsync(PIN_SECURE_STORE_KEY);
              await AsyncStorage.setItem(PIN_ENABLED_KEY, JSON.stringify(false));
              setIsPinEnabled(false);
              setIsLoadingSettings(false);
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
    const checkRecoveryAvailability = async () => {
        Alert.alert(
            "Password Recovery", 
            "Password recovery via email is not implemented. Security question recovery needs to be set up first."
        );
    };
    checkRecoveryAvailability();
  };


  if (isLoadingSettings) { 
    return (
        <View style={[styles.container, styles.loadingIndicatorContainer]}>
            <ActivityIndicator size="large" color={lightPurplePalette.primary} />
        </View>
    );
  }

  const renderSettingRow = (iconName: keyof typeof Ionicons.glyphMap, textKey: string, onPress?: () => void, rightContent?: React.ReactNode, defaultText?: string) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress && !rightContent}>
      <View style={styles.rowLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={20} color={lightPurplePalette.primary} />
        </View>
        <Text style={styles.rowLabel}>{t(textKey, {defaultValue: defaultText || textKey})}</Text>
      </View>
      {rightContent || (onPress && <Ionicons name="chevron-forward-outline" size={20} color={styles.rowIcon.color} />)}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.headerTitle}>{t('settings.title', {defaultValue: 'Settings'})}</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('settings.account', { defaultValue: 'Account' })}</Text>
                {renderSettingRow('person-outline', 'settings.editProfile', () => router.push('/edit-profile'))}
                {renderSettingRow('key-outline', 'settings.passwordRecovery', handlePasswordRecovery, undefined, 'Password Recovery')}
                {renderSettingRow('notifications-outline', 'settings.notifications', () => router.push('/notification-settings'))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('settings.security', {defaultValue: 'Security'})}</Text>
                {renderSettingRow('lock-closed-outline', 'settings.enablePin', undefined, 
                  <Switch
                      value={isPinEnabled}
                      onValueChange={handleTogglePinSetting}
                      trackColor={{ false: lightPurplePalette.switchTrackColorFalse, true: lightPurplePalette.primary }}
                      thumbColor={lightPurplePalette.switchThumbColor}
                      ios_backgroundColor={lightPurplePalette.switchTrackColorFalse}
                  />,
                  'Enable PIN Lock'
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('settings.appearance', {defaultValue: 'Appearance'})}</Text>
                {renderSettingRow('moon-outline', 'settings.darkMode', undefined, 
                  <Switch
                    value={isDark} 
                    onValueChange={onToggleThemeSwitch}
                    trackColor={{ false: lightPurplePalette.switchTrackColorFalse, true: lightPurplePalette.primary }}
                    thumbColor={lightPurplePalette.switchThumbColor}
                    ios_backgroundColor={lightPurplePalette.switchTrackColorFalse}
                  />
                )}
                {renderSettingRow('reorder-four-outline', 'settings.customizeDashboard', () => router.push('./customize-dashboard'), undefined, 'Customize Dashboard Order')}
                
                {renderSettingRow('language-outline', 'settings.language', () => router.push('/language-settings'))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('settings.testing', {defaultValue: 'Testing'})}</Text>
                {renderSettingRow('send-outline', 'settings.sendTestNotification', handleSendTestNotification, undefined, 'Send Test Notification')}
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
      shadowColor: '#4A3F6D', 
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1, 
      shadowRadius: 8,   
      elevation: 5,      
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
      paddingVertical: 16, 
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border, 
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1, 
    },
    iconContainer: {
      width: 38, 
      height: 38,
      borderRadius: 10, 
      backgroundColor: theme.iconBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    rowLabel: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '500', 
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
      paddingVertical: 16, 
      borderRadius: 16,    
      borderWidth: 1,
      borderColor: theme.danger, 
    },
    logoutButtonText: {
      fontSize: 16,
      color: theme.danger,
      fontWeight: '600',
      marginLeft: 8,
    },
  });
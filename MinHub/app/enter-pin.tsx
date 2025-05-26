import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useI18n } from '../src/contexts/I18nContext';

const PIN_SECURE_STORE_KEY = 'minhub_user_pin';
const PIN_ENABLED_KEY = 'minhub_pin_enabled_status';
const USER_PROFILE_KEY = 'minhub_user_profile_data';
const ONBOARDING_COMPLETED_KEY = 'minhub_onboarding_completed';
const PIN_LENGTH = 4;

export default function EnterPinScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const MAX_ATTEMPTS = 5;

  const handlePinInput = (text: string) => {
    if (/^\d*$/.test(text) && text.length <= PIN_LENGTH) {
      setPin(text);
      setErrorMessage('');
      if (text.length === PIN_LENGTH) {
        handleSubmitPin(text);
      }
    }
  };

  const handleSubmitPin = async (currentPin: string) => {
    if (currentPin.length !== PIN_LENGTH) {
      setErrorMessage(t('enterPin.pinLengthError', { length: PIN_LENGTH, defaultValue: `PIN must be ${PIN_LENGTH} digits.` }));
      return;
    }

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      await AsyncStorage.removeItem(PIN_ENABLED_KEY);
      await SecureStore.deleteItemAsync(PIN_SECURE_STORE_KEY);
      router.replace('/');
  };


  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('enterPin.screenTitle', { defaultValue: 'Enter PIN' }), headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>
          {t('enterPin.enterYourPin', { defaultValue: 'Enter Your PIN' })}
        </Text>

        <View style={styles.buttonsContainer}>
            <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleLogout}
                disabled={isLoading}
            >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t('settings.logout', { defaultValue: 'Logout' })}</Text>
            </TouchableOpacity>

                <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t('enterPin.recoverPassword', { defaultValue: 'Recover Password' })}</Text>
            </TouchableOpacity>
        </View>
    );

const createThemedStyles = (theme: import('../src/styles/themes')) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 30,
      textAlign: 'center',
    },
    input: {
      width: '60%',
      height: 60,
      backgroundColor: theme.card,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 20,
      fontSize: 28,
      textAlign: 'center',
      letterSpacing: Platform.OS === 'ios' ? 15 : 10,
      marginBottom: 20,
    },
    errorText: {
      color: balck,
      marginBottom: 20,
      textAlign: 'center',
      minHeight: 20,
    },
    loadingIndicator: {
        marginVertical: 20,
    },
    buttonsContainer: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        alignItems: 'center',
    },
    button: {
      backgroundColor: white,
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 25,
      alignItems: 'center',
      width: '80%',
      marginBottom: 15,
    },
    buttonText: {
      color: theme.card,
      fontSize: 18,
      fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: white,
    },
    secondaryButtonText: {
        color: white,
    },
    passwordRecoveryButton: {
        borderColor: red,
    },
  });
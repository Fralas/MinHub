import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useI18n } from '../src/contexts/I18nContext';
import { useTheme } from '../src/contexts/ThemeContext';

const PIN_SECURE_STORE_KEY = 'minhub_user_pin';
const PIN_ENABLED_KEY = 'minhub_pin_enabled_status';
const USER_PROFILE_KEY = 'minhub_user_profile_data';
const ONBOARDING_COMPLETED_KEY = 'minhub_onboarding_completed';
const PIN_LENGTH = 4;

export default function EnterPinScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const styles = createThemedStyles(theme);

  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
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

    setIsLoading(true);
    try {
      const storedPin = await SecureStore.getItemAsync(PIN_SECURE_STORE_KEY);
      if (storedPin === currentPin) {
        setErrorMessage('');
        setAttempts(0);
        setTimeout(() => router.replace('/home'), 0);
      } else {
        setAttempts(prevAttempts => prevAttempts + 1);
        if (attempts + 1 >= MAX_ATTEMPTS) {
          setErrorMessage(t('enterPin.maxAttemptsReached', { defaultValue: 'Maximum attempts reached. Logging out...' }));
          Alert.alert(
            t('enterPin.tooManyAttemptsTitle', { defaultValue: 'Too Many Incorrect Attempts' }),
            t('enterPin.tooManyAttemptsMessage', { defaultValue: 'You have exceeded the maximum number of attempts. For your security, you will be logged out.' }),
            [{ text: t('common.ok', { defaultValue: 'OK' }), onPress: handleLogout }]
          );
        } else {
          setErrorMessage(t('enterPin.incorrectPin', { defaultValue: 'Incorrect PIN. Please try again.' }));
        }
        setPin('');
      }
    } catch (error) {
      console.error("Failed to verify PIN", error);
      setErrorMessage(t('enterPin.verificationError', { defaultValue: 'Error verifying PIN. Please try again.' }));
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      await AsyncStorage.removeItem(PIN_ENABLED_KEY);
      await SecureStore.deleteItemAsync(PIN_SECURE_STORE_KEY);
      router.replace('/');
    } catch (error) {
      console.error("Error during logout from PIN screen:", error);
      Alert.alert(t('errors.errorTitle', { defaultValue: 'Error' }), t('errors.logoutError', { defaultValue: 'Could not log out.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRecovery = () => {
    Alert.alert(
      t('enterPin.passwordRecoveryTitle', { defaultValue: "Password Recovery" }),
      t('enterPin.passwordRecoveryMessage', { defaultValue: "Password recovery feature is not yet implemented." })
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('enterPin.screenTitle', { defaultValue: 'Enter PIN' }), headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>
          {t('enterPin.enterYourPin', { defaultValue: 'Enter Your PIN' })}
        </Text>

        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={handlePinInput}
          keyboardType="number-pad"
          maxLength={PIN_LENGTH}
          secureTextEntry
          placeholder="----"
          placeholderTextColor={theme.subtleText}
          autoFocus={true}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {isLoading && <ActivityIndicator size="large" color={theme.primary} style={styles.loadingIndicator} />}

        <View style={styles.buttonsContainer}>
            <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleLogout}
                disabled={isLoading}
            >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t('settings.logout', { defaultValue: 'Logout' })}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.secondaryButton, styles.passwordRecoveryButton]}
                onPress={handlePasswordRecovery}
                disabled={isLoading}
            >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t('enterPin.recoverPassword', { defaultValue: 'Recover Password' })}</Text>
            </TouchableOpacity>
        </View>
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
      color: theme.danger,
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
      backgroundColor: theme.primary,
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
        borderColor: theme.primary,
    },
    secondaryButtonText: {
        color: theme.primary,
    },
    passwordRecoveryButton: {
        borderColor: theme.subtleText,
    },
  });
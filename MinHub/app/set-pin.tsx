import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../src/contexts/ThemeContext';

const PIN_SECURE_STORE_KEY = 'minhub_user_pin';
const PIN_ENABLED_KEY = 'minhub_pin_enabled_status';
const PIN_LENGTH = 4; 

export default function SetPinScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = createThemedStyles(theme);

  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinInput = (text: string, type: 'enter' | 'confirm') => {
    if (/^\d*$/.test(text) && text.length <= PIN_LENGTH) {
      if (type === 'enter') {
        setPin(text);
      } else {
        setConfirmPin(text);
      }
      setErrorMessage('');
    }
  };

  const handleSubmitPin = async () => {
    if (step === 'enter') {
      if (pin.length !== PIN_LENGTH) {
        setErrorMessage(`PIN must be ${PIN_LENGTH} digits.`);
        return;
      }
      setStep('confirm');
      setErrorMessage('');
    } else {
      if (pin !== confirmPin) {
        setErrorMessage('PINs do not match. Please try again.');
        setPin('');
        setConfirmPin('');
        setStep('enter');
        return;
      }
      
      setIsLoading(true);
      try {
        await SecureStore.setItemAsync(PIN_SECURE_STORE_KEY, pin);
        await AsyncStorage.setItem(PIN_ENABLED_KEY, JSON.stringify(true));
        Alert.alert('PIN Set', 'Your PIN has been set successfully.');
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/settings');
        }
      } catch (error) {
        console.error("Failed to set PIN", error);
        setErrorMessage('Failed to set PIN. Please try again.');
        Alert.alert('Error', 'Could not set your PIN.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: step === 'enter' ? 'Set New PIN' : 'Confirm PIN' }} />
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>
          {step === 'enter' ? `Enter a ${PIN_LENGTH}-digit PIN` : 'Confirm Your PIN'}
        </Text>
        
        <TextInput
          style={styles.input}
          value={step === 'enter' ? pin : confirmPin}
          onChangeText={(text) => handlePinInput(text, step)}
          keyboardType="number-pad"
          maxLength={PIN_LENGTH}
          secureTextEntry
          placeholder={step === 'enter' ? 'Enter PIN' : 'Confirm PIN'}
          placeholderTextColor={theme.subtleText}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmitPin}
          disabled={isLoading || (step === 'enter' && pin.length !== PIN_LENGTH) || (step === 'confirm' && confirmPin.length !== PIN_LENGTH)}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.card} />
          ) : (
            <Text style={styles.buttonText}>{step === 'enter' ? 'Next' : 'Set PIN'}</Text>
          )}
        </TouchableOpacity>

        {step === 'confirm' && (
            <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
                setStep('enter');
                setPin('');
                setConfirmPin('');
                setErrorMessage('');
            }}
            disabled={isLoading}
            >
            <Text style={styles.cancelButtonText}>Back to Enter PIN</Text>
            </TouchableOpacity>
        )}
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
      fontSize: 22,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 30,
      textAlign: 'center',
    },
    input: {
      width: '80%',
      height: 50,
      backgroundColor: theme.card,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 20,
      fontSize: 20,
      textAlign: 'center',
      letterSpacing: Platform.OS === 'ios' ? 10 : 5,
      marginBottom: 20,
    },
    errorText: {
      color: theme.danger,
      marginBottom: 20,
      textAlign: 'center',
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
    buttonDisabled: {
      backgroundColor: theme.subtleText,
    },
    buttonText: {
      color: theme.card,
      fontSize: 18,
      fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.subtleText,
    },
    cancelButtonText: {
        color: theme.subtleText,
        fontSize: 16,
        fontWeight: '500',
    }
  });
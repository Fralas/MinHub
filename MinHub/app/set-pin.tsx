import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../src/contexts/ThemeContext';

const PIN_SECURE_STORE_KEY = 'minhub_user_pin';
const PIN_ENABLED_KEY = 'minhub_pin_enabled_status';
const PIN_LENGTH = 4; 

export default function SetPinScreen() {
  const router = useRouter();

  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
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
      
      setIsLoading(true);
        await SecureStore.setItemAsync(PIN_SECURE_STORE_KEY, pin);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: step === 'enter' ? 'Set New PIN' : 'Confirm PIN' }} />
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>
          {step === 'enter' ? `Enter a ${PIN_LENGTH}-digit PIN` : 'Confirm Your PIN'}
        </Text>
     )

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
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 20,
      fontSize: 20,
      textAlign: 'center',
      letterSpacing: Platform.OS === 'ios' ? 10 : 5, 
      marginBottom: 20,
    },
    button: {
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
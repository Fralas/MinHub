import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PIN_SECURE_STORE_KEY = 'minhub_user_pin';
const PIN_ENABLED_KEY = 'minhub_pin_enabled_status';
const PIN_LENGTH = 4;

const purpleTheme = {
  primary: '#9D50BB',
  background: '#1D192C',
  card: '#2C2541',
  text: '#F5F5F5',
  subtleText: '#A19CB0',
  border: '#4A3F6D',
  danger: '#E94560',
  shadow: 'rgba(0, 0, 0, 0.4)',
};

export default function SetPinScreen() {
  const router = useRouter();
  const styles = createThemedStyles(purpleTheme);

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
      <Stack.Screen options={{ title: step === 'enter' ? 'Set New PIN' : 'Confirm PIN', headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <Image 
            source={require('../assets/images/lock/lock1.png')} 
            style={styles.headerImage}
        />
        
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
          placeholder="••••"
          placeholderTextColor={purpleTheme.subtleText}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (isLoading || (step === 'enter' && pin.length !== PIN_LENGTH) || (step === 'confirm' && confirmPin.length !== PIN_LENGTH)) && styles.buttonDisabled]}
          onPress={handleSubmitPin}
          disabled={isLoading || (step === 'enter' && pin.length !== PIN_LENGTH) || (step === 'confirm' && confirmPin.length !== PIN_LENGTH)}
        >
          {isLoading ? (
            <ActivityIndicator color={purpleTheme.background} />
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
              <Text style={styles.cancelButtonText}>Back</Text>
            </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const createThemedStyles = (theme: typeof purpleTheme) =>
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
    headerImage: {
        width: 210,
        height: 210,
        marginBottom: 40,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 30,
      textAlign: 'center',
    },
    input: {
      width: '70%',
      height: 60,
      backgroundColor: theme.card,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 15,
      paddingHorizontal: 20,
      fontSize: 28,
      textAlign: 'center',
      letterSpacing: Platform.OS === 'ios' ? 20 : 15,
      marginBottom: 20,
    },
    errorText: {
      color: theme.danger,
      marginBottom: 20,
      textAlign: 'center',
      minHeight: 20,
    },
    button: {
      backgroundColor: theme.primary,
      paddingVertical: 18,
      paddingHorizontal: 30,
      borderRadius: 30,
      alignItems: 'center',
      width: '80%',
      marginBottom: 15,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 5,
      elevation: 8,
    },
    buttonDisabled: {
      backgroundColor: theme.subtleText,
      elevation: 0,
      shadowOpacity: 0,
    },
    buttonText: {
      color: theme.background,
      fontSize: 18,
      fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.subtleText,
        elevation: 0,
        shadowOpacity: 0,
    },
    cancelButtonText: {
        color: theme.subtleText,
        fontSize: 16,
        fontWeight: '500',
    }
  });

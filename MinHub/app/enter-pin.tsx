import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PIN_SECURE_STORE_KEY = 'minhub_user_pin';
const PIN_ENABLED_KEY = 'minhub_pin_enabled_status';
const USER_PROFILE_KEY = 'minhub_user_profile_data';
const ONBOARDING_COMPLETED_KEY = 'minhub_onboarding_completed';
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

export default function EnterPinScreen() {
  const router = useRouter();
  const styles = createThemedStyles(purpleTheme);

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
    if (currentPin.length !== PIN_LENGTH) return;

    setIsLoading(true);
    try {
      const storedPin = await SecureStore.getItemAsync(PIN_SECURE_STORE_KEY);
      if (storedPin === currentPin) {
        setErrorMessage('');
        setAttempts(0);
        router.replace('/home');
      } else {
        setAttempts(prevAttempts => prevAttempts + 1);
        if (attempts + 1 >= MAX_ATTEMPTS) {
          Alert.alert(
            'Too Many Incorrect Attempts',
            'For your security, you will be logged out.',
            [{ text: 'OK', onPress: handleLogout }]
          );
        } else {
          setErrorMessage('Incorrect PIN. Please try again.');
        }
        setPin('');
      }
    } catch (error) {
      console.error("Failed to verify PIN", error);
      setErrorMessage('Error verifying PIN. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.multiRemove([USER_PROFILE_KEY, ONBOARDING_COMPLETED_KEY, PIN_ENABLED_KEY]);
      await SecureStore.deleteItemAsync(PIN_SECURE_STORE_KEY);
      router.replace('/');
    } catch (error) {
      console.error("Error during logout from PIN screen:", error);
      Alert.alert('Error', 'Could not log out.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRecovery = () => {
    Alert.alert(
      "Password Recovery",
      "Password recovery feature is not yet implemented."
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Enter PIN', headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <Image 
            source={require('../assets/images/lock/lock2.png')} 
            style={styles.headerImage}
        />
        
        <Text style={styles.title}>Enter Your PIN</Text>

        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={handlePinInput}
          keyboardType="number-pad"
          maxLength={PIN_LENGTH}
          secureTextEntry
          placeholder="••••"
          placeholderTextColor={purpleTheme.subtleText}
          autoFocus={true}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {isLoading && <ActivityIndicator size="large" color={purpleTheme.primary} style={{ marginVertical: 20 }} />}

        <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.linkButton} onPress={handlePasswordRecovery} disabled={isLoading}>
                <Text style={styles.linkButtonText}>Forgot PIN?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={handleLogout} disabled={isLoading}>
                <Text style={styles.linkButtonText}>Logout</Text>
            </TouchableOpacity>
        </View>
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
        width: 200,
        height: 200,
        borderRadius: 25,
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
    buttonsContainer: {
        position: 'absolute',
        bottom: 50,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    linkButton: {
        padding: 10,
    },
    linkButtonText: {
        color: theme.subtleText,
        fontSize: 16,
        fontWeight: '500',
    }
  });
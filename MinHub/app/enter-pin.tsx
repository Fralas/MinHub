import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PIN_SECURE_STORE_KEY = 'minhub_user_pin';
const PIN_ENABLED_KEY = 'minhub_pin_enabled_status';
const USER_PROFILE_KEY = 'minhub_user_profile_data';
const ONBOARDING_COMPLETED_KEY = 'minhub_onboarding_completed';
const SECURITY_QUESTION_KEY = 'minhub_security_question';
const SECURITY_ANSWER_KEY = 'minhub_security_answer';
const PIN_LENGTH = 4;

const purpleTheme = {
  primary: '#9D50BB',
  background: '#1D192C',
  card: '#2C2541',
  text: '#F5F5F5',
  subtleText: '#A19CB0',
  border: '#4A3F6D',
  danger: '#E94560',
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
    if (currentPin.length !== PIN_LENGTH) {
      setErrorMessage(`PIN must be ${PIN_LENGTH} digits.`);
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
          setErrorMessage('Maximum attempts reached. Logging out...');
          Alert.alert(
            'Too Many Incorrect Attempts',
            'You have exceeded the maximum number of attempts. For your security, you will be logged out.',
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
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      await AsyncStorage.removeItem(PIN_ENABLED_KEY);
      await SecureStore.deleteItemAsync(PIN_SECURE_STORE_KEY);
      await SecureStore.deleteItemAsync(SECURITY_QUESTION_KEY);
      await SecureStore.deleteItemAsync(SECURITY_ANSWER_KEY);
      router.replace('/');
    } catch (error) {
      console.error("Error during logout from PIN screen:", error);
      Alert.alert('Error', 'Could not log out.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
        const questionSet = await SecureStore.getItemAsync(SECURITY_QUESTION_KEY);
        if (questionSet) {
            router.push('/recover-pin');
        } else {
            Alert.alert(
                "No Recovery Method", 
                "A security question has not been set up for this account. Please log out and set up your PIN and recovery question again if needed, or contact support.",
                [{ text: "OK" }]
            );
        }
    } catch (error) {
        console.error("Error checking security question status", error);
        Alert.alert("Error", "Could not proceed with PIN recovery. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Enter PIN', headerShown: false }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <SafeAreaView style={styles.safeArea}>
            <Image 
                source={require('../assets/images/lock/lock1.png')}
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

            {isLoading && <ActivityIndicator size="large" color={purpleTheme.primary} style={styles.loadingIndicator} />}

            <View style={styles.bottomActionsContainer}>
                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                >
                    <Text style={styles.linkButtonText}>Forgot PIN?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.linkButton, styles.logoutButton]}
                    onPress={handleLogout}
                    disabled={isLoading}
                >
                    <Text style={[styles.linkButtonText, styles.logoutButtonText]}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
      </ScrollView>
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
        width: 120,
        height: 120,
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
    loadingIndicator: {
        marginVertical: 20,
    },
    bottomActionsContainer: {
        position: 'absolute',
        bottom: 40,
        width: '90%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    linkButton: {
      paddingVertical: 10,
      paddingHorizontal: 5,
    },
    linkButtonText: {
      color: theme.subtleText,
      fontSize: 16,
      fontWeight: '500',
    },
    logoutButton: {},
    logoutButtonText: {
        color: theme.danger,
    }
  });

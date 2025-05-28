import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PIN_SECURE_STORE_KEY = 'minhub_user_pin'; 
const SECURITY_QUESTION_KEY = 'minhub_security_question';
const SECURITY_ANSWER_KEY = 'minhub_security_answer';
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
};

type RecoveryStep = 'ask_question' | 'set_new_pin' | 'confirm_new_pin';

export default function RecoverPinScreen() {
  const router = useRouter();
  const styles = createThemedStyles(purpleTheme);

  const [isLoading, setIsLoading] = useState(true);
  const [storedQuestion, setStoredQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('ask_question');
  
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  useEffect(() => {
    if (recoveryStep === 'ask_question') {
      const loadSecurityQuestion = async () => {
        setIsLoading(true);
        try {
          const question = await SecureStore.getItemAsync(SECURITY_QUESTION_KEY);
          if (question) {
            setStoredQuestion(question);
          } else {
            setErrorMessage('Security question not found. Please contact support.');
            Alert.alert('Error', 'Security question not found.');
          }
        } catch (error) {
          console.error("Failed to load security question", error);
          setErrorMessage('Could not load security question.');
          Alert.alert('Error', 'Failed to load recovery data.');
        } finally {
          setIsLoading(false);
        }
      };
      loadSecurityQuestion();
    }
  }, [recoveryStep]);

  const handleAnswerSubmit = async () => {
    if (userAnswer.trim().length < 1) {
        setErrorMessage('Please enter your answer.');
        return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const storedAnswer = await SecureStore.getItemAsync(SECURITY_ANSWER_KEY);
      if (storedAnswer && storedAnswer === userAnswer.trim().toLowerCase()) {
        setRecoveryStep('set_new_pin');
      } else {
        setErrorMessage('Incorrect answer. Please try again.');
        Alert.alert('Incorrect Answer', 'The answer provided does not match.');
      }
    } catch (error) {
      console.error("Failed to verify answer", error);
      setErrorMessage('Error verifying your answer.');
      Alert.alert('Error', 'Could not verify your answer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPinInput = (text: string, type: 'new' | 'confirm_new') => {
    if (/^\d*$/.test(text) && text.length <= PIN_LENGTH) {
      if (type === 'new') setNewPin(text);
      else setConfirmNewPin(text);
      setErrorMessage('');
    }
  };

  const handleSetNewPinSubmit = async () => {
    if (recoveryStep === 'set_new_pin') {
        if (newPin.length !== PIN_LENGTH) {
            setErrorMessage(`New PIN must be ${PIN_LENGTH} digits.`);
            return;
        }
        setRecoveryStep('confirm_new_pin');
        setErrorMessage('');
    } else if (recoveryStep === 'confirm_new_pin') {
        if (newPin !== confirmNewPin) {
            setErrorMessage('New PINs do not match. Please try again.');
            setNewPin('');
            setConfirmNewPin('');
            setRecoveryStep('set_new_pin'); 
            return;
        }
        
        setIsLoading(true);
        try {
            await SecureStore.setItemAsync(PIN_SECURE_STORE_KEY, newPin);
            await AsyncStorage.setItem(PIN_ENABLED_KEY, JSON.stringify(true)); 

            Alert.alert('PIN Reset Successful', 'Your PIN has been reset. You can now use your new PIN.');
            router.replace('/enter-pin');
        } catch (error) {
            console.error("Failed to set new PIN", error);
            setErrorMessage('Failed to save new PIN. Please try again.');
            Alert.alert('Error', 'Could not reset your PIN.');
        } finally {
            setIsLoading(false);
        }
    }
  };


  const renderContent = () => {
    if (isLoading && recoveryStep === 'ask_question' && !storedQuestion) {
        return <ActivityIndicator size="large" color={purpleTheme.primary} />;
    }

    if (recoveryStep === 'ask_question') {
      return (
        <>
          <Image source={require('../assets/images/lock/lock1.png')} style={styles.headerImage} />
          <Text style={styles.title}>Recover Your PIN</Text>
          <Text style={styles.questionText}>{storedQuestion || "Loading question..."}</Text>
          <TextInput
            style={styles.input}
            value={userAnswer}
            onChangeText={setUserAnswer}
            placeholder="Your secret answer"
            placeholderTextColor={purpleTheme.subtleText}
            secureTextEntry
            editable={!isLoading && !!storedQuestion}
          />
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <TouchableOpacity
            style={[styles.button, (isLoading || !storedQuestion) && styles.buttonDisabled]}
            onPress={handleAnswerSubmit}
            disabled={isLoading || !storedQuestion}
          >
            {isLoading ? <ActivityIndicator color={purpleTheme.background} /> : <Text style={styles.buttonText}>Submit Answer</Text>}
          </TouchableOpacity>
        </>
      );
    }

    if (recoveryStep === 'set_new_pin' || recoveryStep === 'confirm_new_pin') {
        return (
            <>
                <Image source={require('../assets/images/lock/lock1.png')} style={styles.headerImage} />
                <Text style={styles.title}>
                    {recoveryStep === 'set_new_pin' ? `Set New ${PIN_LENGTH}-digit PIN` : 'Confirm New PIN'}
                </Text>
                <TextInput
                    style={styles.input}
                    value={recoveryStep === 'set_new_pin' ? newPin : confirmNewPin}
                    onChangeText={(text) => handleNewPinInput(text, recoveryStep === 'set_new_pin' ? 'new' : 'confirm_new')}
                    keyboardType="number-pad"
                    maxLength={PIN_LENGTH}
                    secureTextEntry
                    placeholder="••••"
                    placeholderTextColor={purpleTheme.subtleText}
                />
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleSetNewPinSubmit}
                    disabled={isLoading}
                >
                {isLoading ? (
                    <ActivityIndicator color={purpleTheme.background} />
                ) : (
                    <Text style={styles.buttonText}>{recoveryStep === 'set_new_pin' ? 'Next' : 'Set New PIN'}</Text>
                )}
                </TouchableOpacity>

                {recoveryStep === 'confirm_new_pin' && (
                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setRecoveryStep('set_new_pin')} disabled={isLoading}>
                        <Text style={styles.cancelButtonText}>Back</Text>
                    </TouchableOpacity>
                )}
            </>
        );
    }
    return null; 
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Recover PIN", headerBackTitle: "Back" }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <SafeAreaView style={styles.safeArea}>
          {renderContent()}
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
      paddingHorizontal: 20,
    },
    headerImage: {
        width: 100,
        height: 100,
        marginBottom: 30,
    },
    title: {
      fontSize: 22, 
      fontWeight: '600',
      color: theme.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    questionText: {
        fontSize: 18,
        color: theme.subtleText,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    input: {
      width: '100%',
      height: 60,
      backgroundColor: theme.card,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 15,
      paddingHorizontal: 20,
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 20,
    },
    errorText: {
      color: theme.danger,
      marginVertical: 15,
      textAlign: 'center',
      minHeight: 20,
    },
    button: {
      backgroundColor: theme.primary,
      paddingVertical: 18,
      borderRadius: 30,
      alignItems: 'center',
      width: '80%',
      marginTop: 10,
    },
    buttonDisabled: {
      backgroundColor: theme.subtleText,
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
        marginTop: 15,
    },
    cancelButtonText: {
        color: theme.subtleText,
        fontSize: 16,
        fontWeight: '500',
    },
  });

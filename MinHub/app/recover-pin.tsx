import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PIN_SECURE_STORE_KEY = 'minhub_user_pin'; 
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

type RecoveryStep = 'ask_question' | 'set_new_pin' | 'confirm_new_pin';

export default function RecoverPinScreen() {
  const router = useRouter();
  const styles = createThemedStyles(purpleTheme);
  const [isLoading, setIsLoading] = useState(true);
  const [storedQuestion, setStoredQuestion] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('ask_question');
  
  useEffect(() => {
    if (recoveryStep === 'ask_question') {
      const loadSecurityQuestion = async () => {
        setIsLoading(true);
          const question = await SecureStore.getItemAsync(SECURITY_QUESTION_KEY);
          if (question) {
            setStoredQuestion(question);
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
      const storedAnswer = await SecureStore.getItemAsync(SECURITY_ANSWER_KEY);
      if (storedAnswer && storedAnswer === userAnswer.trim().toLowerCase()) {
        setRecoveryStep('set_new_pin');


  const renderContent = () => {
    if (isLoading && recoveryStep === 'ask_question' && !storedQuestion) {
        return <ActivityIndicator size="large" color={purpleTheme.primary} />;
    }

    if (recoveryStep === 'ask_question') {
          //test
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
                />

            </>
        );
    }
    return null; 
  };

 
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
      borderRadius: 125,
      paddingHorizontal: 20,
      fontSize: 19,
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
      width: '50%',
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
        fontWeight: '600',
    },
  });
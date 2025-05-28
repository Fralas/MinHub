import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PIN_SECURE_STORE_KEY = 'minhub_user_pin';
const PIN_ENABLED_KEY = 'minhub_pin_enabled_status';
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
  shadow: 'rgba(0, 0, 0, 0.4)',
};

const securityQuestions = [
    "What was your first pet's name?",
    "What is your mother's maiden name?",
    "What was the name of your elementary school?",
    "In what city were you born?",
    "What is your favorite book?",
];


export default function SetPinScreen() {
  const router = useRouter();
  const styles = createThemedStyles(purpleTheme);

  const [step, setStep] = useState<'enter' | 'confirm' | 'set_question'>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [selectedQuestion, setSelectedQuestion] = useState(securityQuestions[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinInput = (text: string, type: 'enter' | 'confirm') => {
    if (/^\d*$/.test(text) && text.length <= PIN_LENGTH) {
      if (type === 'enter') setPin(text);
      else setConfirmPin(text);
      setErrorMessage('');
    }
  };

  const handleSubmit = async () => {
    if (step === 'enter') {
      if (pin.length !== PIN_LENGTH) {
        setErrorMessage(`PIN must be ${PIN_LENGTH} digits.`);
        return;
      }
      setStep('confirm');
      setErrorMessage('');
    } else if (step === 'confirm') {
      if (pin !== confirmPin) {
        setErrorMessage('PINs do not match. Please try again.');
        setPin('');
        setConfirmPin('');
        setStep('enter');
        return;
      }
      setStep('set_question');
      setErrorMessage('');
    } 
    else if (step === 'set_question') {
      if (securityAnswer.trim().length < 3) {
          setErrorMessage('Answer must be at least 3 characters long.');
          Alert.alert('Answer Too Short', 'Please provide a longer answer for your security question.');
          return;
      }
      
      setIsLoading(true);
      try {
        await SecureStore.setItemAsync(PIN_SECURE_STORE_KEY, pin);
        await SecureStore.setItemAsync(SECURITY_QUESTION_KEY, selectedQuestion);
        await SecureStore.setItemAsync(SECURITY_ANSWER_KEY, securityAnswer.trim().toLowerCase());
        
        await AsyncStorage.setItem(PIN_ENABLED_KEY, JSON.stringify(true));

        Alert.alert('PIN and Security Question Set', 'Your PIN and recovery question have been set successfully.');
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/settings');
        }
      } catch (error) {
        console.error("Failed to set PIN and security question", error);
        setErrorMessage('Failed to save settings. Please try again.');
        Alert.alert('Error', 'Could not set your PIN and security question.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderStepContent = () => {
    if (step === 'enter' || step === 'confirm') {
      return (
        <>
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
        </>
      );
    }

    if (step === 'set_question') {
        return (
            <>
                <Text style={styles.title}>Set a Recovery Question</Text>
                <Text style={styles.subtitle}>This will be used if you forget your PIN.</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Select a question:</Text>
                    {securityQuestions.map(q => (
                        <TouchableOpacity key={q} style={[styles.questionChip, selectedQuestion === q && styles.questionChipSelected]} onPress={() => setSelectedQuestion(q)}>
                            <Text style={styles.questionChipText}>{q}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Your answer:</Text>
                    <TextInput
                        style={styles.input}
                        value={securityAnswer}
                        onChangeText={setSecurityAnswer}
                        placeholder="Secret answer"
                        placeholderTextColor={purpleTheme.subtleText}
                        secureTextEntry
                    />
                </View>
            </>
        );
    }
  };


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <SafeAreaView style={styles.safeArea}>
            
            {renderStepContent()}

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
            >
            {isLoading ? (
                <ActivityIndicator color={purpleTheme.background} />
            ) : (
                <Text style={styles.buttonText}>{step === 'set_question' ? 'Save & Finish' : 'Next'}</Text>
            )}
            </TouchableOpacity>

            {step === 'confirm' && (
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setStep('enter')} disabled={isLoading}>
                    <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
            )}
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
    subtitle: {
        fontSize: 16,
        color: theme.subtleText,
        textAlign: 'center',
        marginBottom: 30,
        marginTop: -20,
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
    },
    cancelButtonText: {
        color: theme.subtleText,
        fontSize: 16,
        fontWeight: '500',
    },
    formGroup: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: theme.subtleText,
        marginBottom: 10,
        textAlign: 'left',
    },
    questionChip: {
        backgroundColor: theme.card,
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    questionChipSelected: {
        borderColor: theme.primary,
    },
    questionChipText: {
        color: theme.text,
        fontSize: 16,
    }
  });

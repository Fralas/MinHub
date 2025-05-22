import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TUTORIAL_COMPLETED_KEY = 'minhub_tutorial_completed'; 

export default function TutorialScreen() {
  const router = useRouter();

  const handleCompleteTutorial = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
      router.replace('/home');
    } catch (e) {
      console.error('Errore nel salvare lo stato del tutorial:', e);
      router.replace('/home');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Benvenuto su MinHub!</Text>
        <Text style={styles.text}>
          Questa è una breve introduzione alle fantastiche funzionalità che troverai.
          Scorri per scoprire di più! (Immagina qui più contenuti o slide)
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleCompleteTutorial}>
          <Text style={styles.buttonText}>Inizia Ora</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e0f7fa', 
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00796b', 
    textAlign: 'center',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#004d40', 
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#00796b',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
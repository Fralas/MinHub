import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const TUTORIAL_COMPLETED_KEY = 'minhub_tutorial_completed'; 

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [tutorialCompleted, setTutorialCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
        setTutorialCompleted(value === 'true');
      } catch (e) {
        console.error('Errore nel caricare lo stato del tutorial:', e);
        setTutorialCompleted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTutorialStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00796b" />
      </View>
    );
  }


  if (tutorialCompleted) {
    return <Redirect href="/home" />;
  } else {
    return <Redirect href="../tutorial" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f7fa', 
  },
});
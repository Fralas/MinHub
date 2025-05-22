import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const ONBOARDING_COMPLETED_KEY = 'minhub_onboarding_completed';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      console.log('[IndexScreen] Checking onboarding status...');
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        console.log('[IndexScreen] Value read from AsyncStorage for ONBOARDING_COMPLETED_KEY:', value); 
        setOnboardingCompleted(value === 'true');
      } catch (e) {
        console.error('[IndexScreen] Error loading ONBOARDING_COMPLETED_KEY:', e);
        setOnboardingCompleted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#641E7A" />
      </View>
    );
  }

  console.log('[IndexScreen] Onboarding completed state before redirect:', onboardingCompleted); 

  if (onboardingCompleted) {
    console.log('[IndexScreen] Redirecting to /home');
    return <Redirect href="/home" />;
  } else {
    console.log('[IndexScreen] Redirecting to /tutorial');
    return <Redirect href="/tutorial" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
});
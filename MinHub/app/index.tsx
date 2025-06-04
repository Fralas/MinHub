import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, SplashScreen } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../src/contexts/ThemeContext';

const ONBOARDING_COMPLETED_KEY = 'minhub_onboarding_completed';
const PIN_ENABLED_KEY = 'minhub_pin_enabled_status';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [pinEnabled, setPinEnabled] = useState<boolean | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();

    const checkAppStatus = async () => {
      try {
        const onboardingStatus = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        const pinStatus = await AsyncStorage.getItem(PIN_ENABLED_KEY);

        setOnboardingCompleted(onboardingStatus === 'true');
        setPinEnabled(pinStatus === 'true');

      } catch (e) {
        console.error('[IndexScreen] Error loading app status:', e);
        setOnboardingCompleted(false);
        setPinEnabled(false);
      } finally {
        setIsLoading(false);
        SplashScreen.hideAsync();
      }
    };

    checkAppStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (onboardingCompleted) {
    if (pinEnabled) {
      return <Redirect href="/enter-pin" />;
    } else {
      return <Redirect href="/home" />;
    }
  } else {
    return <Redirect href="/tutorial" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
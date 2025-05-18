import { Stack } from 'expo-router';
import React from 'react';

export default function PeriodTrackerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="periodTracker" options={{ title: 'Monitoraggio Ciclo', headerShown: true }} />
    </Stack>
  );
}
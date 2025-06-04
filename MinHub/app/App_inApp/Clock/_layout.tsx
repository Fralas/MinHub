import { Stack } from 'expo-router';
import React from 'react'; 

export default function ClockLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="ClockScreen"
        options={{
          headerShown: false, 
        }}
      />

      <Stack.Screen
        name="SleepDataScreen"
        options={{
          headerShown: false, 
        }}
      />
    </Stack>
  );
}

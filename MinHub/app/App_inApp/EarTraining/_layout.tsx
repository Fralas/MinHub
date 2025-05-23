import { Stack } from "expo-router";
import React from "react";

export default function EarTrainingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#641E7A',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MainEarTraining"
        options={{ title: 'Ear Training' }}
      />
      <Stack.Screen
        name="Milestones"
        options={{ title: 'Milestones' }}
      />
    </Stack>
  );
}

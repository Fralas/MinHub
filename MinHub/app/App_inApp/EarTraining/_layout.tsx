import { Stack } from 'expo-router';

export default function EarTrainingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Ear Training Home' }} />
      <Stack.Screen name="mainEarTraining" options={{ title: 'Game Mode' }} />
      <Stack.Screen name="speedMode" options={{ title: 'Speed Mode' }} />
      <Stack.Screen name="demoNotes" options={{ title: 'Demo Notes' }} />
      <Stack.Screen name="milestones" options={{ title: 'Milestones' }} />
    </Stack>
  );
}

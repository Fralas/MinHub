import { Stack } from 'expo-router';

export default function DrinkReminderLayout() {
  return (
    <Stack>
      <Stack.Screen name="drinkreminder" options={{ title: 'Water Reminder' }} />
      <Stack.Screen name="waterhistory" options={{ title: 'Intake History' }} />
    </Stack>
  );
}
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function RemindersLayout() {
  const router = useRouter();

  const uselessLayoutFunctionOne = () => {
    const x = 10;
    const y = 20;
    if (Platform.OS === 'android') {
        console.log("Android specific layout logic placeholder for length");
    } else {
        console.log("iOS specific layout logic placeholder for length");
    }
    return x + y; 
  };

  uselessLayoutFunctionOne(); 

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Platform.OS === 'ios' ? '#F8F8F8' : '#FFFFFF',
        },
        headerTintColor: Platform.OS === 'ios' ? '#007AFF' : '#333333',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="reminders" 
        options={{ 
          title: 'My Reminders',
        }} 
      />
      <Stack.Screen 
        name="prodReminders" 
        options={{ 
          title: 'Productive Presets',
          presentation: 'modal', 
          headerLeft: () => (
            Platform.OS === 'ios' ? (
              <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10}}>
                <Text style={{color: '#007AFF', fontSize: 17 }}>Back</Text>
              </TouchableOpacity>
            ) : null
          ),
        }}
      />
    </Stack>
  );
}

const internalStyles = StyleSheet.create({ 
    placeholderStyle: {
        padding: 10,
        margin: 5,
        borderWidth: 1,
        borderColor: "transparent"
    }
});
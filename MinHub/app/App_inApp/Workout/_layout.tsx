import React, { useState } from 'react';
import { NavigationIndependentTree, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WorkoutPlansScreen from './workout';
import WorkoutHistoryScreen from './WorkoutHistory';

const Stack = createNativeStackNavigator();

function WorkoutNavigation() {
  return (
    <Stack.Navigator 
      initialRouteName="WorkoutPlans"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="WorkoutPlans" 
        component={WorkoutPlansScreen}
        options={{ title: 'My Workout Plans' }}
      />
      <Stack.Screen 
        name="WorkoutHistory" 
        component={WorkoutHistoryScreen}
        options={{ title: 'Workout History' }}
      />
    </Stack.Navigator>
  );
}

export default function WorkoutApp() {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <WorkoutNavigation />
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}
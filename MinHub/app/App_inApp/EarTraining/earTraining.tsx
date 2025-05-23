import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainEarTraining from './MainEarTraining';
import MilestonesScreen from './MilestonesScreen';

export type EarTrainingStackParamList = {
  Main: undefined;
  Milestones: { unlockedMilestones: string[] };
};

const Stack = createNativeStackNavigator<EarTrainingStackParamList>();

export default function EarTrainingApp() {
  return (
    <Stack.Navigator initialRouteName="Main">
      <Stack.Screen name="Main" component={MainEarTraining} options={{ title: 'Ear Training' }} />
      <Stack.Screen name="Milestones" component={MilestonesScreen} options={{ title: 'Milestones' }} />
    </Stack.Navigator>
  );
}


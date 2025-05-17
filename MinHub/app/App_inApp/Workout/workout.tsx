import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { exercises } from './exerciseData';

export default function WorkoutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Workout App!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  text: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
});

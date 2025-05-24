import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WaterIntakeHistory() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📈 Water Intake History</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
  },
});

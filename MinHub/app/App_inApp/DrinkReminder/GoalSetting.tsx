import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function GoalSettings() {
  const [goal, setGoal] = useState<string>('5');
  const navigation = useNavigation();

  useEffect(() => {
    const loadGoal = async () => {
      const stored = await AsyncStorage.getItem('dailyGoal');
      if (stored) setGoal(stored);
    };
    loadGoal();
  }, []);

  const saveGoal = async () => {
    const value = parseInt(goal);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Invalid input', 'Please enter a number greater than 0');
      return;
    }
    await AsyncStorage.setItem('dailyGoal', goal);
    Alert.alert('Saved!', `Your new goal is ${goal} glasses/day`);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Daily Goal</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={goal}
        onChangeText={setGoal}
      />
      <Button title="Save Goal" onPress={saveGoal} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 10,
    marginBottom: 20,
    fontSize: 18,
    borderRadius: 5,
    textAlign: 'center',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
} from 'react-native';

import { FoodPreset, loadPresets, savePresets, getDefaultPresets } from './foodpresets';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

type MealPlan = {
  [key in MealType]: string;
};

export default function FoodScheduler() {
  const [mealPlans, setMealPlans] = useState<Record<string, MealPlan>>(() => {
    return days.reduce((acc, day) => {
      acc[day] = { Breakfast: '', Lunch: '', Dinner: '' };
      return acc;
    }, {} as Record<string, MealPlan>);
  });

  const [presets, setPresets] = useState<FoodPreset[]>(getDefaultPresets());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('Breakfast');
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');

  //load presets on mount
  useEffect(() => {
    loadPresets().then(setPresets);
  }, []);

  //save presets on change
  useEffect(() => {
    savePresets(presets);
  }, [presets]);

  const openModal = (day: string, mealType: MealType) => {
    setSelectedDay(day);
    setSelectedMealType(mealType);
    setInputValue(mealPlans[day][mealType]);
    setModalVisible(true);
  };

  const saveMeal = () => {
    if (selectedDay && selectedMealType) {
      setMealPlans(prev => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          [selectedMealType]: inputValue,
        },
      }));
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Food Scheduler</Text>
      <FlatList
        data={days}
        keyExtractor={(item) => item}
        renderItem={({ item: day }) => (
          <View style={styles.dayCard}>
            <Text style={styles.dayTitle}>{day}</Text>
            {(['Breakfast', 'Lunch', 'Dinner'] as MealType[]).map((mealType) => (
              <TouchableOpacity
                key={mealType}
                style={styles.mealRow}
                onPress={() => openModal(day, mealType)}
              >
                <Text style={styles.mealLabel}>{mealType}:</Text>
                <Text style={styles.mealText}>
                  {mealPlans[day][mealType] || 'Tap to add'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {selectedMealType}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter meal (e.g., Chicken Salad)"
              value={inputValue}
              onChangeText={setInputValue}
            />
            <Button title="Save" onPress={saveMeal} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="#aaa" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fdfdfd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  dayCard: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  mealLabel: {
    fontWeight: '500',
  },
  mealText: {
    color: '#555',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
});
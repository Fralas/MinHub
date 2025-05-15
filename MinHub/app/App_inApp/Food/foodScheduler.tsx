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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodPreset, getDefaultPresets } from './foodpresets';

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

  const [presets, setPresets] = useState<FoodPreset[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('Breakfast');
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [addPresetModalVisible, setAddPresetModalVisible] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newProtein, setNewProtein] = useState('');
  const [newFat, setNewFat] = useState('');
  const [newCalories, setNewCalories] = useState('');

  const PRESET_KEY = 'food_presets';

  useEffect(() => {
    const loadPresets = async () => {
      const stored = await AsyncStorage.getItem(PRESET_KEY);
      if (stored) {
        setPresets(JSON.parse(stored));
      } else {
        const defaults = getDefaultPresets();
        setPresets(defaults);
        await AsyncStorage.setItem(PRESET_KEY, JSON.stringify(defaults));
      }
    };
    loadPresets();
  }, []);

  const savePresets = async (updated: FoodPreset[]) => {
    setPresets(updated);
    await AsyncStorage.setItem(PRESET_KEY, JSON.stringify(updated));
  };

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

  const addNewPreset = () => {
    if (newPresetName.trim()) {
      const updatedPresets = [
        ...presets,
        {
          name: newPresetName.trim(),
          carbs: parseFloat(newCarbs) || 0,
          protein: parseFloat(newProtein) || 0,
          fat: parseFloat(newFat) || 0,
          calories: parseFloat(newCalories) || 0,
        },
      ];
      savePresets(updatedPresets);
      setNewPresetName('');
      setNewCarbs('');
      setNewProtein('');
      setNewFat('');
      setNewCalories('');
      setAddPresetModalVisible(false);
    }
  };

  const getTotalNutritionForDay = (day: string) => {
    const meals = mealPlans[day];
    let total = { carbs: 0, protein: 0, fat: 0, calories: 0 };

    Object.values(meals).forEach((mealName) => {
      const preset = presets.find((p) => p.name.toLowerCase() === mealName.toLowerCase());
      if (preset) {
        total.carbs += preset.carbs;
        total.protein += preset.protein;
        total.fat += preset.fat;
        total.calories += preset.calories;
      }
    });

    return total;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Food Scheduler</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddPresetModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

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

            {/* Nutrition Totals */}
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Total Nutrition:</Text>
              <Text style={styles.nutritionValue}>
                {(() => {
                  const total = getTotalNutritionForDay(day);
                  return `Carbs: ${total.carbs}g, Protein: ${total.protein}g, Fat: ${total.fat}g, Calories: ${total.calories}`;
                })()}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Edit Meal Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
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

      {/* Add Preset Modal */}
      <Modal visible={addPresetModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Food Preset</Text>
            <TextInput
              style={styles.input}
              placeholder="Preset name"
              value={newPresetName}
              onChangeText={setNewPresetName}
            />
            <TextInput
              style={styles.input}
              placeholder="Carbs (g)"
              keyboardType="numeric"
              value={newCarbs}
              onChangeText={setNewCarbs}
            />
            <TextInput
              style={styles.input}
              placeholder="Protein (g)"
              keyboardType="numeric"
              value={newProtein}
              onChangeText={setNewProtein}
            />
            <TextInput
              style={styles.input}
              placeholder="Fat (g)"
              keyboardType="numeric"
              value={newFat}
              onChangeText={setNewFat}
            />
            <TextInput
              style={styles.input}
              placeholder="Calories"
              keyboardType="numeric"
              value={newCalories}
              onChangeText={setNewCalories}
            />
            <Button title="Add" onPress={addNewPreset} />
            <Button title="Cancel" onPress={() => setAddPresetModalVisible(false)} color="#aaa" />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
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
  nutritionRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 8,
  },
  nutritionLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  nutritionValue: {
    color: '#2c3e50',
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

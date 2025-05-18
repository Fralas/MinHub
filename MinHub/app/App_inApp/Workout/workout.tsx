import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from 'react-native';

type ExercisePreset = {
  name: string;
  sets: number;
  reps: number;
  duration: number; // in seconds,
};

type WorkoutPlan = {
  name: string;
  exercises: string[]; 
};

const WORKOUT_KEY = 'workout_plans';
const EXERCISE_PRESET_KEY = 'exercise_presets';

export default function WorkoutScheduler() {
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [exercisePresets, setExercisePresets] = useState<ExercisePreset[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const [addPresetModalVisible, setAddPresetModalVisible] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newSets, setNewSets] = useState('');
  const [newReps, setNewReps] = useState('');
  const [newDuration, setNewDuration] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const savedWorkouts = await AsyncStorage.getItem(WORKOUT_KEY);
      if (savedWorkouts) setWorkouts(JSON.parse(savedWorkouts));

      const savedPresets = await AsyncStorage.getItem(EXERCISE_PRESET_KEY);
      if (savedPresets) setExercisePresets(JSON.parse(savedPresets));
    };
    loadData();
  }, []);

  const saveWorkouts = async (data: WorkoutPlan[]) => {
    setWorkouts(data);
    await AsyncStorage.setItem(WORKOUT_KEY, JSON.stringify(data));
  };

  const savePresets = async (data: ExercisePreset[]) => {
    setExercisePresets(data);
    await AsyncStorage.setItem(EXERCISE_PRESET_KEY, JSON.stringify(data));
  };

  const addWorkout = () => {
    if (!newWorkoutName.trim()) return;
    const newPlan: WorkoutPlan = {
      name: newWorkoutName.trim(),
      exercises: selectedExercises,
    };
    const updated = [...workouts, newPlan];
    saveWorkouts(updated);
    setNewWorkoutName('');
    setSelectedExercises([]);
    setModalVisible(false);
  };

  const addPreset = () => {
    if (!newExerciseName.trim()) return;
    const preset: ExercisePreset = {
      name: newExerciseName.trim(),
      sets: parseInt(newSets) || 0,
      reps: parseInt(newReps) || 0,
      duration: parseInt(newDuration) || 0,
    };
    const updated = [...exercisePresets, preset];
    savePresets(updated);
    setNewExerciseName('');
    setNewSets('');
    setNewReps('');
    setNewDuration('');
    setAddPresetModalVisible(false);
  };

  const toggleExerciseSelection = (exercise: string) => {
    setSelectedExercises((prev) =>
      prev.includes(exercise) ? prev.filter(e => e !== exercise) : [...prev, exercise]
    );
  };

  const filteredPresets = exercisePresets.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Planner</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.workoutTitle}>{item.name}</Text>
            {item.exercises.map((exercise) => {
              const preset = exercisePresets.find(p => p.name === exercise);
              return (
                <Text key={exercise} style={styles.exerciseText}>
                  {preset
                    ? `${preset.name} - ${preset.sets}x${preset.reps} (${preset.duration}s)`
                    : exercise}
                </Text>
              );
            })}
          </View>
        )}
      />

      {/* Add Workout Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Workout</Text>
            <TextInput
              style={styles.input}
              placeholder="Workout name"
              value={newWorkoutName}
              onChangeText={setNewWorkoutName}
            />
            <TextInput
              style={styles.input}
              placeholder="Search exercises..."
              value={search}
              onChangeText={setSearch}
            />
            <FlatList
              data={filteredPresets}
              keyExtractor={(item) => item.name}
              style={{ maxHeight: 150 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => toggleExerciseSelection(item.name)}
                  style={[
                    styles.presetItem,
                    selectedExercises.includes(item.name) && { backgroundColor: '#d1ecf1' },
                  ]}
                >
                  <Text>{item.name}</Text>
                  <Text style={styles.presetDetails}>
                    {item.sets}x{item.reps} | {item.duration}s
                  </Text>
                </TouchableOpacity>
              )}
            />
            <Button title="Create Workout" onPress={addWorkout} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="#aaa" />
          </View>
        </View>
      </Modal>

      {/* Add Preset Modal */}
      <Modal visible={addPresetModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Exercise Preset</Text>
            <TextInput
              style={styles.input}
              placeholder="Exercise name"
              value={newExerciseName}
              onChangeText={setNewExerciseName}
            />
            <TextInput
              style={styles.input}
              placeholder="Sets"
              keyboardType="numeric"
              value={newSets}
              onChangeText={setNewSets}
            />
            <TextInput
              style={styles.input}
              placeholder="Reps"
              keyboardType="numeric"
              value={newReps}
              onChangeText={setNewReps}
            />
            <TextInput
              style={styles.input}
              placeholder="Duration (sec)"
              keyboardType="numeric"
              value={newDuration}
              onChangeText={setNewDuration}
            />
            <Button title="Add Exercise" onPress={addPreset} />
            <Button title="Cancel" onPress={() => setAddPresetModalVisible(false)} color="#aaa" />
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={[styles.addButton, { marginTop: 10, alignSelf: 'center' }]}
        onPress={() => setAddPresetModalVisible(true)}
      >
        <Text style={styles.addButtonText}>Add Exercise Preset</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  addButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  card: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  workoutTitle: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
  exerciseText: { fontSize: 14, color: '#34495e', marginLeft: 10 },
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
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  presetItem: {
    paddingVertical: 8,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  presetDetails: {
    fontSize: 12,
    color: '#666',
  },
});
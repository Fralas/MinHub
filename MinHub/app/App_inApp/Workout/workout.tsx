import { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { exercises } from './exerciseData';

export default function WorkoutScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<string[]>([]);

  const handleAddExercise = () => {
    if (selectedExercise && !workoutPlan.includes(selectedExercise)) {
      setWorkoutPlan([...workoutPlan, selectedExercise]);
      setSelectedExercise(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Workout Plan</Text>

      <FlatList
        data={workoutPlan}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({ item }) => (
          <Text style={styles.exerciseItem}>• {item}</Text>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No exercises added yet</Text>}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Exercise</Text>

            <RNPickerSelect
              onValueChange={(value) => setSelectedExercise(value)}
              placeholder={{ label: 'Select an exercise...', value: null }}
              value={selectedExercise}
              items={exercises.map((exercise) => ({
                label: exercise.name,
                value: exercise.name,
              }))}
              style={pickerSelectStyles}
            />

            <TouchableOpacity style={styles.modalButton} onPress={handleAddExercise}>
              <Text style={styles.modalButtonText}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
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
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  exerciseItem: {
    fontSize: 18,
    marginVertical: 4,
    color: '#2c3e50',
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#95a5a6',
    marginTop: 10,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addButtonText: {
    fontSize: 30,
    color: '#fff',
    marginBottom: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    margin: 20,
    padding: 25,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 15,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelText: {
    marginTop: 10,
    color: '#e74c3c',
    fontSize: 16,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    width: 250,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    width: 250,
  },
};



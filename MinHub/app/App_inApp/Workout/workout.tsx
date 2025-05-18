import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { exercises, Exercise } from "./exerciseData"; // importa da exerciseData.tsx
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";

type WorkoutPlan = {
  id: number;
  name: string;
  exercises: Exercise[];
  durationSeconds: number; // duration for the entire workout plan
};

export default function WorkoutPlansScreen() {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [planName, setPlanName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [durationInput, setDurationInput] = useState(""); // input for workout duration in minutes
  const [nextId, setNextId] = useState(1);

  const exerciseOptions = exercises.map((exercise) => ({
    label: exercise.name,
    value: exercise.name,
  }));

  // Calculate total kcal burned for a plan (sum kcal/min * duration in minutes)
  const calculateTotalCalories = (plan: WorkoutPlan) => {
    const totalKcalPerMinute = plan.exercises.reduce(
      (sum, ex) => sum + ex.kcalBurned,
      0
    );
    return (totalKcalPerMinute * plan.durationSeconds) / 60;
  };

  const handleCreatePlan = () => {
    if (!planName || selectedExercises.length === 0) return;

    const durationSecondsNum = parseInt(durationInput, 10) * 60;
    if (isNaN(durationSecondsNum) || durationSecondsNum <= 0) return;

    const chosenExercises = exercises.filter((ex) =>
      selectedExercises.includes(ex.name)
    );

    const newPlan: WorkoutPlan = {
      id: nextId,
      name: planName,
      exercises: chosenExercises,
      durationSeconds: durationSecondsNum,
    };

    setWorkoutPlans((prev) => [...prev, newPlan]);
    setNextId((prev) => prev + 1);
    setPlanName("");
    setSelectedExercises([]);
    setDurationInput("");
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={workoutPlans}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.planContainer}>
            <Text style={styles.planTitle}>{item.name}</Text>
            <Text style={styles.durationText}>
              Duration: {(item.durationSeconds / 60).toFixed(1)} min
            </Text>
            <Text style={styles.caloriesText}>
              Estimated Calories Burned: {calculateTotalCalories(item).toFixed(2)} kcal
            </Text>
            {item.exercises.map((exercise, index) => (
              <Text key={index} style={styles.exerciseText}>
                • {exercise.name}
              </Text>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No workout plans created yet.</Text>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Workout Plan</Text>
            <TextInput
              placeholder="Plan Name"
              style={styles.input}
              value={planName}
              onChangeText={setPlanName}
            />

            <TextInput
              placeholder="Duration (minutes)"
              style={styles.input}
              value={durationInput}
              onChangeText={setDurationInput}
              keyboardType="numeric"
            />

            <DropDownPicker
              open={exercisePickerOpen}
              setOpen={setExercisePickerOpen}
              value={selectedExercises}
              setValue={setSelectedExercises}
              items={exerciseOptions}
              multiple={true}
              min={0}
              max={10}
              placeholder="Select Exercises"
              style={styles.dropdown}
              dropDownContainerStyle={{ zIndex: 999 }}
              zIndex={999}
              zIndexInverse={500}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleCreatePlan}>
              <Text style={styles.saveButtonText}>Save Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: "#f5f5f5",
  },
  planContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 3,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  caloriesText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#d9534f",
  },
  exerciseText: {
    fontSize: 14,
    marginLeft: 8,
    color: "#333",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: Platform.OS === "android" ? 80 : 40,
    right: 20,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  dropdown: {
    marginBottom: 16,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
  },
  cancelButton: {
    alignItems: "center",
    padding: 10,
  },
  cancelButtonText: {
    color: "#888",
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontSize: 16,
  },
});
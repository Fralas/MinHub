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
  Alert,
} from "react-native";
import { exercises, Exercise } from "./exerciseData";
import { workoutTemplates, WorkoutTemplate } from "./workoutTemplates";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";

type WorkoutPlan = {
  id: number;
  name: string;
  exercises: Exercise[];
  durationSeconds: number;
};

// Add this prop type if you're using navigation
interface WorkoutPlansScreenProps {
  navigation?: any; // Replace with proper navigation type if using React Navigation
  onNavigateToHistory?: () => void; // Alternative callback prop
}

export default function WorkoutPlansScreen({ navigation, onNavigateToHistory }: WorkoutPlansScreenProps = {}) {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [templatesModalVisible, setTemplatesModalVisible] = useState(false);
  const [planName, setPlanName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [durationInput, setDurationInput] = useState("");
  const [nextId, setNextId] = useState(1);

  // Template filtering states
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const [difficultyPickerOpen, setDifficultyPickerOpen] = useState(false);

  const exerciseOptions = exercises.map((exercise) => ({
    label: exercise.name,
    value: exercise.name,
  }));

  const goalOptions = [
    { label: "All Goals", value: "" },
    { label: "Strength", value: "strength" },
    { label: "Cardio", value: "cardio" },
    { label: "Weight Loss", value: "weight_loss" },
    { label: "Muscle Building", value: "muscle_building" },
  ];

  const difficultyOptions = [
    { label: "All Levels", value: "" },
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Advanced", value: "advanced" },
  ];

  // Handle navigation to workout history
  const handleNavigateToHistory = () => {
    if (navigation) {
      // If using React Navigation
      navigation.navigate('WorkoutHistory');
    } else if (onNavigateToHistory) {
      // If using callback prop
      onNavigateToHistory();
    } else {
      // Fallback alert
      Alert.alert('Navigation', 'Navigation to workout history would occur here');
    }
  };

  // Filter templates based on selected criteria
  const getFilteredTemplates = () => {
    return workoutTemplates.filter(template => {
      const goalMatch = !selectedGoal || template.goal === selectedGoal;
      const difficultyMatch = !selectedDifficulty || template.difficulty === selectedDifficulty;
      return goalMatch && difficultyMatch;
    });
  };

  const calculateTotalCalories = (plan: WorkoutPlan) => {
    const totalKcalPerMinute = plan.exercises.reduce(
      (sum, ex) => sum + ex.kcalBurned,
      0
    );
    return (totalKcalPerMinute * plan.durationSeconds) / 60;
  };

  const handleCreatePlan = () => {
    if (!planName || selectedExercises.length === 0) {
      Alert.alert("Error", "Please enter a plan name and select at least one exercise.");
      return;
    }

    const durationSecondsNum = parseInt(durationInput, 10) * 60;
    if (isNaN(durationSecondsNum) || durationSecondsNum <= 0) {
      Alert.alert("Error", "Please enter a valid duration in minutes.");
      return;
    }

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
    resetModalForm();
    setModalVisible(false);
  };

  const handleUseTemplate = (template: WorkoutTemplate) => {
    const templateExercises = exercises.filter((ex) =>
      template.exerciseNames.includes(ex.name)
    );

    const newPlan: WorkoutPlan = {
      id: nextId,
      name: template.name,
      exercises: templateExercises,
      durationSeconds: template.durationMinutes * 60,
    };

    setWorkoutPlans((prev) => [...prev, newPlan]);
    setNextId((prev) => prev + 1);
    setTemplatesModalVisible(false);
    Alert.alert("Success", `"${template.name}" has been added to your workout plans!`);
  };

  const resetModalForm = () => {
    setPlanName("");
    setSelectedExercises([]);
    setDurationInput("");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#999';
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'strength': return 'barbell-outline';
      case 'cardio': return 'heart-outline';
      case 'weight_loss': return 'flame-outline';
      case 'muscle_building': return 'body-outline';
      default: return 'fitness-outline';
    }
  };

  const renderTemplate = ({ item }: { item: WorkoutTemplate }) => (
    <TouchableOpacity 
      style={styles.templateContainer}
      onPress={() => handleUseTemplate(item)}
    >
      <View style={styles.templateHeader}>
        <View style={styles.templateTitleRow}>
          <Ionicons name={getGoalIcon(item.goal) as any} size={24} color="#4CAF50" />
          <Text style={styles.templateTitle}>{item.name}</Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
          <Text style={styles.difficultyText}>{item.difficulty.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.templateDescription}>{item.description}</Text>
      <Text style={styles.templateDuration}>Duration: {item.durationMinutes} minutes</Text>
      <Text style={styles.templateExercises}>
        Exercises: {item.exerciseNames.slice(0, 3).join(", ")}
        {item.exerciseNames.length > 3 && ` +${item.exerciseNames.length - 3} more`}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with History Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout Plans</Text>
        <TouchableOpacity
          style={styles.historyHeaderButton}
          onPress={handleNavigateToHistory}
        >
          <Ionicons name="time-outline" size={24} color="white" />
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
      </View>

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
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workout plans created yet.</Text>
            <Text style={styles.emptySubText}>Create a custom plan or choose from our templates!</Text>
          </View>
        }
      />

      {/* Main Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.historyButton]}
          onPress={handleNavigateToHistory}
        >
          <Ionicons name="time-outline" size={24} color="white" />
          <Text style={styles.actionButtonText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.templatesButton]}
          onPress={() => setTemplatesModalVisible(true)}
        >
          <Ionicons name="library-outline" size={24} color="white" />
          <Text style={styles.actionButtonText}>Templates</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.actionButtonText}>Custom</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Workout Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Custom Workout</Text>
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
              <Text style={styles.saveButtonText}>Create Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                resetModalForm();
                setModalVisible(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Templates Modal */}
      <Modal visible={templatesModalVisible} animationType="slide">
        <View style={styles.templatesModalContainer}>
          <View style={styles.templatesHeader}>
            <Text style={styles.templatesTitle}>Workout Templates</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setTemplatesModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <View style={styles.filterRow}>
              <DropDownPicker
                open={goalPickerOpen}
                setOpen={setGoalPickerOpen}
                value={selectedGoal}
                setValue={setSelectedGoal}
                items={goalOptions}
                placeholder="Filter by Goal"
                style={[styles.filterDropdown, { flex: 1, marginRight: 8 }]}
                dropDownContainerStyle={{ zIndex: 1000 }}
                zIndex={1000}
              />
              <DropDownPicker
                open={difficultyPickerOpen}
                setOpen={setDifficultyPickerOpen}
                value={selectedDifficulty}
                setValue={setSelectedDifficulty}
                items={difficultyOptions}
                placeholder="Filter by Level"
                style={[styles.filterDropdown, { flex: 1, marginLeft: 8 }]}
                dropDownContainerStyle={{ zIndex: 999 }}
                zIndex={999}
              />
            </View>
          </View>

          <FlatList
            data={getFilteredTemplates()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTemplate}
            contentContainerStyle={styles.templatesListContainer}
            showsVerticalScrollIndicator={false}
          />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  historyHeaderButton: {
    backgroundColor: "#6C5CE7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  historyButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  planContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  durationText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
    color: "#666",
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
    marginBottom: 2,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubText: {
    textAlign: "center",
    color: "#bbb",
    fontSize: 14,
    marginTop: 8,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: Platform.OS === "android" ? 80 : 40,
    right: 20,
    gap: 12,
  },
  actionButton: {
    width: 80,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButton: {
    backgroundColor: "#4CAF50",
  },
  templatesButton: {
    backgroundColor: "#2196F3",
  },
  historyButton: {
    backgroundColor: "#6C5CE7",
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
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
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
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
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    padding: 10,
  },
  cancelButtonText: {
    color: "#888",
    fontSize: 16,
  },
  templatesModalContainer: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  templatesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  templatesTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#f8f9fa",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterDropdown: {
    borderColor: "#ddd",
    borderRadius: 8,
    minHeight: 40,
  },
  templatesListContainer: {
    padding: 20,
  },
  templateContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  templateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  templateTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  templateDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  templateDuration: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 4,
  },
  templateExercises: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
  },
});
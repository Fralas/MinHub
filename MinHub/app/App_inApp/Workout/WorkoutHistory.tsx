import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";
import { Exercise } from "./exerciseData";

export type WorkoutHistoryEntry = {
  id: number;
  workoutName: string;
  exercises: Exercise[];
  durationSeconds: number;
  completedDate: Date;
  actualDurationSeconds: number;
  caloriesBurned: number;
  notes?: string;
};

type WorkoutStats = {
  totalWorkouts: number;
  totalTimeMinutes: number;
  totalCaloriesBurned: number;
  averageWorkoutTime: number;
  mostFrequentExercise: string;
  currentStreak: number;
  longestStreak: number;
};

const WORKOUT_HISTORY_KEY = '@workout_history';

export default function WorkoutHistoryScreen() {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutHistoryEntry | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  //load AsyncStorage
  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      setIsLoading(true);
      const historyData = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      
      if (historyData) {
        const parsedHistory: WorkoutHistoryEntry[] = JSON.parse(historyData);
        const historyWithDates = parsedHistory.map(entry => ({
          ...entry,
          completedDate: new Date(entry.completedDate)
        }));
        
        historyWithDates.sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime());
        
        setWorkoutHistory(historyWithDates);
      } else {
        setWorkoutHistory([]);
      }
    } catch (error) {
      console.error('Error loading workout history:', error);
      Alert.alert('Error', 'Failed to load workout history');
      setWorkoutHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveWorkoutHistory = async (history: WorkoutHistoryEntry[]) => {
    try {
      await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving workout history:', error);
      Alert.alert('Error', 'Failed to save workout history');
    }
  };

  const addWorkoutToHistory = async (
    workoutName: string,
    exercises: Exercise[],
    plannedDurationSeconds: number,
    actualDurationSeconds: number,
    notes?: string
  ) => {
    try {
      const caloriesBurned = exercises.reduce((total, exercise) => 
        total + (exercise.kcalBurned * actualDurationSeconds / 60), 0
      );

      const newEntry: WorkoutHistoryEntry = {
        id: Date.now(),
        workoutName,
        exercises,
        durationSeconds: plannedDurationSeconds,
        completedDate: new Date(),
        actualDurationSeconds,
        caloriesBurned: Math.round(caloriesBurned),
        notes
      };

      const updatedHistory = [newEntry, ...workoutHistory];
      setWorkoutHistory(updatedHistory);
      await saveWorkoutHistory(updatedHistory);
      
      return true; 
    } catch (error) {
      console.error('Error adding workout to history:', error);
      Alert.alert('Error', 'Failed to save workout');
      return false;
    }
  };

  const deleteWorkout = async (workoutId: number) => {
    try {
      const updatedHistory = workoutHistory.filter(entry => entry.id !== workoutId);
      setWorkoutHistory(updatedHistory);
      await saveWorkoutHistory(updatedHistory);
      
      Alert.alert('Success', 'Workout deleted successfully');
    } catch (error) {
      console.error('Error deleting workout:', error);
      Alert.alert('Error', 'Failed to delete workout');
    }
  };

  const clearAllHistory = async () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all workout history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(WORKOUT_HISTORY_KEY);
              setWorkoutHistory([]);
              Alert.alert('Success', 'All workout history cleared');
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('Error', 'Failed to clear history');
            }
          }
        }
      ]
    );
  };

  const getFilteredHistory = () => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (filterPeriod) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return workoutHistory;
    }

    return workoutHistory.filter(entry => entry.completedDate >= cutoffDate);
  };

  const calculateStats = (): WorkoutStats => {
    const filteredHistory = getFilteredHistory();
    
    if (filteredHistory.length === 0) {
      return {
        totalWorkouts: 0,
        totalTimeMinutes: 0,
        totalCaloriesBurned: 0,
        averageWorkoutTime: 0,
        mostFrequentExercise: "None",
        currentStreak: 0,
        longestStreak: 0
      };
    }

    const totalTimeMinutes = filteredHistory.reduce((sum, entry) => 
      sum + (entry.actualDurationSeconds / 60), 0
    );

    const totalCaloriesBurned = filteredHistory.reduce((sum, entry) => 
      sum + entry.caloriesBurned, 0
    );

    //count most frequent exercise
    const exerciseCount: { [key: string]: number } = {};
    filteredHistory.forEach(entry => {
      entry.exercises.forEach(exercise => {
        exerciseCount[exercise.name] = (exerciseCount[exercise.name] || 0) + 1;
      });
    });

    const mostFrequentExercise = Object.entries(exerciseCount).length > 0
      ? Object.entries(exerciseCount).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : "None";

    //calculate streaks
    const sortedDates = filteredHistory
      .map(entry => entry.completedDate.toDateString())
      .filter((date, index, array) => array.indexOf(date) === index)
      .sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 2) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    
    const today = new Date().toDateString();
    const lastWorkoutDate = filteredHistory[0]?.completedDate.toDateString();
    const daysSinceLastWorkout = Math.floor(
      (new Date().getTime() - new Date(lastWorkoutDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    currentStreak = daysSinceLastWorkout <= 1 ? tempStreak : 0;

    return {
      totalWorkouts: filteredHistory.length,
      totalTimeMinutes: Math.round(totalTimeMinutes),
      totalCaloriesBurned: Math.round(totalCaloriesBurned),
      averageWorkoutTime: Math.round(totalTimeMinutes / filteredHistory.length),
      mostFrequentExercise,
      currentStreak,
      longestStreak
    };
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const handleWorkoutPress = (workout: WorkoutHistoryEntry) => {
    setSelectedWorkout(workout);
    setDetailsModalVisible(true);
  };

  const handleDeleteWorkout = (workoutId: number) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWorkout(workoutId)
        }
      ]
    );
  };

  const renderWorkoutItem = ({ item }: { item: WorkoutHistoryEntry }) => (
    <TouchableOpacity 
      style={styles.workoutItem}
      onPress={() => handleWorkoutPress(item)}
    >
      <View style={styles.workoutHeader}>
        <Text style={styles.workoutName}>{item.workoutName}</Text>
        <View style={styles.workoutHeaderRight}>
          <Text style={styles.workoutDate}>{formatDate(item.completedDate)}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteWorkout(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.workoutStats}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.statText}>{formatDuration(item.actualDurationSeconds)}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="flame-outline" size={16} color="#FF6B35" />
          <Text style={styles.statText}>{item.caloriesBurned} kcal</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="fitness-outline" size={16} color="#4CAF50" />
          <Text style={styles.statText}>{item.exercises.length} exercises</Text>
        </View>
      </View>
      
      {item.notes && (
        <Text style={styles.workoutNotes} numberOfLines={1}>
          "{item.notes}"
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderFilterButton = (period: 'week' | 'month' | 'all', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterPeriod === period && styles.filterButtonActive
      ]}
      onPress={() => setFilterPeriod(period)}
    >
      <Text style={[
        styles.filterButtonText,
        filterPeriod === period && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const stats = calculateStats();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading workout history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Stats Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout History</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => setStatsModalVisible(true)}
          >
            <Ionicons name="stats-chart-outline" size={24} color="white" />
          </TouchableOpacity>
          {workoutHistory.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearAllHistory}
            >
              <Ionicons name="trash-outline" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('week', 'This Week')}
        {renderFilterButton('month', 'This Month')}
        {renderFilterButton('all', 'All Time')}
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>{stats.totalWorkouts}</Text>
          <Text style={styles.quickStatLabel}>Workouts</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>{stats.totalTimeMinutes}m</Text>
          <Text style={styles.quickStatLabel}>Total Time</Text>
        </View>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatNumber}>{stats.totalCaloriesBurned}</Text>
          <Text style={styles.quickStatLabel}>Calories</Text>
        </View>
      </View>

      {/* Workout List */}
      <FlatList
        data={getFilteredHistory()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderWorkoutItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubText}>Complete your first workout to see it here!</Text>
          </View>
        }
      />

      {/* Workout Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedWorkout && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedWorkout.workoutName}</Text>
                  <TouchableOpacity
                    onPress={() => setDetailsModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalDate}>
                  {selectedWorkout.completedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>

                {/* Workout Stats */}
                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="time-outline" size={20} color="#4CAF50" />
                    <Text style={styles.modalStatText}>
                      Duration: {formatDuration(selectedWorkout.actualDurationSeconds)}
                    </Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="flame-outline" size={20} color="#FF6B35" />
                    <Text style={styles.modalStatText}>
                      Calories: {selectedWorkout.caloriesBurned} kcal
                    </Text>
                  </View>
                </View>

                {/* Exercises */}
                <Text style={styles.sectionTitle}>Exercises</Text>
                {selectedWorkout.exercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseItem}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseMuscles}>
                      {exercise.musclesTrained.join(", ")}
                    </Text>
                    <Text style={styles.exerciseCalories}>
                      ~{Math.round(exercise.kcalBurned * selectedWorkout.actualDurationSeconds / 60)} kcal
                    </Text>
                  </View>
                ))}

                {/* Notes */}
                {selectedWorkout.notes && (
                  <>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <Text style={styles.notesText}>{selectedWorkout.notes}</Text>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Stats Modal */}
      <Modal
        visible={statsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setStatsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Workout Statistics</Text>
              <TouchableOpacity
                onPress={() => setStatsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="trophy-outline" size={32} color="#FFD700" />
                  <Text style={styles.statCardNumber}>{stats.totalWorkouts}</Text>
                  <Text style={styles.statCardLabel}>Total Workouts</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="time-outline" size={32} color="#4CAF50" />
                  <Text style={styles.statCardNumber}>{stats.totalTimeMinutes}m</Text>
                  <Text style={styles.statCardLabel}>Total Time</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="flame-outline" size={32} color="#FF6B35" />
                  <Text style={styles.statCardNumber}>{stats.totalCaloriesBurned}</Text>
                  <Text style={styles.statCardLabel}>Calories Burned</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="speedometer-outline" size={32} color="#2196F3" />
                  <Text style={styles.statCardNumber}>{stats.averageWorkoutTime}m</Text>
                  <Text style={styles.statCardLabel}>Average Duration</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="fitness-outline" size={32} color="#9C27B0" />
                  <Text style={styles.statCardText}>{stats.mostFrequentExercise}</Text>
                  <Text style={styles.statCardLabel}>Favorite Exercise</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="calendar-outline" size={32} color="#FF5722" />
                  <Text style={styles.statCardNumber}>{stats.currentStreak}</Text>
                  <Text style={styles.statCardLabel}>Current Streak</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statsButton: {
    backgroundColor: "#4CAF50",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  clearButton: {
    backgroundColor: "#FF6B6B",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "white",
  },
  quickStats: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    marginRight: 8,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  quickStatLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  workoutItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  workoutHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  workoutDate: {
    fontSize: 14,
    color: "#666",
  },
  deleteButton: {
    padding: 4,
  },
  workoutStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  workoutNotes: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#888",
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalDate: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  modalStats: {
    marginBottom: 20,
  },
  modalStatItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalStatText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    marginTop: 8,
  },
  exerciseItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  exerciseMuscles: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  exerciseCalories: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "500",
  },
  notesText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statCardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
    textAlign: "center",
  },
  statCardLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
});
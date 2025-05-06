import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

const STORAGE_KEY = '@todoList_tasks_v2_en';

type FilterType = 'all' | 'active' | 'completed';

export default function TodoListScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState<string>('');

  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedTasks !== null) {
          setTasks(JSON.parse(savedTasks));
        }
      } catch (error) {
        console.error("Error loading tasks:", error);
        Alert.alert("Error", "Could not load saved tasks.");
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const saveTasks = async () => {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch (error)
        {
          console.error("Error saving tasks:", error);
          Alert.alert("Error", "Could not save tasks.");
        }
      };
      saveTasks();
    }
  }, [tasks, isLoading]);

  const handleAddTask = () => {
    if (newTaskText.trim() === '') return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
    setNewTaskText('');
    Keyboard.dismiss();
  };

  const handleToggleComplete = (id: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => {
            setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
            if (editingTaskId === id) {
                setEditingTaskId(null);
                setEditingTaskText('');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.text);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskText('');
  };

  const handleSaveEdit = () => {
    if (editingTaskText.trim() === '' || !editingTaskId) return;
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === editingTaskId ? { ...task, text: editingTaskText.trim() } : task
      )
    );
    setEditingTaskId(null);
    setEditingTaskText('');
    Keyboard.dismiss();
  };

  const filteredTasks = useMemo(() => {
    switch (currentFilter) {
      case 'active':
        return tasks.filter(task => !task.completed);
      case 'completed':
        return tasks.filter(task => task.completed);
      case 'all':
      default:
        return tasks;
    }
  }, [tasks, currentFilter]);

  const handleClearCompleted = () => {
    const completedTasksExist = tasks.some(task => task.completed);
    if (!completedTasksExist) {
        Alert.alert("No Tasks", "There are no completed tasks to delete.");
        return;
    }
    Alert.alert(
      "Clear Completed",
      "Are you sure you want to delete all completed tasks?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", onPress: () => {
            setTasks(prevTasks => prevTasks.filter(task => !task.completed));
          },
          style: 'destructive'
        }
      ]
    );
  };

  const renderTask = ({ item }: { item: Task }) => {
    if (item.id === editingTaskId) {
      return (
        <View style={styles.taskItemContainerEditing}>
          <TextInput
            style={styles.editInput}
            value={editingTaskText}
            onChangeText={setEditingTaskText}
            autoFocus={true}
            onBlur={handleCancelEdit}
          />
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity onPress={handleSaveEdit} style={[styles.editButton, styles.saveButton]}>
              <Text style={styles.editButtonText}>✔️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancelEdit} style={[styles.editButton, styles.cancelButton]}>
              <Text style={styles.editButtonText}>✖️</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.taskItemContainer}>
        <TouchableOpacity
          onPress={() => handleToggleComplete(item.id)}
          onLongPress={() => handleStartEdit(item)}
          style={styles.taskTextContainer}
        >
          <Text style={[styles.taskText, item.completed && styles.taskCompleted]}>
            {item.text}
          </Text>
        </TouchableOpacity>
        <View style={styles.taskActions}>
            <TouchableOpacity onPress={() => handleStartEdit(item)} style={styles.actionButton}>
                <Text>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteTask(item.id)} style={styles.actionButton}>
                <Text>🗑️</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centeredMessageContainer}>
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Super Todo List ✨</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New task..."
          value={newTaskText}
          onChangeText={setNewTaskText}
          onSubmitEditing={handleAddTask}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, currentFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setCurrentFilter('all')}>
          <Text style={[styles.filterButtonText, currentFilter === 'all' && styles.filterButtonTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, currentFilter === 'active' && styles.filterButtonActive]}
          onPress={() => setCurrentFilter('active')}>
          <Text style={[styles.filterButtonText, currentFilter === 'active' && styles.filterButtonTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, currentFilter === 'completed' && styles.filterButtonActive]}
          onPress={() => setCurrentFilter('completed')}>
          <Text style={[styles.filterButtonText, currentFilter === 'completed' && styles.filterButtonTextActive]}>Completed</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        style={styles.list}
        ListEmptyComponent={
            <View style={styles.centeredMessageContainer}>
                 <Text style={styles.emptyListText}>
                    {currentFilter === 'completed' ? "No completed tasks." :
                     currentFilter === 'active' ? "No active tasks. Well done!" :
                     "No tasks yet. Add one!"}
                </Text>
            </View>
        }
      />

      {tasks.some(task => task.completed) && (
        <TouchableOpacity style={styles.clearCompletedButton} onPress={handleClearCompleted}>
          <Text style={styles.clearCompletedButtonText}>Clear Completed</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 50,
    paddingHorizontal: 20,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    paddingVertical: 5,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
  },
  filterButtonText: {
    color: '#2c3e50',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  taskItemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  taskItemContainerEditing: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderColor: '#3498db',
    borderWidth: 1,
  },
  taskTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  taskText: {
    fontSize: 17,
    color: '#34495e',
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#95a5a6',
  },
  taskActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  editInput: {
    borderBottomWidth: 1,
    borderColor: '#3498db',
    paddingVertical: 8,
    fontSize: 17,
    marginBottom: 10,
    flex: 1,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#2ecc71',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  centeredMessageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 30,
  },
  loadingText: {
    fontSize: 18,
    color: '#34495e',
  },
  clearCompletedButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
    elevation: 2,
  },
  clearCompletedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
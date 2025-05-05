import AsyncStorage from '@react-native-async-storage/async-storage'; // Importa AsyncStorage
import React, { useEffect, useState } from 'react'; // Importa useEffect
import {
  Alert,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Interfaccia Task (invariata)
interface Task {
  id: string;
  text: string;
  completed: boolean;
}

// Chiave univoca per salvare/caricare i dati in AsyncStorage
const STORAGE_KEY = '@todoList_tasks';

export default function TodoListScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true); // Stato per indicare se stiamo caricando

  // Effetto per CARICARE le attività all'avvio
  useEffect(() => {
    const loadTasks = async () => {
      try {
        // Prova a leggere la stringa salvata da AsyncStorage
        const savedTasks = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedTasks !== null) {
          // Se c'è qualcosa, convertila da stringa JSON a array di Task
          setTasks(JSON.parse(savedTasks));
        }
      } catch (error) {
        console.error("Errore nel caricamento delle attività:", error);
        Alert.alert("Errore", "Impossibile caricare le attività salvate.");
      } finally {
        // Indipendentemente da successo o errore, abbiamo finito di caricare
        setIsLoading(false);
      }
    };

    loadTasks(); // Esegui la funzione di caricamento
  }, []); // L'array vuoto [] significa: esegui questo effetto SOLO una volta, quando il componente viene montato

  // Effetto per SALVARE le attività ogni volta che cambiano
  useEffect(() => {
    // Non salvare durante il caricamento iniziale
    if (!isLoading) {
       const saveTasks = async () => {
         try {
           // Converti l'array di Task in una stringa JSON
           const tasksString = JSON.stringify(tasks);
           // Salva la stringa in AsyncStorage
           await AsyncStorage.setItem(STORAGE_KEY, tasksString);
         } catch (error) {
           console.error("Errore nel salvataggio delle attività:", error);
           Alert.alert("Errore", "Impossibile salvare le attività.");
         }
       };
       saveTasks(); // Esegui la funzione di salvataggio
    }
  }, [tasks, isLoading]); // Questo effetto si attiva ogni volta che lo stato `tasks` o `isLoading` cambia

  // --- Le funzioni handleAddTask, handleToggleComplete, handleDeleteTask rimangono INVARIATE ---
  const handleAddTask = () => {
    if (newTaskText.trim() === '') {
      return;
    }
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
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
      "Conferma Eliminazione",
      "Sei sicuro di voler eliminare questa attività?",
      [
        { text: "Annulla", style: "cancel" },
        { text: "Elimina", onPress: () => {
            setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
          },
          style: 'destructive'
        }
      ]
    );
  };

  // --- La funzione renderTask rimane INVARIATA ---
  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskItemContainer}>
       <TouchableOpacity onPress={() => handleToggleComplete(item.id)} style={styles.taskTextContainer}>
          <Text style={[styles.taskText, item.completed && styles.taskCompleted]}>
            {item.text}
          </Text>
       </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteTask(item.id)} style={styles.deleteButton}>
             <Text style={styles.deleteButtonText}>❌</Text>
        </TouchableOpacity>
    </View>
  );

  // Se stiamo ancora caricando i dati, mostra un messaggio
  if (isLoading) {
      return (
          <View style={styles.container}>
              <Text style={styles.loadingText}>Caricamento attività...</Text>
          </View>
      )
  }

  // --- La parte return JSX rimane quasi invariata, tranne per l'aggiunta del controllo isLoading sopra ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>La Mia Todo List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Aggiungi una nuova attività..."
          value={newTaskText}
          onChangeText={setNewTaskText}
          onSubmitEditing={handleAddTask}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <Text style={styles.addButtonText}>Aggiungi</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyListText}>Nessuna attività ancora!</Text>}
      />
    </View>
  );
}

// --- Gli stili rimangono quasi invariati, aggiungiamo solo lo stile per il testo di caricamento ---
const styles = StyleSheet.create({
  // ... (tutti gli stili precedenti)
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: '#f4f4f4',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
   taskItemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  taskTextContainer: {
      flex: 1,
      marginRight: 10,
  },
  taskText: {
    fontSize: 16,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  deleteButton: {
      padding: 5,
  },
  deleteButtonText: {
      fontSize: 18,
      color: 'red',
  },
  emptyListText: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
      color: '#666',
  },
  loadingText: { // Nuovo stile per il messaggio di caricamento
    textAlign: 'center',
    marginTop: 100,
    fontSize: 18,
    color: '#333',
  }
});
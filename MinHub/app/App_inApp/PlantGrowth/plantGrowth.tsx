import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import * as Progress from 'react-native-progress';

type PlantStage = 'seed' | 'sprout' | 'seedling' | 'young_plant' | 'mature_plant' | 'flowering_plant' | 'fruiting_plant';
const PLANT_STAGES: PlantStage[] = ['seed', 'sprout', 'seedling', 'young_plant', 'mature_plant', 'flowering_plant', 'fruiting_plant'];
const POINTS_TO_NEXT_STAGE: Record<PlantStage, number> = {
  seed: 50,
  sprout: 100,
  seedling: 200,
  young_plant: 350,
  mature_plant: 500,
  flowering_plant: 700,
  fruiting_plant: Infinity,
};

const PLANT_IMAGES: Record<PlantStage, any> = {
  seed: require('../../../assets/images/plantIMG/s1.png'),
  sprout: require('../../../assets/images/plantIMG/s2.png'),
  seedling: require('../../../assets/images/plantIMG/s3.png'),
  young_plant: require('../../../assets/images/plantIMG/s4.png'),
  mature_plant: require('../../../assets/images/plantIMG/s5.png'),
  flowering_plant: require('../../../assets/images/plantIMG/s6.png'),
  fruiting_plant: require('../../../assets/images/plantIMG/s6.png'),
};

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

const GROWTH_POINTS_PER_TASK_COMPLETION = 20;

interface PlantState {
  plantId: string;
  plantName: string;
  currentStage: PlantStage;
  growthPoints: number;
  lastWateredTimestamp: string | null;
  lastFertilizedTimestamp: string | null;
  totalDaysGrown: number;
  happinessLevel: number;
  themePreference: 'light' | 'dark' | 'forest';
  soilMoistureLevel: number;
  tasks: Task[];
}

const PLANT_STATE_STORAGE_KEY = '@minhub_productivePlantState_v1';

const WATERING_COOLDOWN_MS = 5 * 1000;
const GROWTH_POINTS_PER_WATERING = 5;
const FERTILIZING_COOLDOWN_MS = 10 * 1000;
const GROWTH_POINTS_PER_FERTILIZING = 10;
const HAPPINESS_BOOST_FERTILIZING = 15;

const initializePlantStateHelper = (): PlantState => {
    return {
      plantId: `plant_${Date.now()}`,
      plantName: 'My Productive Sprout',
      currentStage: 'seed',
      growthPoints: 0,
      lastWateredTimestamp: null,
      lastFertilizedTimestamp: null,
      totalDaysGrown: 0,
      happinessLevel: 75,
      themePreference: 'forest',
      soilMoistureLevel: 0.5,
      tasks: [],
    };
};

export default function PlantGrowthScreen() {
  const [plantState, setPlantState] = useState<PlantState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastActionMessage, setLastActionMessage] = useState<string>('');
  const [screenRenderCount, setScreenRenderCount] = useState<number>(0);
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [newPlantNameInput, setNewPlantNameInput] = useState<string>('');

  useEffect(() => {
    if (plantState && newPlantNameInput === '') {
        setNewPlantNameInput(plantState.plantName);
    }
  }, [plantState]);

  useEffect(() => {
    setScreenRenderCount(prev => prev + 1);
  }, [plantState]);

  const loadPlantState = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedState = await AsyncStorage.getItem(PLANT_STATE_STORAGE_KEY);
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        if (!parsedState.tasks) {
            parsedState.tasks = [];
        }
        setPlantState(parsedState);
        setNewPlantNameInput(parsedState.plantName || 'My Productive Sprout');
      } else {
        const initialPlant = initializePlantStateHelper();
        setPlantState(initialPlant);
        setNewPlantNameInput(initialPlant.plantName);
        await AsyncStorage.setItem(PLANT_STATE_STORAGE_KEY, JSON.stringify(initialPlant));
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile caricare i dati.');
      const fallbackPlant = initializePlantStateHelper();
      setPlantState(fallbackPlant);
      setNewPlantNameInput(fallbackPlant.plantName);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect( useCallback(() => { loadPlantState(); }, [loadPlantState]) );

  const savePlantState = async (newState: PlantState) => {
    try {
      await AsyncStorage.setItem(PLANT_STATE_STORAGE_KEY, JSON.stringify(newState));
      setPlantState(newState);
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare i dati.');
    }
  };

  const applyGrowthAndStageCheck = (currentPlantState: PlantState, pointsEarned: number, actionMessage: string): Partial<PlantState> & { feedbackMessage: string } => {
    let newPoints = currentPlantState.growthPoints + pointsEarned;
    let newStage = currentPlantState.currentStage;
    let feedbackMessage = actionMessage;

    if (newStage !== 'fruiting_plant' && newPoints >= POINTS_TO_NEXT_STAGE[newStage]) {
      const pointsForCurrentStage = POINTS_TO_NEXT_STAGE[newStage];
      newPoints -= pointsForCurrentStage;
      const currentStageIndex = PLANT_STAGES.indexOf(newStage);
      if (currentStageIndex < PLANT_STAGES.length - 1) {
        newStage = PLANT_STAGES[currentStageIndex + 1];
        feedbackMessage = `Wow! ${currentPlantState.plantName} è cresciuta allo stadio: ${newStage.replace(/_/g, ' ')}!`;
      }
    }
    return { growthPoints: newPoints, currentStage: newStage, feedbackMessage };
  };

  const handleCareAction = (
    actionType: 'water' | 'fertilize',
    pointsToAdd: number,
    cooldownMs: number,
    lastActionTimestampKey: 'lastWateredTimestamp' | 'lastFertilizedTimestamp',
    actionName: string
  ) => {
    if (!plantState) return;
    setLastActionMessage('');

    const now = Date.now();
    const lastActionTimestamp = plantState[lastActionTimestampKey];

    if (lastActionTimestamp) {
      const lastActionDate = new Date(lastActionTimestamp).getTime();
      if (now - lastActionDate < cooldownMs) {
        const remainingTime = cooldownMs - (now - lastActionDate);
        const hoursRemaining = Math.floor(remainingTime / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        const secondsRemaining = Math.floor((remainingTime % (1000 * 60)) / 1000);
        let alertMsg = `Puoi ${actionName.toLowerCase()} di nuovo tra `;
        if (hoursRemaining > 0) alertMsg += `${hoursRemaining}h ${minutesRemaining}m.`;
        else if (minutesRemaining > 0) alertMsg += `${minutesRemaining}m ${secondsRemaining}s.`;
        else alertMsg += `${secondsRemaining}s.`;
        Alert.alert('Troppo Presto!', alertMsg);
        setLastActionMessage(`${actionName} tentato troppo presto.`);
        return;
      }
    }

    const growthResult = applyGrowthAndStageCheck(plantState, pointsToAdd, `${actionName} ${plantState.plantName}! (+${pointsToAdd} pt).`);

    let updatedHappiness = plantState.happinessLevel;
    let updatedSoilMoisture = plantState.soilMoistureLevel;

    if (actionType === 'water') {
      updatedHappiness = Math.min(100, plantState.happinessLevel + 5);
      updatedSoilMoisture = Math.min(1, plantState.soilMoistureLevel + 0.20);
    } else if (actionType === 'fertilize') {
      updatedHappiness = Math.min(100, plantState.happinessLevel + HAPPINESS_BOOST_FERTILIZING);
    }

    const oldDate = plantState[lastActionTimestampKey] ? new Date(plantState[lastActionTimestampKey]!) : null;
    const currentDate = new Date();
    const newDayHasPassed = oldDate ? oldDate.toDateString() !== currentDate.toDateString() : true;

    const newState: PlantState = {
      ...plantState,
      growthPoints: growthResult.growthPoints!,
      currentStage: growthResult.currentStage!,
      happinessLevel: updatedHappiness,
      soilMoistureLevel: updatedSoilMoisture,
      [lastActionTimestampKey]: new Date().toISOString(),
      totalDaysGrown: plantState.totalDaysGrown + (newDayHasPassed ? 1 : 0),
    };
    savePlantState(newState);
    Alert.alert(`${actionName}!`, growthResult.feedbackMessage!);
    setLastActionMessage(growthResult.feedbackMessage!);
  };

  const handleWaterPlant = () => handleCareAction('water',GROWTH_POINTS_PER_WATERING, WATERING_COOLDOWN_MS, 'lastWateredTimestamp', 'Annaffiato');
  const handleFertilizePlant = () => handleCareAction('fertilize', GROWTH_POINTS_PER_FERTILIZING, FERTILIZING_COOLDOWN_MS, 'lastFertilizedTimestamp', 'Fertilizzato');

  const handleAddTask = () => {
    if (!plantState || newTaskText.trim() === '') {
      Alert.alert('Testo Vuoto', 'Per favore inserisci una descrizione per la task.');
      return;
    }
    const newTask: Task = {
      id: `task_${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [...plantState.tasks, newTask];
    savePlantState({ ...plantState, tasks: updatedTasks });
    setNewTaskText('');
    setLastActionMessage(`Task "${newTask.text}" aggiunta!`);
  };

  const handleToggleTaskCompletion = (taskId: string) => {
    if (!plantState) return;
    let taskCompletedText = '';
    const updatedTasks = plantState.tasks.map(task => {
      if (task.id === taskId) {
        if (!task.completed) taskCompletedText = task.text;
        return { ...task, completed: !task.completed };
      }
      return task;
    });

    if (taskCompletedText) {
      const growthResult = applyGrowthAndStageCheck(plantState, GROWTH_POINTS_PER_TASK_COMPLETION, `Task "${taskCompletedText}" completata! (+${GROWTH_POINTS_PER_TASK_COMPLETION} pt).`);
      const updatedHappiness = Math.min(100, plantState.happinessLevel + 5);

      savePlantState({
        ...plantState,
        tasks: updatedTasks,
        growthPoints: growthResult.growthPoints!,
        currentStage: growthResult.currentStage!,
        happinessLevel: updatedHappiness,
      });
      Alert.alert('Task Completata!', growthResult.feedbackMessage!);
      setLastActionMessage(growthResult.feedbackMessage!);
    } else {
      savePlantState({ ...plantState, tasks: updatedTasks });
      const task = plantState.tasks.find(t => t.id === taskId);
      if (task) setLastActionMessage(`Task "${task.text}" aggiornata.`);
    }
  };

  const handleRenamePlant = () => {
    if (!plantState || newPlantNameInput.trim() === '') {
      Alert.alert('Nome Vuoto', 'Per favore inserisci un nome per la pianta.');
      return;
    }
    const newName = newPlantNameInput.trim();
    savePlantState({ ...plantState, plantName: newName });
    Alert.alert('Nome Aggiornato!', `La tua pianta ora si chiama ${newName}.`);
    setLastActionMessage(`Nome pianta aggiornato a: ${newName}`);
  };

  const handleResetPlant = () => {
    Alert.alert( "Resetta Pianta", "Sei sicuro? Tutti i progressi e le task andranno persi.",
      [ { text: "Annulla", style: "cancel" },
        { text: "Resetta", style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(PLANT_STATE_STORAGE_KEY);
              setLastActionMessage('Pianta resettata.');
              await loadPlantState();
            } catch (error) {
              Alert.alert('Errore', 'Impossibile resettare.');
            }
          }
        }
      ], { cancelable: true }
    );
  };

  const getPlantImage = () => {
    if (!plantState) {
      return PLANT_IMAGES.seed;
    }
    const image = PLANT_IMAGES[plantState.currentStage];
    if (!image) {
      return PLANT_IMAGES.seed;
    }
    return image;
  };

  const calculateProgressToNextStage = (): number => {
    if (!plantState || plantState.currentStage === 'fruiting_plant') return 1;
    const pointsNeeded = POINTS_TO_NEXT_STAGE[plantState.currentStage];
    if (pointsNeeded <= 0 || pointsNeeded === Infinity) return 1;
    return Math.max(0, Math.min(1, plantState.growthPoints / pointsNeeded));
  };

  if (isLoading || !plantState) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ECC71" />
        <Text style={styles.loadingText}>Coltivando la tua pianta...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Stack.Screen options={{ headerTitle: plantState.plantName }} />
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.plantDisplayArea}>
          <Image source={getPlantImage()} style={styles.plantImageStyle} resizeMode="contain" />
          <Text style={styles.plantStageText}>Stadio: {plantState.currentStage.replace(/_/g, ' ')}</Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Progresso Crescita</Text>
          <Progress.Bar
            progress={calculateProgressToNextStage()}
            width={Dimensions.get('window').width * 0.8}
            height={15}
            color={'#34D399'}
            unfilledColor={'#E5E7EB'}
            borderColor={'#D1D5DB'}
            borderWidth={1}
            borderRadius={8}
            style={styles.progressBar}
          />
          <Text style={styles.pointsText}>
            Punti: {plantState.growthPoints} / {plantState.currentStage === 'fruiting_plant' ? 'Max' : POINTS_TO_NEXT_STAGE[plantState.currentStage]}
          </Text>
        </View>

        <View style={styles.renamePlantSection}>
            <TextInput
                style={styles.inputField}
                placeholder="Nome della tua pianta"
                value={newPlantNameInput}
                onChangeText={setNewPlantNameInput}
            />
            <TouchableOpacity style={styles.actionButtonSmall} onPress={handleRenamePlant}>
                <Text style={styles.actionButtonSmallText}>Salva Nome</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.taskSection}>
          <Text style={styles.sectionTitle}>Le Tue Task Produttive</Text>
          <View style={styles.taskInputContainer}>
            <TextInput
              style={styles.inputField}
              placeholder="Nuova task..."
              value={newTaskText}
              onChangeText={setNewTaskText}
            />
            <TouchableOpacity style={styles.actionButtonSmall} onPress={handleAddTask}>
              <Text style={styles.actionButtonSmallText}>Aggiungi</Text>
            </TouchableOpacity>
          </View>
          {plantState.tasks.length === 0 ? (
            <Text style={styles.noTasksText}>Nessuna task ancora. Aggiungine una!</Text>
          ) : (
            <FlatList
              data={plantState.tasks.sort((a,b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.taskItem, item.completed && styles.taskItemCompleted]}
                  onPress={() => handleToggleTaskCompletion(item.id)}
                >
                  <Text style={[styles.taskText, item.completed && styles.taskTextCompleted]}>
                    {item.completed ? '✓ ' : '○ '} {item.text}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.taskList}
            />
          )}
        </View>

        <View style={styles.careSection}>
            <Text style={styles.sectionTitle}>Cura della Pianta</Text>
            <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleWaterPlant}>
            <Text style={styles.actionButtonText}>Annaffia ({GROWTH_POINTS_PER_WATERING} pt)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonFertilize} onPress={handleFertilizePlant}>
            <Text style={styles.actionButtonText}>Fertilizza ({GROWTH_POINTS_PER_FERTILIZING} pt)</Text>
            </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionButtonDestructive} onPress={handleResetPlant}>
          <Text style={styles.actionButtonText}>Resetta Pianta</Text>
        </TouchableOpacity>

        {lastActionMessage !== '' && (
            <Text style={styles.feedbackMessageText}>{lastActionMessage}</Text>
        )}

        <View style={styles.uselessStatsSection}>
            <Text style={styles.uselessStatText}>Felicità: {plantState.happinessLevel}%</Text>
            <Text style={styles.uselessStatText}>Umidità Suolo: {(plantState.soilMoistureLevel * 100).toFixed(0)}%</Text>
            <Text style={styles.uselessStatText}>Giorni Totali Crescita: {plantState.totalDaysGrown}</Text>
        </View>

        <View style={styles.deviceInfoFooter}>
            <Text style={styles.deviceInfoText}>{`Platform: ${Platform.OS}, v${Platform.Version}, Screen: ${Dimensions.get('window').width}x${Dimensions.get('window').height}`}</Text>
            <Text style={styles.deviceInfoText}>Render Count: {screenRenderCount}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#E6FFFA',
  },
  scrollContentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#065F46',
  },
  plantDisplayArea: {
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  plantImageStyle: {
    width: Dimensions.get('window').width * 0.6,
    height: Dimensions.get('window').width * 0.6,
    marginBottom: 15,
  },
  plantStageText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#065F46',
    textTransform: 'capitalize',
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 25,
    width: '90%',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#047857',
    marginBottom: 10,
  },
  progressBar: {
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 14,
    color: '#065F46',
  },
  actionButtonPrimary: {
    backgroundColor: '#10B981', 
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
    width: '85%',
    alignItems: 'center',
    elevation: 3,
  },
  actionButtonFertilize: { 
    backgroundColor: '#F59E0B', 
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
    width: '85%',
    alignItems: 'center',
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonSecondary: {
    backgroundColor: '#A7F3D0',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  actionButtonTextSecondary: {
      color: '#065F46',
      fontSize: 15,
      fontWeight: '500',
  },
  actionButtonDestructive: {
    backgroundColor: '#EF4444',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
    width: '85%',
    alignItems: 'center',
    elevation: 3,
  },
  feedbackMessageText: {
    marginTop: 15,
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  uselessStatsSection: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#F0FFF4',
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
  },
  uselessStatText: {
    fontSize: 12,
    color: '#057A55',
    marginBottom: 4,
  },
  deviceInfoFooter: {
      marginTop: 20, 
      paddingBottom: 10,
      alignItems: 'center',
      paddingVertical: 5,
  },
  deviceInfoText: {
      fontSize: 9,
      color: '#A0AEC0',
  }
});

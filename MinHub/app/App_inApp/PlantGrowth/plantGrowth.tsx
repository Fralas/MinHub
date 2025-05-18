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

type TaskSize = 'small' | 'medium' | 'large';
const TASK_SIZE_OPTIONS: TaskSize[] = ['small', 'medium', 'large'];

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  size: TaskSize;
  points: number;
}

const TASK_POINTS: Record<TaskSize, number> = {
    small: 10,
    medium: 20,
    large: 30,
};

const GROWTH_POINTS_DAILY_CHECKIN = 5;
const GROWTH_POINTS_PRODUCTIVE_WATERING = 35;
const MAX_STREAK_BONUS = 15;

interface PlantState {
  plantId: string;
  plantName: string;
  currentStage: PlantStage;
  growthPoints: number;
  lastWateredTimestamp: string | null;
  lastFertilizedTimestamp: string | null;
  lastProductiveWateringDate: string | null;
  totalDaysGrown: number;
  happinessLevel: number;
  themePreference: 'light' | 'dark' | 'forest';
  soilMoistureLevel: number;
  tasks: Task[];
  lastCheckInDate: string | null;
  productiveStreak: number;
}

const PLANT_STATE_STORAGE_KEY = '@minhub_productivePlantState_v5';

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
      lastProductiveWateringDate: null,
      totalDaysGrown: 0,
      happinessLevel: 75,
      themePreference: 'forest',
      soilMoistureLevel: 0.5,
      tasks: [],
      lastCheckInDate: null,
      productiveStreak: 0,
    };
};

export default function PlantGrowthScreen() {
  const [plantState, setPlantState] = useState<PlantState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastActionMessage, setLastActionMessage] = useState<string>('');
  const [screenRenderCount, setScreenRenderCount] = useState<number>(0);
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [newTaskSize, setNewTaskSize] = useState<TaskSize>('medium');
  const [newPlantNameInput, setNewPlantNameInput] = useState<string>('');

  useEffect(() => {
    setScreenRenderCount(prev => prev + 1);
  }, [plantState]);

  const applyGrowthAndStageCheck = useCallback((currentPlantState: PlantState, pointsEarned: number, baseMessage: string): Partial<PlantState> & { feedbackMessage: string } => {
    let newPoints = currentPlantState.growthPoints + pointsEarned;
    let newStage = currentPlantState.currentStage;
    let feedbackMessage = `${baseMessage} (+${pointsEarned} pt).`;

    if (newStage !== 'fruiting_plant' && newPoints >= POINTS_TO_NEXT_STAGE[newStage]) {
      const pointsForCurrentStage = POINTS_TO_NEXT_STAGE[newStage];
      newPoints -= pointsForCurrentStage;
      const currentStageIndex = PLANT_STAGES.indexOf(newStage);
      if (currentStageIndex < PLANT_STAGES.length - 1) {
        newStage = PLANT_STAGES[currentStageIndex + 1];
        feedbackMessage = `Wow! ${currentPlantState.plantName} è cresciuta allo stadio: ${newStage.replace(/_/g, ' ')}! (Bonus: +${pointsEarned} pt).`;
      }
    }
    return { growthPoints: newPoints, currentStage: newStage, feedbackMessage };
  }, []);

  const loadPlantState = useCallback(async () => {
    setIsLoading(true);
    let plantDataToSet: PlantState | null = null;
    let messageForUI = '';

    try {
      const storedState = await AsyncStorage.getItem(PLANT_STATE_STORAGE_KEY);
      let tempPlantState: PlantState;
      const defaultInitialState = initializePlantStateHelper();

      if (storedState) {
        const parsedJson = JSON.parse(storedState) as Partial<PlantState>;
        tempPlantState = {
            ...defaultInitialState,
            plantId: parsedJson.plantId || defaultInitialState.plantId,
            plantName: parsedJson.plantName || defaultInitialState.plantName,
            currentStage: (parsedJson.currentStage && PLANT_STAGES.includes(parsedJson.currentStage)) ? parsedJson.currentStage : defaultInitialState.currentStage,
            growthPoints: typeof parsedJson.growthPoints === 'number' ? parsedJson.growthPoints : defaultInitialState.growthPoints,
            lastWateredTimestamp: parsedJson.lastWateredTimestamp || null,
            lastFertilizedTimestamp: parsedJson.lastFertilizedTimestamp || null,
            lastProductiveWateringDate: parsedJson.lastProductiveWateringDate || null,
            totalDaysGrown: typeof parsedJson.totalDaysGrown === 'number' ? parsedJson.totalDaysGrown : defaultInitialState.totalDaysGrown,
            happinessLevel: typeof parsedJson.happinessLevel === 'number' && parsedJson.happinessLevel >= 0 && parsedJson.happinessLevel <= 100 ? parsedJson.happinessLevel : defaultInitialState.happinessLevel,
            themePreference: parsedJson.themePreference || defaultInitialState.themePreference,
            soilMoistureLevel: typeof parsedJson.soilMoistureLevel === 'number' && parsedJson.soilMoistureLevel >=0 && parsedJson.soilMoistureLevel <=1 ? parsedJson.soilMoistureLevel : defaultInitialState.soilMoistureLevel,
            lastCheckInDate: parsedJson.lastCheckInDate || null,
            productiveStreak: typeof parsedJson.productiveStreak === 'number' ? parsedJson.productiveStreak : defaultInitialState.productiveStreak,
            tasks: [],
        };

        if (parsedJson.tasks && Array.isArray(parsedJson.tasks)) {
            tempPlantState.tasks = parsedJson.tasks.map((task: any): Task => {
                let determinedSize: TaskSize = 'medium';
                if (typeof task.size === 'string' && TASK_SIZE_OPTIONS.includes(task.size as TaskSize)) {
                    determinedSize = task.size as TaskSize;
                }
                const pointsForTask = Number(task.points) || TASK_POINTS[determinedSize];
                return {
                    id: String(task.id || `task_${Date.now()}_${Math.random().toString(16).slice(2)}`),
                    text: String(task.text || "Task Senza Titolo"),
                    completed: Boolean(task.completed || false),
                    createdAt: String(task.createdAt || new Date().toISOString()),
                    size: determinedSize,
                    points: pointsForTask,
                };
            });
        }
      } else {
        tempPlantState = defaultInitialState;
      }

      const todayString = new Date().toDateString();
      if (tempPlantState.lastCheckInDate !== todayString) {
        const growthResult = applyGrowthAndStageCheck(tempPlantState, GROWTH_POINTS_DAILY_CHECKIN, `Bonus check-in giornaliero per ${tempPlantState.plantName}!`);
        tempPlantState = {
          ...tempPlantState,
          growthPoints: growthResult.growthPoints!,
          currentStage: growthResult.currentStage!,
          lastCheckInDate: todayString,
          happinessLevel: Math.min(100, tempPlantState.happinessLevel + 5),
        };
        messageForUI = growthResult.feedbackMessage;
        await AsyncStorage.setItem(PLANT_STATE_STORAGE_KEY, JSON.stringify(tempPlantState));
      }
      plantDataToSet = tempPlantState;
      setNewPlantNameInput(tempPlantState.plantName || defaultInitialState.plantName);

    } catch (error) {
      Alert.alert('Errore', 'Impossibile caricare i dati della pianta.');
      plantDataToSet = initializePlantStateHelper();
      setNewPlantNameInput(plantDataToSet.plantName);
       await AsyncStorage.setItem(PLANT_STATE_STORAGE_KEY, JSON.stringify(plantDataToSet));
    } finally {
      if (plantDataToSet) {
        setPlantState(plantDataToSet);
      }
      if (messageForUI) {
        setLastActionMessage(messageForUI);
      }
      setIsLoading(false);
    }
  }, [applyGrowthAndStageCheck]);


  useFocusEffect( useCallback(() => { loadPlantState(); }, [loadPlantState]) );

  const savePlantState = async (newState: PlantState) => {
    try {
      await AsyncStorage.setItem(PLANT_STATE_STORAGE_KEY, JSON.stringify(newState));
      setPlantState(newState);
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare i dati della pianta.');
    }
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

    const growthResult = applyGrowthAndStageCheck(plantState, pointsToAdd, `${actionName} ${plantState.plantName}!`);
    let updatedHappiness = plantState.happinessLevel;
    let updatedSoilMoisture = plantState.soilMoistureLevel;

    if (actionType === 'water') {
      updatedHappiness = Math.min(100, plantState.happinessLevel + 5);
      updatedSoilMoisture = Math.min(1, plantState.soilMoistureLevel + 0.20);
    } else if (actionType === 'fertilize') {
      updatedHappiness = Math.min(100, plantState.happinessLevel + HAPPINESS_BOOST_FERTILIZING);
    }

    const newState: PlantState = {
      ...plantState,
      growthPoints: growthResult.growthPoints!,
      currentStage: growthResult.currentStage!,
      happinessLevel: updatedHappiness,
      soilMoistureLevel: updatedSoilMoisture,
      [lastActionTimestampKey]: new Date().toISOString(),
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
      id: `task_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      size: newTaskSize,
      points: TASK_POINTS[newTaskSize],
    };
    const updatedTasks = [...plantState.tasks, newTask];
    savePlantState({ ...plantState, tasks: updatedTasks });
    setNewTaskText('');
    setLastActionMessage(`Task "${newTask.text}" (${newTaskSize}) aggiunta!`);
  };

  const handleToggleTaskCompletion = (taskId: string) => {
    if (!plantState) return;
    let taskJustCompletedObject: Task | undefined;

    const updatedTasks = plantState.tasks.map(task => {
      if (task.id === taskId) {
        const isNowCompleting = !task.completed;
        if (isNowCompleting) {
            taskJustCompletedObject = task;
        }
        return { ...task, completed: !task.completed };
      }
      return task;
    });

    if (taskJustCompletedObject) {
      const pointsEarned = taskJustCompletedObject.points;
      const taskText = taskJustCompletedObject.text;
      const taskSize = taskJustCompletedObject.size;

      const growthResult = applyGrowthAndStageCheck(plantState, pointsEarned, `Task "${taskText}" (${taskSize}) completata!`);
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
      const task = updatedTasks.find(t => t.id === taskId);
      if (task) {
         setLastActionMessage(`Task "${task.text}" segnata come non completata.`);
      }
    }
  };

  const handleProductiveWatering = () => {
    if (!plantState) return;

    const allTasksDone = plantState.tasks.length > 0 && plantState.tasks.every(t => t.completed);
    const todayStr = new Date().toDateString();

    if (!allTasksDone) {
        Alert.alert("Task Incomplete", "Devi prima completare tutte le tue task per la super annaffiatura!");
        setLastActionMessage("Completa tutte le task per il bonus giornaliero.");
        return;
    }
    if (plantState.lastProductiveWateringDate === todayStr) {
        Alert.alert("Già Fatto!", "Hai già ricevuto il bonus produttività per oggi.");
        setLastActionMessage("Bonus produttività giornaliero già ricevuto.");
        return;
    }

    let currentStreak = plantState.productiveStreak || 0;
    let newStreak = 0;
    let streakBonusPoints = 0;
    let streakMessage = "";

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (plantState.lastProductiveWateringDate === yesterdayStr) {
        newStreak = currentStreak + 1;
    } else {
        newStreak = 1;
    }
    streakBonusPoints = newStreak > 1 ? Math.min(MAX_STREAK_BONUS, newStreak * 2) : 0;
    if (newStreak > 1) {
        streakMessage = ` Serie di ${newStreak} giorni produttivi! +${streakBonusPoints} punti extra!`;
    }

    const totalPointsEarned = GROWTH_POINTS_PRODUCTIVE_WATERING + streakBonusPoints;
    const growthResult = applyGrowthAndStageCheck(plantState, totalPointsEarned, `Super Annaffiatura Giornaliera per ${plantState.plantName}!`);
    const updatedHappiness = Math.min(100, plantState.happinessLevel + 20 + (newStreak > 1 ? 5 : 0));

    const newState: PlantState = {
        ...plantState,
        growthPoints: growthResult.growthPoints!,
        currentStage: growthResult.currentStage!,
        happinessLevel: updatedHappiness,
        lastProductiveWateringDate: todayStr,
        productiveStreak: newStreak,
        totalDaysGrown: plantState.totalDaysGrown + 1,
    };
    savePlantState(newState);
    Alert.alert("Bonus Giornaliero!", growthResult.feedbackMessage! + streakMessage);
    setLastActionMessage(growthResult.feedbackMessage! + streakMessage);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!plantState) return;
    const taskToDelete = plantState.tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    Alert.alert(
        "Elimina Task",
        `Sei sicuro di voler eliminare la task "${taskToDelete.text}"?`,
        [
            { text: "Annulla", style: "cancel" },
            {
                text: "Elimina", style: "destructive",
                onPress: () => {
                    const updatedTasks = plantState.tasks.filter(task => task.id !== taskId);
                    savePlantState({ ...plantState, tasks: updatedTasks });
                    setLastActionMessage(`Task "${taskToDelete.text}" eliminata.`);
                }
            }
        ]
    );
  };

  const handleClearCompletedTasks = () => {
    if (!plantState || !plantState.tasks.some(t => t.completed)) {
        Alert.alert("Nessuna Task Completata", "Non ci sono task completate da eliminare.");
        return;
    }
    Alert.alert(
        "Pulisci Task Completate",
        "Sei sicuro di voler eliminare tutte le task completate?",
        [
            { text: "Annulla", style: "cancel" },
            {
                text: "Pulisci", style: "destructive",
                onPress: () => {
                    const updatedTasks = plantState.tasks.filter(task => !task.completed);
                    savePlantState({ ...plantState, tasks: updatedTasks });
                    setLastActionMessage("Task completate eliminate.");
                }
            }
        ]
    );
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
    if (!plantState) return PLANT_IMAGES.seed;
    const image = PLANT_IMAGES[plantState.currentStage];
    return image || PLANT_IMAGES.seed;
  };

  const calculateProgressToNextStage = (): number => {
    if (!plantState || plantState.currentStage === 'fruiting_plant') return 1;
    const pointsNeeded = POINTS_TO_NEXT_STAGE[plantState.currentStage];
    if (pointsNeeded <= 0 || pointsNeeded === Infinity) return 1;
    return Math.max(0, Math.min(1, plantState.growthPoints / pointsNeeded));
  };

  const getPlantMoodMessage = (plant: PlantState | null): string => {
    if (!plant) return "";
    const todayStr = new Date().toDateString();
    const allTasksDone = plant.tasks.length > 0 && plant.tasks.every(t => t.completed);
    const productiveWateringAvailableToday = allTasksDone && plant.lastProductiveWateringDate !== todayStr;

    if (productiveWateringAvailableToday) return `${plant.plantName} è fiera di te! Pronta per la Super Annaffiatura!`;
    if (allTasksDone && plant.tasks.length > 0) {
        if (plant.productiveStreak > 1) return `${plant.plantName} è al settimo cielo! ${plant.productiveStreak} giorni di produttività!`;
        return `${plant.plantName} è soddisfatta! Tutte le task sono complete per oggi.`;
    }

    const incompleteTasks = plant.tasks.filter(t => !t.completed);
    if (incompleteTasks.length > 5) return `${plant.plantName} si sente un po' sopraffatta da ${incompleteTasks.length} task... Forza!`;
    if (incompleteTasks.length > 0) return `${plant.plantName} aspetta che ${incompleteTasks.length === 1 ? '1 task venga completata' : `${incompleteTasks.length} task vengano completate`}.`;

    if (plant.happinessLevel < 30) return `${plant.plantName} ha bisogno di più attenzioni e task completate!`;
    if (plant.happinessLevel < 50) return `${plant.plantName} sembra un po' giù. Completare qualche task aiuterebbe!`;
    if (plant.soilMoistureLevel < 0.25) return `${plant.plantName} ha sete! Un po' d'acqua?`;

    if (plant.tasks.length === 0) return `${plant.plantName} è pronta per nuove sfide! Aggiungi qualche task.`

    return `${plant.plantName} sta bene e apprezza la tua produttività!`;
  };

  if (isLoading || !plantState) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ECC71" />
        <Text style={styles.loadingText}>Coltivando la tua pianta...</Text>
      </SafeAreaView>
    );
  }

  const isProductiveWateringEnabled = plantState.tasks.length > 0 && plantState.tasks.every(task => task.completed) && plantState.lastProductiveWateringDate !== new Date().toDateString();

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Stack.Screen options={{ headerTitle: plantState.plantName }} />
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.plantDisplayArea}>
          <Image source={getPlantImage()} style={styles.plantImageStyle} resizeMode="contain" />
          <Text style={styles.plantStageText}>Stadio: {plantState.currentStage.replace(/_/g, ' ')}</Text>
          <Text style={styles.plantMoodText}>{getPlantMoodMessage(plantState)}</Text>
          {plantState.productiveStreak > 1 && <Text style={styles.streakText}>Serie Produttiva: {plantState.productiveStreak} giorni! 🔥</Text>}
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
                maxLength={30}
            />
            <TouchableOpacity style={styles.actionButtonSmall} onPress={handleRenamePlant}>
                <Text style={styles.actionButtonSmallText}>Salva Nome</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.taskSection}>
          <Text style={styles.sectionTitle}>Le Tue Task Produttive</Text>
          <View style={styles.taskSizeSelector}>
            {(TASK_SIZE_OPTIONS).map(size => (
                <TouchableOpacity
                    key={size}
                    style={[styles.taskSizeButton, newTaskSize === size && styles.taskSizeButtonSelected]}
                    onPress={() => setNewTaskSize(size)}
                >
                    <Text style={[styles.taskSizeButtonText, newTaskSize === size && styles.taskSizeButtonTextSelected]}>{size.charAt(0).toUpperCase()}</Text>
                </TouchableOpacity>
            ))}
          </View>
          <View style={styles.taskInputContainer}>
            <TextInput
              style={styles.inputField}
              placeholder={`Nuova task (${newTaskSize}, ${TASK_POINTS[newTaskSize]}pt)...`}
              value={newTaskText}
              onChangeText={setNewTaskText}
              maxLength={100}
            />
            <TouchableOpacity style={styles.actionButtonSmall} onPress={handleAddTask}>
              <Text style={styles.actionButtonSmallText}>Aggiungi</Text>
            </TouchableOpacity>
          </View>
          {plantState.tasks.length === 0 ? (
            <Text style={styles.noTasksText}>Nessuna task ancora. Aggiungine una!</Text>
          ) : (
            <FlatList
              data={plantState.tasks.sort((a,b) => {
                if (a.completed === b.completed) {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
                return a.completed ? 1 : -1;
              })}
              keyExtractor={(item) => item.id}
              renderItem={({ item }: { item: Task }) => (
                <View style={styles.taskItemContainer}>
                    <TouchableOpacity
                    style={[styles.taskItem, item.completed && styles.taskItemCompleted]}
                    onPress={() => handleToggleTaskCompletion(item.id)}
                    >
                        <View style={styles.taskItemContent}>
                            <Text style={[styles.taskText, item.completed && styles.taskTextCompleted]}>
                                {item.completed ? '✓ ' : '○ '} {item.text}
                            </Text>
                            <Text style={styles.taskPointsText}>({item.points} pt)</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteTask(item.id)} style={styles.deleteTaskButton}>
                        <Text style={styles.deleteTaskButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>
              )}
              style={styles.taskList}
            />
          )}
          {plantState.tasks.some(t => t.completed) && (
            <TouchableOpacity style={styles.clearCompletedButton} onPress={handleClearCompletedTasks}>
                <Text style={styles.clearCompletedButtonText}>Pulisci Task Completate</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
            style={[styles.actionButtonProductive, !isProductiveWateringEnabled && styles.actionButtonDisabled]}
            onPress={handleProductiveWatering}
            disabled={!isProductiveWateringEnabled}
        >
            <Text style={styles.actionButtonText}>Super Annaffiatura ({GROWTH_POINTS_PRODUCTIVE_WATERING} pt)</Text>
        </TouchableOpacity>

        <View style={styles.careSection}>
            <Text style={styles.sectionTitle}>Cura Regolare</Text>
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
            <Text style={styles.uselessStatText}>Giorni Produttivi: {plantState.totalDaysGrown}</Text>
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
  screenContainer: { flex: 1, backgroundColor: '#F0FDF4' },
  scrollContentContainer: { flexGrow: 1, alignItems: 'center', paddingVertical: 20, paddingHorizontal: 15 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FDF4' },
  loadingText: { marginTop: 15, fontSize: 18, color: '#15803D' },
  plantDisplayArea: { alignItems: 'center', marginBottom: 20, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, width: '100%', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4 },
  plantImageStyle: { width: Dimensions.get('window').width * 0.55, height: Dimensions.get('window').width * 0.55, marginBottom: 10 },
  plantStageText: { fontSize: 20, fontWeight: '600', color: '#15803D', textTransform: 'capitalize' },
  plantMoodText: { fontSize: 14, color: '#047857', fontStyle: 'italic', marginTop: 5, textAlign: 'center', minHeight: 20 },
  streakText: {fontSize: 14, color: '#DD2C00', fontWeight: 'bold', marginTop: 5, textAlign: 'center'},
  statsContainer: { alignItems: 'center', marginBottom: 20, width: '100%', backgroundColor: '#D1FAE5', paddingVertical:15, borderRadius:10 },
  statsTitle: { fontSize: 18, fontWeight: 'bold', color: '#065F46', marginBottom: 10 },
  progressBar: { marginBottom: 8 },
  pointsText: { fontSize: 14, color: '#065F46' },
  renamePlantSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '100%', paddingHorizontal: 5, justifyContent: 'space-between' },
  taskSection: { width: '100%', marginBottom: 20, backgroundColor: '#ECFDF5', padding:15, borderRadius:10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#047857', marginBottom: 10, textAlign: 'center' },
  taskSizeSelector: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, paddingHorizontal:10 },
  taskSizeButton: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: '#6EE7B7', backgroundColor: '#FFFFFF' },
  taskSizeButtonSelected: { backgroundColor: '#34D399', borderColor: '#10B981' },
  taskSizeButtonText: { color: '#065F46', fontSize: 14, fontWeight:'500' },
  taskSizeButtonTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  taskInputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  inputField: { flex: 1, borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8, marginRight: 10, backgroundColor: '#FFFFFF', fontSize:15 },
  taskList: { width: '100%', maxHeight: 250 },
  taskItemContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  taskItem: { flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal:10, borderRadius: 5, borderWidth:1, borderColor: '#D1FAE5' },
  taskItemCompleted: { backgroundColor: '#E0F2F7' },
  taskItemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  taskText: { fontSize: 16, color: '#064E3B', flexShrink: 1, marginRight: 5 },
  taskTextCompleted: { textDecorationLine: 'line-through', color: '#065F46' },
  taskPointsText: { fontSize: 12, color: '#047857', fontStyle: 'italic'},
  deleteTaskButton: { paddingLeft: 12, paddingVertical: 10, justifyContent: 'center'},
  deleteTaskButtonText: { color: '#EF4444', fontSize: 18, fontWeight: 'bold' },
  noTasksText: { textAlign: 'center', color: '#047857', fontStyle: 'italic', marginVertical:10 },
  clearCompletedButton: { backgroundColor: '#6EE7B7', paddingVertical: 10, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  clearCompletedButtonText: { color: '#064E3B', fontSize: 14, fontWeight: '500'},
  careSection: { width: '100%', marginBottom: 20, backgroundColor: '#D1FAE5', padding:15, borderRadius:10 },
  actionButtonSmall: { backgroundColor: '#34D399', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, elevation: 2},
  actionButtonSmallText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold'},
  actionButtonPrimary: { backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 20, marginBottom: 10, width: '100%', alignItems: 'center', elevation: 3 },
  actionButtonFertilize: { backgroundColor: '#F59E0B', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 20, marginBottom: 10, width: '100%', alignItems: 'center', elevation: 3 },
  actionButtonProductive: { backgroundColor: '#2563EB', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 20, marginVertical: 10, width: '100%', alignItems: 'center', elevation: 3 },
  actionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  actionButtonDestructive: { backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 20, marginTop:10, marginBottom: 15, width: '100%', alignItems: 'center', elevation: 3 },
  actionButtonDisabled: { backgroundColor: '#9CA3AF' },
  feedbackMessageText: { marginTop: 10, marginBottom:10, fontSize: 14, color: '#047857', textAlign: 'center', fontStyle: 'italic' },
  uselessStatsSection: { marginVertical: 15, padding: 10, backgroundColor: '#E0E7FF', borderRadius: 10, width: '100%', alignItems: 'center' },
  uselessStatText: { fontSize: 12, color: '#3730A3', marginBottom: 4 },
  deviceInfoFooter: { marginTop: 15, paddingBottom: 10, alignItems: 'center' },
  deviceInfoText: { fontSize: 9, color: '#A0AEC0' }
});
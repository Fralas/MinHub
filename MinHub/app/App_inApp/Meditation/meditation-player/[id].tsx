import { Ionicons } from '@expo/vector-icons';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MeditationPlayerScreen() {
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

const PLANT_STATE_STORAGE_KEY = '@minhub_productivePlantState_v6';


const WATERING_COOLDOWN_MS = 5 * 1000;
const GROWTH_POINTS_PER_WATERING = 5;
const FERTILIZING_COOLDOWN_MS = 10 * 1000;
const GROWTH_POINTS_PER_FERTILIZING = 10;
const HAPPINESS_BOOST_FERTILIZING = 15;

const createSafeTaskFromAny = (taskData: any): Task => {
    let determinedSize: TaskSize = 'medium';
    if (typeof taskData.size === 'string' && TASK_SIZE_OPTIONS.includes(taskData.size as TaskSize)) {
        determinedSize = taskData.size as TaskSize;
    }
    
    let determinedPoints: number = TASK_POINTS[determinedSize];
    if (typeof taskData.points === 'number' && taskData.points >= 0) {
        determinedPoints = taskData.points;
    }

    return {
        id: String(taskData.id || `task_${Date.now()}_${Math.random().toString(16).slice(2)}`),
        text: String(taskData.text || "Task Senza Titolo"),
        completed: Boolean(taskData.completed || false),
        createdAt: String(taskData.createdAt || new Date().toISOString()),
        size: determinedSize,
        points: determinedPoints,
    };
};

const createSafeTaskFromAny = (taskData: any): Task => {
    let determinedSize: TaskSize = 'medium';
    if (typeof taskData.size === 'string' && TASK_SIZE_OPTIONS.includes(taskData.size as TaskSize)) {
        determinedSize = taskData.size as TaskSize;
    }
    
    let determinedPoints: number = TASK_POINTS[determinedSize];
    if (typeof taskData.points === 'number' && taskData.points >= 0) {
        determinedPoints = taskData.points;
    }

    return {
        id: String(taskData.id || `task_${Date.now()}_${Math.random().toString(16).slice(2)}`),
        text: String(taskData.text || "Task Senza Titolo"),
        completed: Boolean(taskData.completed || false),
        createdAt: String(taskData.createdAt || new Date().toISOString()),
        size: determinedSize,
        points: determinedPoints,
    };
};

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
    if (plantState && newPlantNameInput === '' && plantState.plantName) {
        setNewPlantNameInput(plantState.plantName);
    }
  }, [plantState, newPlantNameInput]);

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
            tempPlantState.tasks = parsedJson.tasks.map(taskData => createSafeTaskFromAny(taskData));
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
      if (tempPlantState.plantName) setNewPlantNameInput(tempPlantState.plantName);

    } catch (error) {
      Alert.alert('Errore', 'Impossibile caricare i dati della pianta.');
      plantDataToSet = initializePlantStateHelper();
      if (plantDataToSet.plantName) setNewPlantNameInput(plantDataToSet.plantName);
       await AsyncStorage.setItem(PLANT_STATE_STORAGE_KEY, JSON.stringify(plantDataToSet));
    } finally {
      if (plantDataToSet) {
        setPlantState(plantDataToSet);
      }
      if (messageForUI && !lastActionMessage) {
        setLastActionMessage(messageForUI);
      }
      setIsLoading(false);
    }
  }, [applyGrowthAndStageCheck, lastActionMessage]);


  useFocusEffect( useCallback(() => { loadPlantState(); }, [loadPlantState]) );

  const savePlantState = async (newState: PlantState) => {
    try {
      await AsyncStorage.setItem(PLANT_STATE_STORAGE_KEY, JSON.stringify(newState));
      setPlantState(newState);
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare i dati della pianta.');
    }
  };

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

    const updatedTasks = plantState.tasks.map(currentTask => {
      if (currentTask.id === taskId) {
        const isNowCompleting = !currentTask.completed;
        if (isNowCompleting) {
            taskJustCompletedObject = currentTask;
        }
        return { ...currentTask, completed: !currentTask.completed };
      }
      return currentTask;
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

  const loadSound = useCallback(async () => {
    if (!meditation) return;
    setIsLoading(true);
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });

      const { sound: newSound, status } = await Audio.Sound.createAsync(
        meditation.audioFile,
        { shouldPlay: false },
        (playbackStatus) => {
          if (!playbackStatus.isLoaded) {
            if (playbackStatus.error) {
              console.error(`Errore durante la riproduzione: ${playbackStatus.error}`);
              Alert.alert("Errore Audio", "Impossibile caricare la meditazione.");
            }
          } else {
            setPositionMillis(playbackStatus.positionMillis);
            setDurationMillis(playbackStatus.durationMillis ?? null);
            if (playbackStatus.didJustFinish) {
              setIsPlaying(false);
              newSound.setPositionAsync(0);
            }
          }
        }
      );
      setSound(newSound);
    } catch (error) {
      console.error("Errore nel caricamento del suono:", error);
      Alert.alert("Errore Audio", "Impossibile caricare la meditazione.");
    } finally {
      setIsLoading(false);
    }
  }, [meditation]);

  useEffect(() => {
    if (meditation) {
      loadSound();
    }
    return () => {
      sound?.unloadAsync();
    };
  }, [meditation, loadSound, sound]);


  const handlePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  if (isLoading || !meditation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00796B" />
        <Text>Caricamento meditazione...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: meditation.title }} />
       <ImageBackground
        source={require('../../../assets/images/background_player.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <Text style={styles.title}>{meditation.title}</Text>
          <Text style={styles.description}>{meditation.description}</Text>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
            <Text style={styles.timeText}> / </Text>
            <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
          </View>

          <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
            <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={80} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ImageBackground>
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
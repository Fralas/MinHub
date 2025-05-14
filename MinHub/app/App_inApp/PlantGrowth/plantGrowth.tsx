import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
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
}

const PLANT_STATE_STORAGE_KEY = '@minhub_virtualPlantState_v1';
const WATERING_COOLDOWN_MS = 5 * 1000;
const GROWTH_POINTS_PER_WATERING = 10;

const FERTILIZING_COOLDOWN_MS = 10 * 1000; 
const GROWTH_POINTS_PER_FERTILIZING = 25; 
const HAPPINESS_BOOST_FERTILIZING = 15; 

const GROWTH_POINTS_PER_ACTION = 5; 

const initializePlantStateHelper = (): PlantState => {
    if (__DEV__) {
        console.log("[PlantGrowthScreen] Inizializzazione nuovo stato pianta.");
    }
    return {
      plantId: `plant_${Date.now()}`,
      plantName: 'My Little Sprout',
      currentStage: 'seed',
      growthPoints: 0,
      lastWateredTimestamp: null,
      lastFertilizedTimestamp: null,
      totalDaysGrown: 0,
      happinessLevel: 75,
      themePreference: 'forest',
      soilMoistureLevel: 0.5,
    };
};

export default function PlantGrowthScreen() {
  const [plantState, setPlantState] = useState<PlantState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastActionMessage, setLastActionMessage] = useState<string>('');
  const [screenRenderCount, setScreenRenderCount] = useState<number>(0);

  useEffect(() => {
    if (__DEV__ && plantState) {
      console.log("[PlantGrowthScreen] STATO PIANTA AGGIORNATO:", JSON.stringify(plantState, null, 2));
    }
  }, [plantState]);

  useEffect(() => {
    setScreenRenderCount(prev => prev + 1);
    if (__DEV__ && screenRenderCount === 1) {
        console.warn("[PlantGrowthScreen] DEBUG: Assicurati che i percorsi immagine in PLANT_IMAGES siano corretti rispetto a questo file! Percorso attuale usato come base: '../../../assets/images/plantIMG/...'");
    }
  }, [plantState]);


  const loadPlantState = useCallback(async () => {
    if (__DEV__) {
        console.log("[PlantGrowthScreen] Caricamento stato pianta...");
    }
    setIsLoading(true);
    try {
      const storedState = await AsyncStorage.getItem(PLANT_STATE_STORAGE_KEY);
      if (storedState) {
        if (__DEV__) {
            console.log("[PlantGrowthScreen] Stato trovato in AsyncStorage:", storedState);
        }
        setPlantState(JSON.parse(storedState));
      } else {
        if (__DEV__) {
            console.log("[PlantGrowthScreen] Nessuno stato in AsyncStorage, inizializzo nuovo stato.");
        }
        const initialPlant = initializePlantStateHelper();
        setPlantState(initialPlant);
        await AsyncStorage.setItem(PLANT_STATE_STORAGE_KEY, JSON.stringify(initialPlant));
      }
    } catch (error) {
      if (__DEV__) {
        console.error("[PlantGrowthScreen] Errore caricamento stato pianta:", error);
      }
      Alert.alert('Errore', 'Impossibile caricare i dati della pianta.');
      const fallbackPlant = initializePlantStateHelper();
      setPlantState(fallbackPlant);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const performLoad = async () => {
        await loadPlantState();
      };
      performLoad();
    }, [loadPlantState])
  );

  const savePlantState = async (newState: PlantState) => {
    try {
      if (__DEV__) {
        console.log("[PlantGrowthScreen] Salvataggio stato pianta:", JSON.stringify(newState, null, 2));
      }
      await AsyncStorage.setItem(PLANT_STATE_STORAGE_KEY, JSON.stringify(newState));
      setPlantState(newState); 
    } catch (error) {
      if (__DEV__) {
        console.error("[PlantGrowthScreen] Errore salvataggio stato pianta:", error);
      }
      Alert.alert('Errore', 'Impossibile salvare i dati della pianta.');
    }
  };

  const handleInteraction = (
    actionType: 'water' | 'fertilize' | 'external_event',
    pointsToAdd: number,
    cooldownMs?: number,
    lastActionTimestamp?: string | null,
    actionName?: string,
    timestampField?: keyof PlantState
  ) => {
    if (!plantState) return;
    setLastActionMessage('');

    const now = Date.now();
    if (actionType !== 'external_event' && cooldownMs && lastActionTimestamp) {
      const lastActionDate = new Date(lastActionTimestamp).getTime();
      if (now - lastActionDate < cooldownMs) {
        const remainingTime = cooldownMs - (now - lastActionDate);
        const hoursRemaining = Math.floor(remainingTime / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        const secondsRemaining = Math.floor((remainingTime % (1000 * 60)) / 1000);
        let alertMessage = `Puoi ${actionName || 'interagire'} di nuovo tra `;
        if (hoursRemaining > 0) alertMessage += `${hoursRemaining}h ${minutesRemaining}m.`;
        else if (minutesRemaining > 0) alertMessage += `${minutesRemaining}m ${secondsRemaining}s.`;
        else alertMessage += `${secondsRemaining}s.`;
        Alert.alert('Troppo Presto!', alertMessage);
        setLastActionMessage(`${actionName || 'Azione'} tentata troppo presto.`);
        return;
      }
    }

    let newPoints = plantState.growthPoints + pointsToAdd;
    let newStage = plantState.currentStage;
    let message = `Hai ${actionName || 'interagito con'} ${plantState.plantName}! Ha guadagnato ${pointsToAdd} punti.`;

    if (newStage !== 'fruiting_plant' && newPoints >= POINTS_TO_NEXT_STAGE[newStage]) {
      const pointsForCurrentStage = POINTS_TO_NEXT_STAGE[newStage];
      newPoints -= pointsForCurrentStage;
      const currentStageIndex = PLANT_STAGES.indexOf(newStage);
      if (currentStageIndex < PLANT_STAGES.length - 1) {
        newStage = PLANT_STAGES[currentStageIndex + 1];
        message = `Wow! ${plantState.plantName} è cresciuta allo stadio: ${newStage.replace(/_/g, ' ')}!`;
        if (__DEV__) {
            console.log(`[PlantGrowthScreen] CAMBIO STADIO! Da ${plantState.currentStage} a ${newStage}. Punti rimanenti: ${newPoints}`);
        }
      } else {
        
         if (__DEV__) {
            console.log(`[PlantGrowthScreen] Raggiunto/Superato punti per l'ultimo stadio evolutivo prima di fruiting. Stage attuale: ${newStage}`);
         }
      }
    }

    let updatedHappiness = plantState.happinessLevel;
    let updatedSoilMoisture = plantState.soilMoistureLevel;
    let updatedTimestampObject = {};

    if (actionType === 'water') {
      updatedHappiness = Math.min(100, plantState.happinessLevel + 10);
      updatedSoilMoisture = Math.min(1, plantState.soilMoistureLevel + 0.25);
      if (timestampField) updatedTimestampObject = { [timestampField]: new Date().toISOString() };
    } else if (actionType === 'fertilize') {
      updatedHappiness = Math.min(100, plantState.happinessLevel + HAPPINESS_BOOST_FERTILIZING);
      if (timestampField) updatedTimestampObject = { [timestampField]: new Date().toISOString() };
    }
    
    const oldDate = plantState.lastWateredTimestamp ? new Date(plantState.lastWateredTimestamp) : null; 
    const currentDate = new Date();
    const newDayHasPassed = oldDate ? oldDate.toDateString() !== currentDate.toDateString() : true;


    const newState: PlantState = {
      ...plantState,
      growthPoints: newPoints,
      currentStage: newStage,
      happinessLevel: updatedHappiness,
      soilMoistureLevel: updatedSoilMoisture,
      ...updatedTimestampObject,
      totalDaysGrown: plantState.totalDaysGrown + ((actionType === 'water' || actionType === 'fertilize') && newDayHasPassed ? 1 : 0),
    };
    savePlantState(newState);
    Alert.alert(actionName ? `${actionName}!` : 'Fatto!', message);
    setLastActionMessage(message);
  };

  const handleWaterPlant = () => {
    handleInteraction(
      'water',
      GROWTH_POINTS_PER_WATERING,
      WATERING_COOLDOWN_MS,
      plantState?.lastWateredTimestamp,
      'Annaffiato',
      'lastWateredTimestamp'
    );
  };

  const handleFertilizePlant = () => {
    handleInteraction(
      'fertilize',
      GROWTH_POINTS_PER_FERTILIZING,
      FERTILIZING_COOLDOWN_MS,
      plantState?.lastFertilizedTimestamp,
      'Fertilizzato',
      'lastFertilizedTimestamp'
    );
  };

  const simulateExternalGrowthEvent = () => {
    handleInteraction('external_event', GROWTH_POINTS_PER_ACTION);
  };

  const handleResetPlant = () => {
    Alert.alert(
      "Resetta Pianta",
      "Sei sicuro di voler resettare la tua pianta? Tutti i progressi andranno persi.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Resetta",
          style: "destructive",
          onPress: async () => {
            try {
              if (__DEV__) {
                console.log("[PlantGrowthScreen] Resetting plant state...");
              }
              await AsyncStorage.removeItem(PLANT_STATE_STORAGE_KEY);
              setLastActionMessage('Pianta resettata con successo.');
              await loadPlantState();
            } catch (error) {
              if (__DEV__) {
                console.error("[PlantGrowthScreen] Errore durante il reset:", error);
              }
              Alert.alert('Errore', 'Impossibile resettare i dati della pianta.');
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const getPlantImage = () => {
    if (!plantState) {
      if (__DEV__) console.log("[PlantGrowthScreen] getPlantImage: plantState è null, uso immagine seme di default.");
      return PLANT_IMAGES.seed;
    }
    const image = PLANT_IMAGES[plantState.currentStage];
    if (!image) {
      if (__DEV__) console.warn(`[PlantGrowthScreen] getPlantImage: Immagine non trovata per lo stadio '${plantState.currentStage}'. Uso immagine seme di default.`);
      return PLANT_IMAGES.seed;
    }
    if (__DEV__) console.log(`[PlantGrowthScreen] getPlantImage: Caricamento immagine per stadio '${plantState.currentStage}'.`);
    return image;
  };

  const calculateProgressToNextStage = (): number => {
    if (!plantState || plantState.currentStage === 'fruiting_plant') return 1;
    const pointsNeeded = POINTS_TO_NEXT_STAGE[plantState.currentStage];
    if (pointsNeeded <= 0 || pointsNeeded === Infinity) return 1;
    return Math.max(0, Math.min(1, plantState.growthPoints / pointsNeeded));
  };

  const getUselessDeviceInfo = () => {
    return `Platform: ${Platform.OS}, Version: ${Platform.Version}, Screen: ${Dimensions.get('window').width}x${Dimensions.get('window').height}`;
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
      <Stack.Screen options={{ headerTitle: plantState.plantName || 'My Virtual Plant' }} />
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

        <View style={styles.uselessStatsSection}>
            <Text style={styles.uselessStatText}>Felicità: {plantState.happinessLevel}%</Text>
            <Text style={styles.uselessStatText}>Umidità Suolo: {(plantState.soilMoistureLevel * 100).toFixed(0)}%</Text>
            <Text style={styles.uselessStatText}>Giorni Totali Crescita: {plantState.totalDaysGrown}</Text>
        </View>

        <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleWaterPlant}>
          <Text style={styles.actionButtonText}>Annaffia ({GROWTH_POINTS_PER_WATERING} pt)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonFertilize} onPress={handleFertilizePlant}>
          <Text style={styles.actionButtonText}>Fertilizza ({GROWTH_POINTS_PER_FERTILIZING} pt)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonSecondary} onPress={simulateExternalGrowthEvent}>
          <Text style={styles.actionButtonTextSecondary}>Simula Azione ({GROWTH_POINTS_PER_ACTION} pt)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonDestructive} onPress={handleResetPlant}>
          <Text style={styles.actionButtonText}>Resetta Pianta</Text>
        </TouchableOpacity>

        {lastActionMessage !== '' && (
            <Text style={styles.feedbackMessageText}>{lastActionMessage}</Text>
        )}

        <View style={styles.deviceInfoFooter}>
            <Text style={styles.deviceInfoText}>{getUselessDeviceInfo()}</Text>
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
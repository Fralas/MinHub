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
  safeArea: {
    flex: 1,
    backgroundColor: '#E0F2F7',
  },
   backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#FFFFFF',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#F5F5F5',
    paddingHorizontal: 10,
  },
  timerContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  timeText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  playButton: {
    padding: 10,
  },
});
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { MEDITATIONS_DATA, Meditation } from '../meditations';


export default function MeditationPlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meditation, setMeditation] = useState<Meditation | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [durationMillis, setDurationMillis] = useState<number | null>(null);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [isLooping, setIsLooping] = useState(false);
  const [motivationalShown, setMotivationalShown] = useState(false);
  const bellSound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const meditationDetails = MEDITATIONS_DATA.find((m: Meditation) => m.id === id);
    if (meditationDetails) {
      setMeditation(meditationDetails);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  }, [id, router]);

  const formatTime = (millis: number | null | undefined): string => {
    if (millis == null || Number.isNaN(millis) || millis < 0) return '00:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const loadBell = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../../../../assets/audio/bell.mp3'));
      bellSound.current = sound;
    } catch {}
  };

  const playBell = async () => {
    try {
      await bellSound.current?.replayAsync();
    } catch {}
  };

  const loadSoundAsync = useCallback(async (currentMeditation: Meditation) => {
    if (!currentMeditation || !currentMeditation.audioFile) {
      setIsLoading(false);
      Alert.alert("Errore Audio", "File audio non specificato per questa meditazione.");
      return null;
    }

    setIsLoading(true);
    let newSoundInstance: Audio.Sound | null = null;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });

      const { sound: createdSound } = await Audio.Sound.createAsync(
        currentMeditation.audioFile,
        { shouldPlay: false },
        async (playbackStatus) => {
          if (!playbackStatus.isLoaded) {
            if (playbackStatus.error) {
              Alert.alert("Errore Audio", `Impossibile caricare la meditazione: ${playbackStatus.error}`);
            }
          } else {
            setPositionMillis(playbackStatus.positionMillis);
            setDurationMillis(playbackStatus.durationMillis ?? null);

            if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
              setIsPlaying(false);
              setPositionMillis(0);
              createdSound.setPositionAsync(0);
              if (!motivationalShown) {
                await playBell();
                Alert.alert("Ben fatto", "Hai completato la meditazione!");
                setMotivationalShown(true);
              }
            }
          }
        }
      );
      newSoundInstance = createdSound;
    } catch {
      Alert.alert("Errore Audio", "Impossibile caricare il suono.");
    } finally {
      setIsLoading(false);
    }
    return newSoundInstance;
  }, [motivationalShown]);

  useEffect(() => {
    let currentSound: Audio.Sound | null = null;
    const setupAudio = async () => {
      await loadBell();
      if (meditation) {
        const newLoadedSound = await loadSoundAsync(meditation);
        if (newLoadedSound) {
          currentSound = newLoadedSound;
          setSound(newLoadedSound);
        }
      }
    };
    setupAudio();
    return () => {
      currentSound?.unloadAsync();
      bellSound.current?.unloadAsync();
    };
  }, [meditation, loadSoundAsync]);

  useEffect(() => {
    let interval: number;
    if (sound && isPlaying) {
      interval = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPositionMillis(status.positionMillis);
          setDurationMillis(status.durationMillis ?? null);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sound, isPlaying]);

  const handlePlayPause = async () => {
    if (!sound) {
      if (meditation) {
        const reloadedSound = await loadSoundAsync(meditation);
        if (reloadedSound) {
          setSound(reloadedSound);
          try {
            await reloadedSound.playAsync();
            setIsPlaying(true);
          } catch {
            Alert.alert("Errore Player", "Impossibile avviare la riproduzione dopo il ricaricamento.");
          }
        }
      }
      return;
    }
    try {
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        Alert.alert("Errore Player", "Suono non caricato correttamente. Riprova.");
        await loadSoundAsync(meditation!);
        return;
      }

      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        if (status.didJustFinish) {
          await sound.replayAsync();
        } else {
          await sound.playAsync();
        }
      }
      setIsPlaying(!isPlaying);
    } catch {
      Alert.alert("Errore Player", "Impossibile eseguire l'azione.");
    }
  };

  const handleReset = async () => {
    if (sound) {
      try {
        await sound.setPositionAsync(0);
        setPositionMillis(0);
        setIsPlaying(false);
      } catch {
        Alert.alert("Errore", "Impossibile riportare all'inizio.");
      }
    }
  };

  const toggleLoop = async () => {
    if (sound) {
      try {
        await sound.setIsLoopingAsync(!isLooping);
        setIsLooping(!isLooping);
      } catch {
        Alert.alert("Errore", "Non è stato possibile cambiare la modalità loop.");
      }
    }
  };

  const handleSeek = async (value: number) => {
    if (sound && durationMillis) {
      try {
        const newPosition = value * durationMillis;
        await sound.setPositionAsync(newPosition);
        setPositionMillis(newPosition);
      } catch {}
    }
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
        source={require('../../../../assets/images/meditationIMG/background_player.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <Text style={styles.title}>{meditation.title}</Text>
          <Text style={styles.description}>{meditation.description}</Text>

          <Slider
            style={{ width: '80%', height: 40 }}
            minimumValue={0}
            maximumValue={1}
            value={durationMillis ? positionMillis / durationMillis : 0}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#B2DFDB"
            thumbTintColor="#FFFFFF"
            onSlidingComplete={handleSeek}
          />

          <View style={styles.timerContainer}>
            <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
            <Text style={styles.timeText}> / </Text>
            <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
          </View>

          <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
            <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={80} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <TouchableOpacity onPress={handleReset} style={{ marginHorizontal: 20 }}>
              <Ionicons name="refresh-circle" size={50} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleLoop} style={{ marginHorizontal: 20 }}>
              <Ionicons name={isLooping ? "repeat" : "repeat-outline"} size={50} color={isLooping ? "#4CAF50" : "#FFFFFF"} />
            </TouchableOpacity>
          </View>
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
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(224, 242, 247, 0.8)',
    zIndex: 10,
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

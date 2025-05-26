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
    console.log("Attempting to load meditation with id:", id);
    console.log("Found meditationDetails:", JSON.stringify(meditationDetails, null, 2));
    
    if (meditationDetails && meditationDetails.audioFile !== undefined) {
      setMeditation(meditationDetails);
    } else {
      console.error("Meditation or audioFile not found (or audioFile is undefined) for id:", id, "Details:", meditationDetails);
      Alert.alert("Error", "Meditation data or audio file is missing. Please check the data source and require paths.");
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
      const { sound } = await Audio.Sound.createAsync(require('../../../../assets/audio/meditationAUDIO/bell.mp3'));
      bellSound.current = sound;
    } catch (error) {
      console.error("Failed to load bell sound:", error);
    }
  };

  const playBell = async () => {
    try {
      await bellSound.current?.setStatusAsync({ shouldPlay: true, positionMillis: 0 });
    } catch (error) {
      console.error("Failed to play bell sound:", error);
    }
  };

  const loadSoundAsync = useCallback(async (currentMeditation: Meditation) => {
    if (!currentMeditation || currentMeditation.audioFile === undefined) {
      setIsLoading(false);
      Alert.alert("Audio Error", "Audio file not specified or undefined for this meditation.");
      return null;
    }

    setIsLoading(true);
    let newSoundInstance: Audio.Sound | null = null;
    console.log("loadSoundAsync - currentMeditation.audioFile:", currentMeditation.audioFile);

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });

      const { sound: createdSound, status } = await Audio.Sound.createAsync(
        currentMeditation.audioFile,
        { shouldPlay: false },
        async (playbackStatus) => {
          if (!playbackStatus.isLoaded) {
            if (playbackStatus.error) {
              Alert.alert("Audio Error", `Unable to load meditation: ${playbackStatus.error}`);
            }
          } else {
            setPositionMillis(playbackStatus.positionMillis);
            setDurationMillis(playbackStatus.durationMillis ?? null);
            if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
              setIsPlaying(false);
              setPositionMillis(0);
              createdSound.setPositionAsync(0).catch(e => console.error("Error setting position on finish:", e));
              if (!motivationalShown) {
                await playBell();
                Alert.alert("Well done!", "You have completed the meditation!");
                setMotivationalShown(true);
              }
            }
          }
        }
      );
      if(status.isLoaded) {
        newSoundInstance = createdSound;
        setDurationMillis(status.durationMillis ?? null);
      } else {
        Alert.alert("Audio Error", "Sound resource could not be loaded.");
      }
    } catch (error: any) {
      Alert.alert("Audio Error", `Failed to load sound: ${error.message}`);
      console.error("Full error loading sound:", error);
    } finally {
      setIsLoading(false);
    }
    return newSoundInstance;
  }, [motivationalShown]);

  useEffect(() => {
    let soundToUnload: Audio.Sound | null = null;
    const setupAudio = async () => {
      await loadBell();
      console.log("Setting up audio for meditation object:", JSON.stringify(meditation, null, 2));
      if (meditation && meditation.audioFile !== undefined) {
        const newLoadedSound = await loadSoundAsync(meditation);
        if (newLoadedSound) {
          soundToUnload = newLoadedSound;
          setSound(newLoadedSound);
        }
      } else if (meditation && meditation.audioFile === undefined) {
          console.error("Meditation object is present, but audioFile is undefined.");
          Alert.alert("Audio Error", "Audio data is missing for this meditation.");
          setIsLoading(false);
      } else {
          setIsLoading(false);
      }
    };
    setupAudio();
    return () => {
      soundToUnload?.unloadAsync();
      bellSound.current?.unloadAsync();
    };
  }, [meditation, loadSoundAsync]);


  const handlePlayPause = async () => {
    if (!sound) {
      if (meditation) {
        const reloadedSound = await loadSoundAsync(meditation);
        if (reloadedSound) {
          setSound(reloadedSound);
          try {
            await reloadedSound.playAsync();
            setIsPlaying(true);
          } catch (e) {
            Alert.alert("Player Error", "Could not start playback after reload.");
          }
        }
      }
      return;
    }
    try {
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        Alert.alert("Player Error", "Sound not properly loaded. Attempting to reload.");
        const reloadedSound = await loadSoundAsync(meditation!); 
        if(reloadedSound){
            setSound(reloadedSound);
            await reloadedSound.playAsync();
            setIsPlaying(true);
        }
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
    } catch (e) {
      Alert.alert("Player Error", "Could not perform action.");
    }
  };

  const handleReset = async () => {
    if (sound) {
      try {
        await sound.setPositionAsync(0);
        setPositionMillis(0);
        if(isPlaying) await sound.pauseAsync();
        setIsPlaying(false);
      } catch (e) {
        Alert.alert("Error", "Could not reset track.");
      }
    }
  };

  const toggleLoop = async () => {
    if (sound) {
      try {
        const newLoopStatus = !isLooping;
        await sound.setIsLoopingAsync(newLoopStatus);
        setIsLooping(newLoopStatus);
      } catch (e) {
        Alert.alert("Error", "Could not change loop mode.");
      }
    }
  };

  const handleSeek = async (value: number) => {
    if (sound && durationMillis) {
      try {
        const newPosition = value * durationMillis;
        await sound.setPositionAsync(newPosition);
        setPositionMillis(newPosition);
      } catch (e) {
        console.error("Seek error:", e)
      }
    }
  };

  if (isLoading || !meditation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00796B" />
        <Text style={styles.loadingText}>Loading meditation...</Text>
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
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={(durationMillis && durationMillis > 0) ? positionMillis / durationMillis : 0}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#B2DFDB"
            thumbTintColor="#FFFFFF"
            onSlidingComplete={handleSeek}
            disabled={!sound || !durationMillis}
          />

          <View style={styles.timerContainer}>
            <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
            <Text style={styles.timeText}> / </Text>
            <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
          </View>

          <TouchableOpacity onPress={handlePlayPause} style={styles.playButton} disabled={!sound}>
            <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={80} color={sound ? "#FFFFFF" : "#a0a0a0"} />
          </TouchableOpacity>

          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={handleReset} style={styles.controlButton} disabled={!sound}>
              <Ionicons name="refresh-circle" size={50} color={sound ? "#FFFFFF" : "#a0a0a0"} />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleLoop} style={styles.controlButton} disabled={!sound}>
              <Ionicons name={isLooping ? "repeat" : "repeat-outline"} size={50} color={isLooping && sound ? "#4CAF50" : (sound ? "#FFFFFF" : "#a0a0a0")} />
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
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(224, 242, 247, 0.8)',
  },
  loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#004D40'
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
  slider: {
    width: '90%',
    height: 40,
    marginBottom: 10,
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
  controlsRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  controlButton: {
    marginHorizontal: 20,
  }
});
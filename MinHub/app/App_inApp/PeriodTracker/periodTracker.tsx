import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import * as Progress from 'react-native-progress';
import { MEDITATIONS_DATA, Meditation } from '../meditations';

const SESSIONS_COUNT_STORAGE_KEY = '@meditationApp_sessionsCount_v1';

export default function MeditationPlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meditation, setMeditation] = useState<Meditation | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [bellSound, setBellSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [durationMillis, setDurationMillis] = useState<number | null>(null);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [breathingAnimation] = useState(new Animated.Value(0));

  const [playStartBell, setPlayStartBell] = useState<boolean>(false);
  const [playEndBell, setPlayEndBell] = useState<boolean>(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);


  useEffect(() => {
    const meditationDetails = MEDITATIONS_DATA.find((m: Meditation) => m.id === id);
    if (meditationDetails) {
      setMeditation(meditationDetails);
    } else {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    }
  }, [id, router]);

  const incrementSessionsCount = async () => {
    try {
      const currentCountStr = await AsyncStorage.getItem(SESSIONS_COUNT_STORAGE_KEY);
      const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
      await AsyncStorage.setItem(SESSIONS_COUNT_STORAGE_KEY, (currentCount + 1).toString());
    } catch (e) {
      // Errore silente
    }
  };

  const formatTime = (millis: number | null | undefined): string => {
    if (millis == null || Number.isNaN(millis) || millis < 0) return '00:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const loadSoundAsync = useCallback(async (currentMeditation: Meditation) => {
    if (!currentMeditation) {
        if(isMountedRef.current) setIsLoading(false);
        Alert.alert("Errore Meditazione", "Dettagli meditazione non trovati.");
        return null;
    }
    if (!currentMeditation.audioFile) {
        if(isMountedRef.current) setIsLoading(false);
        Alert.alert("Errore Audio", `File audio non specificato o non valido per la meditazione: "${currentMeditation.title}". Controlla meditations.ts.`);
        return null;
    }

    if(isMountedRef.current) setIsLoading(true);
    let newSoundInstance: Audio.Sound | null = null;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });

      const { sound: createdSound } = await Audio.Sound.createAsync(
        currentMeditation.audioFile,
        { shouldPlay: false },
        (playbackStatus) => {
          if (!isMountedRef.current) return;
          if (!playbackStatus.isLoaded) {
            if (playbackStatus.error) Alert.alert("Errore Audio", `Caricamento fallito: ${playbackStatus.error}`);
          } else {
            setPositionMillis(playbackStatus.positionMillis);
            setDurationMillis(playbackStatus.durationMillis ?? null);
            if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
              if(isMountedRef.current) setIsPlaying(false);
              createdSound.setPositionAsync(0).catch(() => {});
              if(isMountedRef.current) setPositionMillis(0);
              incrementSessionsCount();
              if (playEndBell && bellSound) {
                bellSound.replayAsync().catch(() => {});
              }
              Alert.alert("Meditazione Completata", "Ottimo lavoro!");
            }
          }
        }
      );
      newSoundInstance = createdSound;
    } catch (error: any) {
      Alert.alert("Errore Audio", `Impossibile caricare: ${error.message || error}`);
    } finally {
      if(isMountedRef.current) setIsLoading(false);
    }
    return newSoundInstance;
  }, [playEndBell, bellSound]);

  useEffect(() => {
    const loadInitialBellSound = async () => {
      try {
        const { sound: loadedBellSound } = await Audio.Sound.createAsync(require('../../../../assets/audio/bell.mp3'));
        if (isMountedRef.current) setBellSound(loadedBellSound);
      } catch (error) {
        Alert.alert("Errore Campanella", "Impossibile caricare il suono della campanella.");
      }
    };
    loadInitialBellSound();
    return () => {
        bellSound?.unloadAsync().catch(() => {});
    };
  }, []);


  useEffect(() => {
    let currentMeditationSoundRef: Audio.Sound | null = null;
    const setupMainAudio = async () => {
      if (meditation && isMountedRef.current) {
        if (sound) {
          await sound.unloadAsync();
          if (isMountedRef.current) {
            setSound(null);
            setIsPlaying(false);
            setPositionMillis(0);
            setDurationMillis(null);
          }
        }
        const newLoadedSound = await loadSoundAsync(meditation);
        if (isMountedRef.current && newLoadedSound) {
          currentMeditationSoundRef = newLoadedSound;
          setSound(newLoadedSound);
        }
      } else if (!meditation && sound && isMountedRef.current) {
          await sound.unloadAsync();
          if (isMountedRef.current) setSound(null);
      }
    };

    setupMainAudio();

    return () => {
      currentMeditationSoundRef?.unloadAsync().catch(() => {});
    };
  }, [meditation, loadSoundAsync]);


  useEffect(() => {
    let animationSequence: Animated.CompositeAnimation | null = null;
    if (isPlaying && sound) {
      const breathDuration = 6000;
      const inhale = Animated.timing(breathingAnimation, { toValue: 1, duration: breathDuration / 2, useNativeDriver: true });
      const exhale = Animated.timing(breathingAnimation, { toValue: 0, duration: breathDuration / 2, useNativeDriver: true });
      animationSequence = Animated.loop(Animated.sequence([inhale, exhale]));
      animationSequence.start();
    } else {
      animationSequence?.stop();
      breathingAnimation.setValue(0);
    }
    return () => {
      animationSequence?.stop();
    };
  }, [isPlaying, sound, breathingAnimation]);

  const handlePlayPause = async () => {
    if (!sound && meditation) {
        const reloadedSound = await loadSoundAsync(meditation);
        if (reloadedSound) {
            if(isMountedRef.current) setSound(reloadedSound);
            try {
                if (playStartBell && bellSound && !isPlaying) {
                    await bellSound.replayAsync().catch(()=>{});
                }
                await reloadedSound.playAsync();
                if (isMountedRef.current) setIsPlaying(true);
            } catch(e: any){
                 Alert.alert("Errore Player", `Riproduzione fallita: ${e.message || e}`);
            }
        }
        return;
    }
    if (!sound) return;

    try {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
            Alert.alert("Errore Player", "Suono non caricato. Riprova.");
            if (meditation) await loadSoundAsync(meditation);
            return;
        }

        if (isPlaying) {
            await sound.pauseAsync();
        } else {
            if (playStartBell && bellSound && positionMillis < 1000 && !isPlaying ) {
                 await bellSound.replayAsync().catch(()=>{});
            }
            if (status.didJustFinish) {
                await sound.replayAsync();
            } else {
                await sound.playAsync();
            }
        }
        if (isMountedRef.current) setIsPlaying(!isPlaying);
    } catch(error: any) {
        Alert.alert("Errore Player", `Azione fallita: ${error.message || error}`);
    }
  };

  if (!meditation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Meditazione non trovata o ID non valido.</Text>
      </SafeAreaView>
    );
  }
  if (isLoading && !sound) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00796B" />
        <Text>Caricamento meditazione...</Text>
      </SafeAreaView>
    );
  }

  const animatedCircleStyle = {
    transform: [ { scale: breathingAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) } ],
    opacity: breathingAnimation.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1, 0.6] })
  };
  const progress = durationMillis && durationMillis > 0 && positionMillis >= 0 ? positionMillis / durationMillis : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: meditation.title }} />
       <ImageBackground
        source={require('../../../../assets/images/meditationIMG/background_player.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <Animated.View style={[styles.breathingCircle, animatedCircleStyle]} />
          <Text style={styles.title}>{meditation.title}</Text>
          <Text style={styles.description}>{meditation.description}</Text>

          <Progress.Bar
            progress={progress > 1 ? 1 : progress < 0 ? 0 : progress}
            width={Dimensions.get('window').width * 0.8}
            height={8}
            color={"rgba(255, 255, 255, 0.7)"}
            unfilledColor={"rgba(0, 0, 0, 0.2)"}
            borderColor={"rgba(255, 255, 255, 0.3)"}
            borderWidth={1}
            borderRadius={5}
            style={styles.progressBar}
          />
          <View style={styles.timerContainer}>
            <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
            <Text style={styles.timeText}> / </Text>
            <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
          </View>

          <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
            <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={80} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.settingsContainer}>
            <TouchableOpacity onPress={() => setPlayStartBell(!playStartBell)} style={[styles.settingButton, playStartBell && styles.settingButtonActive]}>
                <Ionicons name={playStartBell ? "notifications" : "notifications-off-outline"} size={20} color="#FFFFFF" />
                <Text style={styles.settingText}> Inizio</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPlayEndBell(!playEndBell)} style={[styles.settingButton, playEndBell && styles.settingButtonActive]}>
                <Ionicons name={playEndBell ? "notifications" : "notifications-off-outline"} size={20} color="#FFFFFF" />
                <Text style={styles.settingText}> Fine</Text>
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
    backgroundColor: 'rgba(224, 242, 247, 0.9)',
    zIndex: 10,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  breathingCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 30,
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
    marginBottom: 15,
    color: '#F5F5F5',
    paddingHorizontal: 10,
  },
  progressBar: {
    alignSelf: 'center',
    marginVertical: 10,
  },
  timerContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  timeText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums']
  },
  playButton: {
    padding: 10,
    marginBottom:15,
  },
  settingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  settingButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  settingText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontSize: 12,
  },
});
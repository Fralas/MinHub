import { Ionicons } from '@expo/vector-icons';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

  const loadSound = useCallback(async () => {
    if (!meditation || !meditation.audioFile) {
        setIsLoading(false);
        Alert.alert("Errore Audio", "File audio non specificato per questa meditazione.");
        return;
    }
    if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        setPositionMillis(0);
    }

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
              Alert.alert("Errore Audio", `Impossibile caricare la meditazione: ${playbackStatus.error}`);
            }
          } else {
            setPositionMillis(playbackStatus.positionMillis);
            setDurationMillis(playbackStatus.durationMillis ?? null);
            if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
              setIsPlaying(false);
              newSound.setPositionAsync(0);
              setPositionMillis(0);
            }
          }
        }
      );
      setSound(newSound);
    } catch (error) {
      Alert.alert("Errore Audio", "Impossibile caricare il suono.");
    } finally {
      setIsLoading(false);
    }
  }, [meditation, sound]);

  useEffect(() => {
    if (meditation) {
      loadSound();
    }
  }, [meditation, loadSound]);

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);


  const handlePlayPause = async () => {
    if (!sound) return;
    try {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
            await loadSound(); 
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
    } catch(error) {
        Alert.alert("Errore Player", "Impossibile eseguire l'azione.");
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
    backgroundColor: 'rgba(0,0,0,0.1)'
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
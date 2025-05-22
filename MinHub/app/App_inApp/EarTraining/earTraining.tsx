import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES = [
  { name: 'C', file: require('./notes/c6.mp3') },
  { name: 'D', file: require('./notes/d6.mp3') },
  { name: 'E', file: require('./notes/e6.mp3') },
  { name: 'F', file: require('./notes/f6.mp3') },
  { name: 'G', file: require('./notes/g6.mp3') },
  { name: 'A', file: require('./notes/a6.mp3') },
  { name: 'B', file: require('./notes/b6.mp3') },
];

export default function EarTraining() {
  const [currentNote, setCurrentNote] = useState<{ name: string; file: any } | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [demoSound, setDemoSound] = useState<Audio.Sound | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [gameStarted, setGameStarted] = useState(false);

  const HIGH_SCORE_KEY = 'EAR_TRAINING_HIGH_SCORE';

  const getOptionCount = () => {
    switch (difficulty) {
      case 'Easy': return 2;
      case 'Medium': return 4;
      case 'Hard': return 6;
      default: return 3;
    }
  };

  const loadHighScore = async () => {
    const stored = await AsyncStorage.getItem(HIGH_SCORE_KEY);
    if (stored !== null) setMaxScore(parseInt(stored));
  };

  const saveHighScore = async (newScore: number) => {
    await AsyncStorage.setItem(HIGH_SCORE_KEY, newScore.toString());
  };

  const generateQuestion = async () => {
    const count = getOptionCount();
    const correct = NOTES[Math.floor(Math.random() * NOTES.length)];

    const shuffled = NOTES
      .filter((note) => note.name !== correct.name)
      .sort(() => 0.5 - Math.random())
      .slice(0, count - 1);

    const choices = [...shuffled.map((n) => n.name), correct.name].sort(() => 0.5 - Math.random());

    setCurrentNote(correct);
    setOptions(choices);

    const { sound } = await Audio.Sound.createAsync(correct.file);
    if (sound) {
      if (demoSound) await demoSound.unloadAsync();
      if (sound) await sound.unloadAsync();
    }
    setSound(sound);
    await sound.playAsync();
  };

  const handleAnswer = (answer: string) => {
    if (answer === currentNote?.name) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newScore > maxScore) {
        setMaxScore(newScore);
        saveHighScore(newScore);
      }
      Alert.alert('Correct!', 'Well done!');
    } else {
      setStreak(0);
      Alert.alert('Incorrect', `It was ${currentNote?.name}`);
    }
    generateQuestion();
  };

  const handleStartGame = (selectedDifficulty: 'Easy' | 'Medium' | 'Hard') => {
    setDifficulty(selectedDifficulty);
    setScore(0);
    setStreak(0);
    setGameStarted(true);
    generateQuestion();
  };

  const handleBackToMenu = () => {
    setGameStarted(false);
    setOptions([]);
    if (sound) sound.unloadAsync();
  };

  const playDemoNote = async (noteFile: any) => {
    if (demoSound) await demoSound.unloadAsync();
    const { sound } = await Audio.Sound.createAsync(noteFile);
    setDemoSound(sound);
    await sound.playAsync();
  };

  useEffect(() => {
    loadHighScore();
    return () => {
      if (sound) sound.unloadAsync();
      if (demoSound) demoSound.unloadAsync();
    };
  }, []);

  if (!gameStarted) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🎼 Ear Training</Text>
        <Text style={styles.instruction}>Select Difficulty to Start:</Text>
        <View style={styles.buttonContainer}><Button title="Easy" onPress={() => handleStartGame('Easy')} /></View>
        <View style={styles.buttonContainer}><Button title="Medium" onPress={() => handleStartGame('Medium')} /></View>
        <View style={styles.buttonContainer}><Button title="Hard" onPress={() => handleStartGame('Hard')} /></View>

        <Text style={[styles.instruction, { marginTop: 30 }]}>🎧 Demo Notes:</Text>
        {NOTES.map((note) => (
          <View style={styles.buttonContainer} key={note.name}>
            <Button title={`Play ${note.name}`} onPress={() => playDemoNote(note.file)} />
          </View>
        ))}

        <Text style={styles.scoreText}>🏆 High Score: {maxScore}</Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 Ear Training - {difficulty} Mode</Text>
      <Text style={styles.instruction}>Listen and choose the correct note:</Text>

      <Text style={styles.scoreText}>Score: {score}</Text>
      <Text style={styles.scoreText}>Streak: {streak}</Text>
      <Text style={styles.scoreText}>🏆 High Score: {maxScore}</Text>

      {options.map((option) => (
        <View style={styles.buttonContainer} key={option}>
          <Button title={option} onPress={() => handleAnswer(option)} />
        </View>
      ))}

      <View style={styles.backButton}>
        <Button title="⬅ Back to Menu" color="#888" onPress={handleBackToMenu} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  instruction: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    marginVertical: 8,
  },
  backButton: {
    marginTop: 30,
  },
  scoreText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 5,
  },
});
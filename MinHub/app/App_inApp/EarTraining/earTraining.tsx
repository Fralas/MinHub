import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView } from 'react-native';
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
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState<{ name: string; file: any } | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(0);

  const HIGH_SCORE_KEY = 'EAR_TRAINING_HIGH_SCORE';

  useEffect(() => {
    if (difficulty) {
      generateQuestion();
      loadHighScore();
    }

    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [difficulty]);

  const loadHighScore = async () => {
    const stored = await AsyncStorage.getItem(HIGH_SCORE_KEY);
    if (stored) setMaxScore(parseInt(stored));
  };

  const saveHighScore = async (score: number) => {
    await AsyncStorage.setItem(HIGH_SCORE_KEY, score.toString());
  };

  const generateQuestion = async () => {
    if (sound) await sound.unloadAsync();

    const numOptions = difficulty === 'Easy' ? 2 : difficulty === 'Medium' ? 3 : 4;

    const correct = NOTES[Math.floor(Math.random() * NOTES.length)];

    const shuffled = NOTES
      .filter((note) => note.name !== correct.name)
      .sort(() => 0.5 - Math.random())
      .slice(0, numOptions - 1);

    const choices = [...shuffled.map((n) => n.name), correct.name].sort(() => 0.5 - Math.random());

    setCurrentNote(correct);
    setOptions(choices);

    const { sound: newSound } = await Audio.Sound.createAsync(correct.file);
    setSound(newSound);
    await newSound.playAsync();
  }


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
      setScore(0);
      setStreak(0);
      Alert.alert('Incorrect', `It was ${currentNote?.name}`);
    }
    generateQuestion();
  };

  const handleBackToMenu = () => {
    setDifficulty(null);
    setScore(0);
    setStreak(0);
    setCurrentNote(null);
    setOptions([]);
  };

  const playNote = async (file: any) => {
    const { sound } = await Audio.Sound.createAsync(file);
    await sound.playAsync();
  };

  const repeatNote = async () => {
    if (sound && currentNote) {
      await sound.replayAsync();
    } else {
      Alert.alert('Note not available', 'Please wait for the next note to load.');
    }
  };

  if (!difficulty) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎵 Choose Difficulty</Text>
        <View style={styles.buttonContainer}>
          <Button title="Easy (2 options)" onPress={() => setDifficulty('Easy')} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Medium (3 options)" onPress={() => setDifficulty('Medium')} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Hard (4 options)" onPress={() => setDifficulty('Hard')} />
        </View>

        <Text style={styles.demoTitle}>🎧 Demo Notes</Text>
        <ScrollView style={{ maxHeight: 200 }}>
          {NOTES.map((note) => (
            <View key={note.name} style={styles.buttonContainer}>
              <Button title={`Play ${note.name}`} onPress={() => playNote(note.file)} />
            </View>
          ))}
        </ScrollView>
      </View>
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

      <View style={styles.buttonContainer}>
        <Button title="🔁 Repeat Note" onPress={repeatNote} />
      </View>

      <View style={styles.backButton}>
        <Button title="⬅ Back to Menu" color="#888" onPress={handleBackToMenu} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 30,
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
  demoTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 10,
    textAlign: 'center',
  },
});
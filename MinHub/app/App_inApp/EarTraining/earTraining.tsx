import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';

const NOTES = [
  { name: 'C', file: require('./notes/c6.mp3') },
  { name: 'D', file: require('./notes/d6.mp3') },
  { name: 'E', file: require('./notes/e6.mp3') },
  { name: 'F', file: require('./notes/f6.mp3') },
  { name: 'G', file: require('./notes/g6.mp3') },
  { name: 'A', file: require('./notes/a6.mp3') },
  { name: 'B', file: require('./notes/b6.mp3') },
];

type Difficulty = 'Easy' | 'Medium' | 'Hard';

export default function EarTraining() {
  const [currentNote, setCurrentNote] = useState<{ name: string; file: any } | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  const getOptionCount = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'Easy': return 2;
      case 'Medium': return 4;
      case 'Hard': return 7;
    }
  };

  const generateQuestion = async () => {
    if (!difficulty) return;

    const correct = NOTES[Math.floor(Math.random() * NOTES.length)];

    const optionCount = getOptionCount(difficulty) - 1;
    const shuffled = NOTES
      .filter((note) => note.name !== correct.name)
      .sort(() => 0.5 - Math.random())
      .slice(0, optionCount);

    const choices = [...shuffled.map((n) => n.name), correct.name].sort(() => 0.5 - Math.random());

    setCurrentNote(correct);
    setOptions(choices);

    const { sound } = await Audio.Sound.createAsync(correct.file);
    setSound(sound);
    await sound.playAsync();
  };

  const handleAnswer = (answer: string) => {
    if (answer === currentNote?.name) {
      Alert.alert('Correct!', 'Well done!');
      const newScore = score + 1;
      setScore(newScore);
      setStreak(streak + 1);
      if (newScore > maxScore) setMaxScore(newScore);
    } else {
      Alert.alert('Incorrect', `It was ${currentNote?.name}`);
      setScore(0);
      setStreak(0);
    }
    generateQuestion();
  };

  const handleStartGame = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setGameStarted(true);
    setScore(0);
    setStreak(0);
  };

  const handleBackToMenu = () => {
    setGameStarted(false);
    setDifficulty(null);
    setOptions([]);
    setCurrentNote(null);
    setScore(0);
    setStreak(0);
  };

  useEffect(() => {
    if (gameStarted) {
      generateQuestion();
    }

    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [gameStarted]);

  if (!gameStarted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎼 Ear Training</Text>
        <Text style={styles.instruction}>Select Difficulty to Start:</Text>
        <View style={styles.buttonContainer}><Button title="Easy" onPress={() => handleStartGame('Easy')} /></View>
        <View style={styles.buttonContainer}><Button title="Medium" onPress={() => handleStartGame('Medium')} /></View>
        <View style={styles.buttonContainer}><Button title="Hard" onPress={() => handleStartGame('Hard')} /></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 Ear Training - {difficulty} Mode</Text>
      <Text style={styles.instruction}>Listen and choose the correct note:</Text>

      <Text style={styles.scoreText}>Score: {score}</Text>
      <Text style={styles.scoreText}>Streak: {streak}</Text>
      <Text style={styles.scoreText}>Max Score: {maxScore}</Text>

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
    marginVertical: 4,
    fontWeight: '500',
  },
});
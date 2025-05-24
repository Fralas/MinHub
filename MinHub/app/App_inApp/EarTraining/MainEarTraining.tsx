import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MILESTONES } from './milestones';
import { NOTES } from './notes';

type EarTrainingStackParamList = {
  index: undefined;
  mainEarTraining: undefined;
  speedMode: undefined;
  demoNotes: undefined;
  milestones: { unlockedMilestones: string[] };
};

type NavigationProp = NativeStackNavigationProp<EarTrainingStackParamList, 'mainEarTraining'>;

export default function MainEarTraining() {
  const navigation = useNavigation<NavigationProp>();

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'speed' | null>(null);
  const [currentNote, setCurrentNote] = useState<{ name: string; file: any } | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [unlockedMilestones, setUnlockedMilestones] = useState<string[]>([]);
  const [speedScore, setSpeedScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    loadHighScore();
    return () => {
      soundRef.current?.unloadAsync();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    checkMilestones();
  }, [streak, maxScore]);

  useEffect(() => {
    if (difficulty === 'speed' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && difficulty === 'speed') {
      Alert.alert('⏱️ Time’s up!', `You scored ${speedScore} points!`);
      setDifficulty(null);
    }
  }, [timeLeft, difficulty]);

  useEffect(() => {
    if (difficulty) {
      generateQuestion();
    }
  }, [difficulty]);

  const loadHighScore = async () => {
    const stored = await AsyncStorage.getItem('highScore');
    if (stored) setHighScore(parseInt(stored));
  };

  const saveHighScore = async (score: number) => {
    await AsyncStorage.setItem('highScore', score.toString());
  };

  const checkMilestones = () => {
    const newUnlocked = [...unlockedMilestones];
    MILESTONES.forEach(milestone => {
      const alreadyUnlocked = newUnlocked.includes(milestone.id);
      if (!alreadyUnlocked) {
        if (
          (milestone.id.startsWith('streak') && streak >= parseInt(milestone.id.split('-')[1])) ||
          (milestone.id.startsWith('score') && maxScore >= parseInt(milestone.id.split('-')[1]))
        ) {
          newUnlocked.push(milestone.id);
        }
      }
    });
    setUnlockedMilestones(newUnlocked);
  };

  const generateQuestion = async () => {
    if (soundRef.current) await soundRef.current.unloadAsync();

    const correct = NOTES[Math.floor(Math.random() * NOTES.length)];
    const wrongAnswers = NOTES.filter(n => n.name !== correct.name).sort(() => 0.5 - Math.random());

    let numChoices = 7; // Default for 'hard'
    if (difficulty === 'easy') numChoices = 2;
    else if (difficulty === 'medium') numChoices = 4;

    const choices = [
      ...wrongAnswers.slice(0, numChoices - 1).map(n => n.name),
      correct.name,
    ].sort(() => 0.5 - Math.random());

    setCurrentNote(correct);
    setOptions(choices);

    const { sound } = await Audio.Sound.createAsync(correct.file);
    soundRef.current = sound;
    await sound.playAsync();
  };

  const handleAnswer = (answer: string) => {
    if (answer === currentNote?.name) {
      if (difficulty === 'speed') {
        setSpeedScore(prev => prev + 1);
      } else {
        const newStreak = streak + 1;
        const newMax = maxScore + 1;
        setStreak(newStreak);
        setMaxScore(newMax);
        if (newMax > highScore) {
          setHighScore(newMax);
          saveHighScore(newMax);
        }
        Alert.alert('Correct!', 'Well done!');
      }
    } else {
      if (difficulty === 'speed') {
        setSpeedScore(prev => Math.max(prev - 1, 0));
      } else {
        Alert.alert('Incorrect', `It was ${currentNote?.name}`);
        setStreak(0);
      }
    }
    generateQuestion();
  };

  const handleRepeat = async () => {
    if (currentNote && soundRef.current) {
      await soundRef.current.replayAsync();
    }
  };

  const startGame = (selected: 'easy' | 'medium' | 'hard' | 'speed') => {
    setDifficulty(selected);
    if (selected === 'speed') {
      setSpeedScore(0);
      setTimeLeft(60);
    }
  };

  if (!difficulty) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎵 Ear Training</Text>
        <Text style={styles.instruction}>Select Mode:</Text>
        <View style={styles.buttonContainer}><Button title="Easy" onPress={() => startGame('easy')} /></View>
        <View style={styles.buttonContainer}><Button title="Medium" onPress={() => startGame('medium')} /></View>
        <View style={styles.buttonContainer}><Button title="Hard" onPress={() => startGame('hard')} /></View>
        <View style={styles.buttonContainer}><Button title="⚡ Speed Mode" onPress={() => startGame('speed')} /></View>
        <View style={styles.buttonContainer}>
          <Button title="🎧 Demo Notes" onPress={() => navigation.navigate('demoNotes')} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎵 Ear Training</Text>

      {difficulty === 'speed' && (
        <>
          <Text style={styles.stats}>⏱ Time Left: {timeLeft}s</Text>
          <Text style={styles.stats}>⚡ Score: {speedScore}</Text>
        </>
      )}

      {difficulty !== 'speed' && (
        <>
          <Text style={styles.instruction}>Listen to the note and choose the correct name:</Text>
          <Text style={styles.stats}>🔥 Streak: {streak}</Text>
          <Text style={styles.stats}>🏆 Max Score: {maxScore}</Text>
          <Text style={styles.stats}>🎯 High Score: {highScore}</Text>
        </>
      )}

      {options.map((option) => (
        <View style={styles.buttonContainer} key={option}>
          <Button title={option} onPress={() => handleAnswer(option)} />
        </View>
      ))}

      <View style={styles.buttonContainer}>
        <Button title="🔁 Repeat Note" onPress={handleRepeat} />
      </View>

      {difficulty !== 'speed' && (
        <View style={styles.buttonContainer}>
          <Button
            title="🏅 View Milestones"
            onPress={() => navigation.navigate('milestones', { unlockedMilestones })}
          />
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title="🔙 Back to Menu" onPress={() => setDifficulty(null)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    marginVertical: 6,
    width: '100%',
  },
  stats: {
    fontSize: 16,
    marginTop: 10,
  },
});
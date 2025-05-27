import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  Animated,
  Switch,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NUM_PAIRS_EASY = 6;
const NUM_PAIRS_MEDIUM = 8;
const NUM_PAIRS_HARD = 12;
const MAX_LIVES = 5;
const TIMED_MODE_DURATION = 60; // seconds

const SCREEN_WIDTH = Dimensions.get('window').width;

const generateShuffledCards = (numPairs: number): number[] => {
  const cards = [];
  for (let i = 1; i <= numPairs; i++) {
    cards.push(i);
    cards.push(i);
  }
  return cards.sort(() => Math.random() - 0.5);
};

type Difficulty = 'easy' | 'medium' | 'hard';
type GameMode = 'classic' | 'timed';

export default function MemoryGame() {
  const [cards, setCards] = useState<number[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [lives, setLives] = useState<number>(MAX_LIVES);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(TIMED_MODE_DURATION);
  const [startTime, setStartTime] = useState<number>(0);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerWidthAnim = useRef(new Animated.Value(1)).current;

  const getNumPairs = (): number => {
    switch (difficulty) {
      case 'easy': return NUM_PAIRS_EASY;
      case 'medium': return NUM_PAIRS_MEDIUM;
      case 'hard': return NUM_PAIRS_HARD;
    }
  };

  const resetGame = () => {
    setMatchedIndices([]);
    setFlippedIndices([]);
    setLives(MAX_LIVES);
    setScore(0);
    setGameOver(false);
    const shuffled = generateShuffledCards(getNumPairs());
    setCards(shuffled);
    if (gameMode === 'timed') {
      setTimeLeft(TIMED_MODE_DURATION);
      timerWidthAnim.setValue(1);
    }
    if (gameMode === 'classic') {
      setStartTime(Date.now());
    }
  };

  useEffect(() => {
    resetGame();
  }, [difficulty, gameMode]);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      const [first, second] = flippedIndices;
      if (cards[first] === cards[second]) {
        setMatchedIndices(prev => [...prev, first, second]);
        setScore(prev => prev + 100);
        setFlippedIndices([]);
        if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
          setLives(prev => {
            const newLives = prev - 1;
            if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (newLives <= 0) {
              setGameOver(true);
              clearInterval(timerRef.current!);
              updateStats(false, 0);
              Alert.alert('Game Over', `You ran out of lives!\nYour Score: ${score}`, [
                { text: 'Retry', onPress: () => resetGame() },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }
            return newLives;
          });
        }, 1000);
      }
    }
  }, [flippedIndices]);

  useEffect(() => {
    if (matchedIndices.length === cards.length && cards.length > 0) {
      clearInterval(timerRef.current!);
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const duration = (Date.now() - startTime) / 1000;
      updateStats(true, duration);
      Alert.alert('You Win!', `All cards matched!\nScore: ${score}`);
    }
  }, [matchedIndices]);

  useEffect(() => {
    if (gameMode === 'timed') {
      timerRef.current && clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameOver(true);
            if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            updateStats(false, 0);
            Alert.alert('Time Up!', `You ran out of time!\nYour Score: ${score}`, [
              { text: 'Retry', onPress: () => resetGame() },
              { text: 'Cancel', style: 'cancel' },
            ]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Animated.timing(timerWidthAnim, {
        toValue: 0,
        duration: TIMED_MODE_DURATION * 1000,
        useNativeDriver: false,
      }).start();

      return () => clearInterval(timerRef.current!);
    }
  }, [gameMode]);

  const handleCardPress = (index: number) => {
    if (
      flippedIndices.length < 2 &&
      !flippedIndices.includes(index) &&
      !matchedIndices.includes(index) &&
      !gameOver
    ) {
      setFlippedIndices(prev => [...prev, index]);
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const updateStats = async (won: boolean, timeTaken: number) => {
    try {
      const raw = await AsyncStorage.getItem('memory_stats');
      const stats = raw ? JSON.parse(raw) : { gamesPlayed: 0, gamesWon: 0, totalTime: 0 };
      stats.gamesPlayed += 1;
      if (won) {
        stats.gamesWon += 1;
        stats.totalTime += timeTaken;
      }
      await AsyncStorage.setItem('memory_stats', JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to save stats:', e);
    }
  };

  const showStats = async () => {
    try {
      const raw = await AsyncStorage.getItem('memory_stats');
      const stats = raw ? JSON.parse(raw) : { gamesPlayed: 0, gamesWon: 0, totalTime: 0 };
      const avgTime =
        stats.gamesWon > 0 ? (stats.totalTime / stats.gamesWon).toFixed(2) : 'N/A';
      Alert.alert(
        'Statistics',
        `Games Played: ${stats.gamesPlayed}\nGames Won: ${stats.gamesWon}\nAvg Time (Classic Wins): ${avgTime}s`
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to load statistics.');
    }
  };

  const renderCard = (value: number, index: number) => {
    const isFlipped = flippedIndices.includes(index) || matchedIndices.includes(index);
    return (
      <TouchableOpacity
        key={index}
        style={[styles.card, isFlipped && styles.flippedCard]}
        onPress={() => handleCardPress(index)}
        disabled={isFlipped || gameOver}
      >
        <Text style={styles.cardText}>{isFlipped ? value : '?'}</Text>
      </TouchableOpacity>
    );
  };

  const animatedBarWidth = timerWidthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Memory Game</Text>

      <View style={styles.modeContainer}>
        {(['classic', 'timed'] as GameMode[]).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.difficultyButton,
              gameMode === mode && styles.selectedButton,
            ]}
            onPress={() => setGameMode(mode)}
          >
            <Text
              style={[
                styles.difficultyText,
                gameMode === mode && styles.selectedText,
              ]}
            >
              {mode.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.difficultyContainer}>
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.difficultyButton,
              difficulty === mode && styles.selectedButton,
            ]}
            onPress={() => setDifficulty(mode)}
          >
            <Text
              style={[
                styles.difficultyText,
                difficulty === mode && styles.selectedText,
              ]}
            >
              {mode.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.infoText}>Haptics:</Text>
        <Switch
          value={hapticsEnabled}
          onValueChange={setHapticsEnabled}
          thumbColor={hapticsEnabled ? '#4caf50' : '#ccc'}
        />
      </View>

      <Text style={styles.infoText}>
        Lives: {lives} | Score: {score}
        {gameMode === 'timed' && ` | Time Left: ${timeLeft}s`}
      </Text>

      {gameMode === 'timed' && (
        <View style={styles.timerBarContainer}>
          <Animated.View style={[styles.timerBar, { width: animatedBarWidth }]} />
        </View>
      )}

      <View style={styles.grid}>
        {cards.map((value, index) => renderCard(value, index))}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
        <Text style={styles.resetText}>Restart</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.statsButton} onPress={showStats}>
        <Text style={styles.resetText}>Statistics</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const CARD_SIZE = SCREEN_WIDTH / 5;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  difficultyContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  modeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  difficultyButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#ddd',
    borderRadius: 6,
  },
  selectedButton: {
    backgroundColor: '#4caf50',
  },
  difficultyText: {
    fontWeight: '600',
    color: '#333',
  },
  selectedText: {
    color: '#fff',
  },
  infoText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  timerBarContainer: {
    height: 10,
    width: '90%',
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    backgroundColor: '#f44336',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: SCREEN_WIDTH,
    padding: 5,
  },
  card: {
    width: CARD_SIZE - 10,
    height: CARD_SIZE - 10,
    margin: 5,
    backgroundColor: '#90caf9',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  flippedCard: {
    backgroundColor: '#64b5f6',
  },
  cardText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  resetButton: {
    marginTop: 20,
    backgroundColor: '#607d8b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  statsButton: {
    marginTop: 10,
    backgroundColor: '#9c27b0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

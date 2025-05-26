import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NUM_PAIRS_EASY = 6;
const NUM_PAIRS_MEDIUM = 8;
const NUM_PAIRS_HARD = 12;
const MAX_LIVES = 5;

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

export default function MemoryGame() {
  const [cards, setCards] = useState<number[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [lives, setLives] = useState<number>(MAX_LIVES);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);

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
  };

  const loadHighScore = async () => {
    try {
      const stored = await AsyncStorage.getItem('memory_high_score');
      if (stored !== null) {
        setHighScore(parseInt(stored));
      }
    } catch (e) {
      console.log('Error loading high score:', e);
    }
  };

  const saveHighScore = async (newScore: number) => {
    try {
      await AsyncStorage.setItem('memory_high_score', newScore.toString());
    } catch (e) {
      console.log('Error saving high score:', e);
    }
  };

  useEffect(() => {
    resetGame();
    loadHighScore();
  }, [difficulty]);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      const [first, second] = flippedIndices;
      if (cards[first] === cards[second]) {
        setMatchedIndices(prev => [...prev, first, second]);
        setScore(prev => prev + 100);
        setFlippedIndices([]);
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameOver(true);
              Alert.alert(
                'Game Over',
                `You ran out of lives!\nYour Score: ${score}`,
                [
                  { text: 'Retry', onPress: () => resetGame() },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }
            return newLives;
          });
        }, 1000);
      }
    }
  }, [flippedIndices]);

  useEffect(() => {
    if (matchedIndices.length === cards.length && cards.length > 0) {
      (async () => {
        Alert.alert('You Win!', `All cards matched!\nScore: ${score}`);
        if (score > highScore) {
          setHighScore(score);
          await saveHighScore(score);
        }
      })();
    }
  }, [matchedIndices]);

  const handleCardPress = (index: number) => {
    if (
      flippedIndices.length < 2 &&
      !flippedIndices.includes(index) &&
      !matchedIndices.includes(index) &&
      !gameOver
    ) {
      setFlippedIndices(prev => [...prev, index]);
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Memory Game</Text>

      <View style={styles.difficultyContainer}>
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.difficultyButton,
              difficulty === mode && styles.selectedButton
            ]}
            onPress={() => setDifficulty(mode)}
          >
            <Text
              style={[
                styles.difficultyText,
                difficulty === mode && styles.selectedText
              ]}
            >
              {mode.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.infoText}>
        Lives: {lives} | Score: {score} | High Score: {highScore}
      </Text>

      <View style={styles.grid}>
        {cards.map((value, index) => renderCard(value, index))}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
        <Text style={styles.resetText}>Restart</Text>
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
    marginBottom: 15,
    color: '#444',
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
  resetText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
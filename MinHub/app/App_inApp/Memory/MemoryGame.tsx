import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList
} from 'react-native';

const EMOJIS = ['🐶', '🐱', '🦊', '🐻', '🐼', '🐸', '🐵', '🦁'];

function shuffleArray(array: any[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function MemoryGame() {
  const [cards, setCards] = useState<{ id: number, emoji: string, flipped: boolean, matched: boolean }[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    const duplicated = [...EMOJIS, ...EMOJIS].map((emoji, index) => ({
      id: index,
      emoji,
      flipped: false,
      matched: false
    }));
    setCards(shuffleArray(duplicated));
    setFlippedCards([]);
    setMatchedCount(0);
  };

  const handleCardPress = (index: number) => {
    const newCards = [...cards];
    const flipped = flippedCards;

    if (newCards[index].flipped || newCards[index].matched || flipped.length === 2) return;

    newCards[index].flipped = true;
    flipped.push(index);
    setCards(newCards);
    setFlippedCards([...flipped]);

    if (flipped.length === 2) {
      const first = newCards[flipped[0]];
      const second = newCards[flipped[1]];

      if (first.emoji === second.emoji) {
        newCards[flipped[0]].matched = true;
        newCards[flipped[1]].matched = true;
        setMatchedCount(matchedCount + 1);
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          newCards[flipped[0]].flipped = false;
          newCards[flipped[1]].flipped = false;
          setCards([...newCards]);
          setFlippedCards([]);
        }, 800);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧠 Memory Game</Text>
      <FlatList
        data={cards}
        numColumns={4}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.card, item.matched && styles.cardMatched]}
            onPress={() => handleCardPress(index)}
          >
            <Text style={styles.cardText}>
              {item.flipped || item.matched ? item.emoji : '❓'}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.grid}
      />
      <Text style={styles.progressText}>
        Matches: {matchedCount} / {EMOJIS.length}
      </Text>
      <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
        <Text style={styles.resetText}>🔄 Restart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  grid: {
    alignItems: 'center',
  },
  card: {
    width: 70,
    height: 70,
    margin: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMatched: {
    backgroundColor: '#A5D6A7',
  },
  cardText: {
    fontSize: 32,
  },
  progressText: {
    marginTop: 20,
    fontSize: 18,
  },
  resetButton: {
    marginTop: 12,
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resetText: {
    color: 'white',
    fontSize: 16,
  },
});

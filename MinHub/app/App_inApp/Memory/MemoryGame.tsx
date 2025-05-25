import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';

const CARD_PAIRS = {
  Easy: 4,
  Medium: 8,
  Hard: 12,
};

const generateShuffledCards = (pairCount: number): { id: number; value: number; matched: boolean }[] => {
  const values = Array.from({ length: pairCount }, (_, i) => i + 1);
  const cards = [...values, ...values].map((value, index) => ({
    id: index,
    value,
    matched: false,
  }));
  return cards.sort(() => Math.random() - 0.5);
};

export default function MemoryGame() {
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [cards, setCards] = useState(() => generateShuffledCards(CARD_PAIRS[difficulty]));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    setCards(generateShuffledCards(CARD_PAIRS[difficulty]));
    setFlipped([]);
    setMatchedIds([]);
    setMoves(0);
  }, [difficulty]);

  useEffect(() => {
    if (flipped.length === 2) {
      const [firstIdx, secondIdx] = flipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];
      if (firstCard.value === secondCard.value) {
        setMatchedIds(prev => [...prev, firstCard.id, secondCard.id]);
        cards[firstIdx].matched = true;
        cards[secondIdx].matched = true;
      }
      setTimeout(() => setFlipped([]), 700);
      setMoves(prev => prev + 1);
    }
  }, [flipped]);

  useEffect(() => {
    if (matchedIds.length === cards.length && cards.length > 0) {
      Alert.alert('You Win!', `You matched all pairs in ${moves} moves.`, [
        { text: 'Play Again', onPress: () => setCards(generateShuffledCards(CARD_PAIRS[difficulty])) },
      ]);
    }
  }, [matchedIds]);

  const handleCardPress = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matchedIds.includes(cards[index].id)) return;
    setFlipped(prev => [...prev, index]);
  };

  const numColumns = 4;
  const { width } = Dimensions.get('window');
  const cardSize = (width - 40) / numColumns - 10;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Memory Game</Text>

      <View style={styles.difficultySelector}>
        {(['Easy', 'Medium', 'Hard'] as const).map(level => (
          <TouchableOpacity
            key={level}
            style={[
              styles.difficultyButton,
              difficulty === level && styles.difficultyButtonSelected,
            ]}
            onPress={() => setDifficulty(level)}
          >
            <Text style={difficulty === level ? styles.difficultyTextSelected : styles.difficultyText}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.moves}>Moves: {moves}</Text>

      <FlatList
        data={cards}
        numColumns={numColumns}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.board}
        renderItem={({ item, index }) => {
          const isFlipped = flipped.includes(index) || matchedIds.includes(item.id);
          return (
            <TouchableOpacity
              style={[styles.card, { width: cardSize, height: cardSize }, isFlipped && styles.cardFlipped]}
              onPress={() => handleCardPress(index)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardText}>{isFlipped ? item.value : '?'}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  difficultySelector: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  difficultyButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#888',
    backgroundColor: '#ffffff',
  },
  difficultyButtonSelected: {
    backgroundColor: '#3399FF',
    borderColor: '#3399FF',
  },
  difficultyText: {
    color: '#444',
  },
  difficultyTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  moves: {
    fontSize: 16,
    color: '#666',
    marginVertical: 5,
  },
  board: {
    paddingHorizontal: 10,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#cccccc',
    margin: 5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  cardFlipped: {
    backgroundColor: '#3399FF',
  },
  cardText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});
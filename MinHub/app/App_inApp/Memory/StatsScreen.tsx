import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GameRecord {
  score: number;
  result: 'win' | 'loss';
  mode: 'classic' | 'timed';
  difficulty: 'easy' | 'medium' | 'hard';
  timestamp: string;
}

export default function StatsScreen() {
  const [history, setHistory] = useState<GameRecord[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const stored = await AsyncStorage.getItem('memoryGameHistory');
      if (stored) setHistory(JSON.parse(stored));
    };
    loadStats();
  }, []);

  const totalGames = history.length;
  const wins = history.filter(h => h.result === 'win').length;
  const avgScore = totalGames > 0
    ? Math.round(history.reduce((acc, h) => acc + h.score, 0) / totalGames)
    : 0;
  const bestScore = history.reduce((max, h) => Math.max(max, h.score), 0);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Game Stats</Text>
      <Text>Total Games: {totalGames}</Text>
      <Text>Games Won: {wins}</Text>
      <Text>Average Score: {avgScore}</Text>
      <Text>Best Score: {bestScore}</Text>

      <Text style={styles.subheader}>History</Text>
      <FlatList
        data={history.reverse()}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text>{item.timestamp}</Text>
            <Text>{item.mode.toUpperCase()} - {item.difficulty.toUpperCase()}</Text>
            <Text>Score: {item.score} - {item.result.toUpperCase()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subheader: { fontSize: 18, marginTop: 20, marginBottom: 10 },
  historyItem: { marginBottom: 10, borderBottomWidth: 1, paddingBottom: 5 },
});
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { MILESTONES } from './milestones';
import { RouteProp } from '@react-navigation/native';
import { EarTrainingStackParamList } from './earTraining';

type MilestonesScreenProps = {
  route: RouteProp<EarTrainingStackParamList, 'Milestones'>;
};

export default function MilestonesScreen({ route }: MilestonesScreenProps) {
  const { unlockedMilestones } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏅 Milestones</Text>
      <FlatList
        data={MILESTONES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const unlocked = unlockedMilestones.includes(item.id);
          return (
            <View style={[styles.milestoneBox, unlocked ? styles.unlocked : styles.locked]}>
              <Text style={styles.milestoneTitle}>
                {unlocked ? '✅ ' : '🔒 '}
                {item.title}
              </Text>
              <Text>{item.description}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  milestoneBox: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  unlocked: {
    backgroundColor: '#e0ffe0',
    borderColor: '#30c230',
  },
  locked: {
    backgroundColor: '#f0f0f0',
    borderColor: '#aaa',
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
});

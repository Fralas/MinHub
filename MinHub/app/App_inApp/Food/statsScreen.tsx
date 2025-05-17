import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

type Props = {
  weeklyTotals: {
    carbs: number;
    protein: number;
    fat: number;
    calories: number;
  };
  selectedDay: string;
  getTotalNutritionForDay: (day: string) => {
    carbs: number;
    protein: number;
    fat: number;
    calories: number;
  };
  goBack: () => void;
};

export default function StatsScreen({ weeklyTotals, selectedDay, getTotalNutritionForDay, goBack }: Props) {
  const dailyTotals = getTotalNutritionForDay(selectedDay);
  const monthlyTotals = {
    carbs: weeklyTotals.carbs * 4,
    protein: weeklyTotals.protein * 4,
    fat: weeklyTotals.fat * 4,
    calories: weeklyTotals.calories * 4,
  };
  const yearlyTotals = {
    carbs: weeklyTotals.carbs * 52,
    protein: weeklyTotals.protein * 52,
    fat: weeklyTotals.fat * 52,
    calories: weeklyTotals.calories * 52,
  };

  const renderTotals = (label: string, totals: typeof dailyTotals) => (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text>Carbs: {totals.carbs}g</Text>
      <Text>Protein: {totals.protein}g</Text>
      <Text>Fat: {totals.fat}g</Text>
      <Text>Calories: {totals.calories}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition Stats</Text>
      {renderTotals(`Daily (${selectedDay})`, dailyTotals)}
      {renderTotals('Weekly', weeklyTotals)}
      {renderTotals('Monthly (approx)', monthlyTotals)}
      {renderTotals('Yearly (approx)', yearlyTotals)}
      <Button title="Back" onPress={goBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#ecf0f1',
    marginBottom: 15,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
});
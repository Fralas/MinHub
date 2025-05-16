import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

interface Nutrition {
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
}

interface WeeklySummaryProps {
  weeklyTotals: Nutrition;
}

const screenWidth = Dimensions.get('window').width;

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ weeklyTotals }) => {
  const pieData = [
    {
      name: 'Carbs',
      population: weeklyTotals.carbs,
      color: '#f1c40f',
      legendFontColor: '#000',
      legendFontSize: 14,
    },
    {
      name: 'Protein',
      population: weeklyTotals.protein,
      color: '#2ecc71',
      legendFontColor: '#000',
      legendFontSize: 14,
    },
    {
      name: 'Fat',
      population: weeklyTotals.fat,
      color: '#e74c3c',
      legendFontColor: '#000',
      legendFontSize: 14,
    },
  ].filter(item => item.population > 0); // Filter out zero values to avoid empty slices

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Totals</Text>
      <Text style={styles.text}>
        Carbs: {weeklyTotals.carbs}g, Protein: {weeklyTotals.protein}g, Fat: {weeklyTotals.fat}g, Calories: {weeklyTotals.calories}
      </Text>

      <PieChart
        data={pieData}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  text: {
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default WeeklySummary;
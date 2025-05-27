import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Expense {
  amount: number;
  category: string;
  note: string;
  timestamp: string;
}

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const loadExpenses = async () => {
      const stored = await AsyncStorage.getItem('expenseHistory');
      if (stored) setExpenses(JSON.parse(stored));
    };
    loadExpenses();
  }, []);

  const addExpense = async () => {
    const newExpense: Expense = {
      amount: parseFloat(amount),
      category: category.trim() || 'Other',
      note,
      timestamp: new Date().toLocaleString(),
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    await AsyncStorage.setItem('expenseHistory', JSON.stringify(updated));
    setAmount('');
    setCategory('');
    setNote('');
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Expense Tracker</Text>
      <Text>Total Spent: ${totalSpent.toFixed(2)}</Text>

      <TextInput
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
      />
      <TextInput
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
        style={styles.input}
      />
      <TextInput
        placeholder="Note"
        value={note}
        onChangeText={setNote}
        style={styles.input}
      />
      <Button title="Add Expense" onPress={addExpense} />

      <FlatList
        data={expenses}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.expenseItem}>
            <Text>{item.timestamp}</Text>
            <Text>${item.amount.toFixed(2)} - {item.category}</Text>
            {item.note ? <Text>Note: {item.note}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, padding: 8, marginBottom: 10 },
  expenseItem: { marginBottom: 10, borderBottomWidth: 1, paddingBottom: 5 },
});

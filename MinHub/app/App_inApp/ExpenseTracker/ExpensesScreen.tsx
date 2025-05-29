import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RecurringExpenseModal from './RecurringExpenseModal';

interface Expense {
  amount: number;
  category: string;
  note: string;
  timestamp: string;
  recurring?: boolean;
  lastGenerated?: string;
}

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    const loadExpenses = async () => {
      const stored = await AsyncStorage.getItem('expenseHistory');
      if (stored) {
        const parsed: Expense[] = JSON.parse(stored);
        const updated = generateRecurringExpenses(parsed);
        setExpenses(updated);
        if (updated.length !== parsed.length) {
          await AsyncStorage.setItem('expenseHistory', JSON.stringify(updated));
        }
      }
    };
    loadExpenses();
  }, []);

  const generateRecurringExpenses = (data: Expense[]) => {
    const now = new Date();
    const updatedData = [...data];
    const recurringItems = data.filter(exp => exp.recurring);

    for (const exp of recurringItems) {
      const last = exp.lastGenerated ? new Date(exp.lastGenerated) : new Date(exp.timestamp);
      const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 30) {
        const newExpense: Expense = {
          ...exp,
          timestamp: new Date().toLocaleString(),
          lastGenerated: new Date().toISOString(),
        };
        updatedData.unshift(newExpense);

        const originalIndex = updatedData.findIndex(
          e => e.timestamp === exp.timestamp && e.note === exp.note && e.amount === exp.amount
        );
        if (originalIndex !== -1) {
          updatedData[originalIndex].lastGenerated = new Date().toISOString();
        }
      }
    }
    return updatedData;
  };

  const addExpense = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const newExpense: Expense = {
      amount: parsedAmount,
      category: category || 'Other',
      note,
      timestamp: new Date().toLocaleString(),
      recurring: isRecurring,
      lastGenerated: isRecurring ? new Date().toISOString() : undefined,
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    await AsyncStorage.setItem('expenseHistory', JSON.stringify(updated));
    setAmount('');
    setCategory('Food');
    setNote('');
    setIsRecurring(false);
    setModalVisible(false);
  };

  const deleteExpense = async (indexToDelete: number) => {
    const updated = expenses.filter((_, index) => index !== indexToDelete);
    setExpenses(updated);
    await AsyncStorage.setItem('expenseHistory', JSON.stringify(updated));
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const filteredExpenses = expenses.filter(exp => {
    const categoryMatch =
      filterCategory === '' || exp.category.toLowerCase().includes(filterCategory.toLowerCase());
    const dateMatch = filterDate === '' || exp.timestamp.includes(filterDate);
    return categoryMatch && dateMatch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Total expense: ${totalSpent.toFixed(2)}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 10 }}>
        <TextInput
          placeholder="Filter by category"
          value={filterCategory}
          onChangeText={setFilterCategory}
          style={[styles.input, { flex: 1, marginRight: 5 }]}
        />
        <TextInput
          placeholder="Filter by date (e.g., 5/27/2025)"
          value={filterDate}
          onChangeText={setFilterDate}
          style={[styles.input, { flex: 1 }]}
        />
      </View>
      <TouchableOpacity onPress={() => { setFilterCategory(''); setFilterDate(''); }}>
        <Text style={{ color: '#007bff', marginBottom: 10 }}>Clear Filters</Text>
      </TouchableOpacity>

      <View style={styles.tableHeader}>
        <Text style={styles.tableCell}>Title</Text>
        <Text style={styles.tableCell}>Date</Text>
        <Text style={styles.tableCell}>Category</Text>
        <Text style={[styles.tableCell, { flex: 0.8 }]}>Actions</Text>
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.expenseItem}>
            <Text style={styles.tableCell}>{item.note || 'No title'}</Text>
            <Text style={styles.tableCell}>{item.timestamp}</Text>
            <Text style={styles.tableCell}>
              {item.category}
              {item.recurring ? ' 🔁' : ''}
            </Text>
            <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteExpense(index)}
            >
              <Text style={styles.deleteButtonText}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <RecurringExpenseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addExpense}
        amount={amount}
        setAmount={setAmount}
        category={category}
        setCategory={setCategory}
        note={note}
        setNote={setNote}
        isRecurring={isRecurring}
        setIsRecurring={setIsRecurring}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: { fontSize: 24, fontWeight: 'bold' },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginTop: 20,
  },
  tableCell: { flex: 1, fontWeight: 'bold' },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    alignItems: 'center',
  },
  amountText: { flex: 1, textAlign: 'right', fontWeight: 'bold' },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 10,
  },
  deleteButtonText: { color: 'white', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 6,
  },
});

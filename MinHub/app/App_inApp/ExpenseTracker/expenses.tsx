import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
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
  const [modalVisible, setModalVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');

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
      filterCategory === '' ||
      exp.category.toLowerCase().includes(filterCategory.toLowerCase());
    const dateMatch =
      filterDate === '' || exp.timestamp.includes(filterDate);
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

      {/* Filters */}
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
            <Text style={styles.tableCell}>{item.category}</Text>
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

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
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
              placeholder="Note (Title)"
              value={note}
              onChangeText={setNote}
              style={styles.input}
            />
            <TouchableOpacity onPress={addExpense} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Add Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: 'red', marginTop: 10 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 6,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: { color: 'white', fontWeight: 'bold' },
});

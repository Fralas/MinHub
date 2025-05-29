import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  timestamp: string;
}

const categories = ['All', 'Food', 'Transport', 'Health', 'Entertainment', 'Other'];

const ExpensesScreen = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const addExpense = async () => {
    if (!title || !amount) return;

    const newExpense: Expense = {
      id: Date.now().toString(),
      title,
      amount: parseFloat(amount),
      category,
      timestamp: new Date().toLocaleDateString(),
    };

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    await AsyncStorage.setItem('expenses', JSON.stringify(updatedExpenses));
    setModalVisible(false);
    setTitle('');
    setAmount('');
    setCategory('Other');
  };

  const filteredExpenses = expenses.filter(exp => {
    const categoryMatch = filterCategory === 'All' || exp.category === filterCategory;
    const dateMatch =
      !filterDate || exp.timestamp === filterDate.toLocaleDateString();
    return categoryMatch && dateMatch;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Expenses</Text>

      {/* Filter Controls */}
      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Filter:</Text>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterCategory === item && styles.activeFilterButton,
              ]}
              onPress={() => setFilterCategory(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterCategory === item && styles.activeFilterText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateFilterButton}>
          <Text style={styles.dateFilterText}>
            {filterDate ? filterDate.toLocaleDateString() : 'Filter by date'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={filterDate || new Date()}
            mode="date"
            display="calendar"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setFilterDate(selectedDate);
            }}
          />
        )}

        <TouchableOpacity
          onPress={() => {
            setFilterCategory('All');
            setFilterDate(null);
          }}
        >
          <Text style={{ color: '#007bff', marginBottom: 10 }}>Clear Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Expenses List */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.expenseItem}>
            <Text style={styles.expenseTitle}>{item.title}</Text>
            <Text>${item.amount.toFixed(2)}</Text>
            <Text style={styles.expenseMeta}>{item.category} • {item.timestamp}</Text>
          </View>
        )}
      />

      {/* Add Expense Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TextInput
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
            />
            <Text style={{ marginBottom: 6 }}>Category:</Text>
            {/* Wrap category buttons */}
            <View style={styles.categoryWrap}>
              {categories
                .filter(cat => cat !== 'All')
                .map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.filterButtonModal,
                      category === item && styles.activeFilterButtonModal,
                    ]}
                    onPress={() => setCategory(item)}
                  >
                    <Text
                      style={[
                        styles.filterTextModal,
                        category === item && styles.activeFilterTextModal,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
            <Button title="Add" onPress={addExpense} />
            <View style={{ height: 10 }} />
            <Button title="Cancel" color="red" onPress={() => setModalVisible(false)} />
          </ScrollView>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ExpensesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filters: {
    marginBottom: 12,
  },
  filterLabel: {
    marginBottom: 6,
    fontWeight: 'bold',
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterText: {
    color: '#000',
  },
  activeFilterText: {
    color: '#fff',
  },
  dateFilterButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  dateFilterText: {
    color: '#000',
  },
  expenseItem: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  expenseMeta: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  modalContent: {
    flex: 1,
    padding: 16,
    marginTop: 40,
  },
  modalScroll: {
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  addButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterButtonModal: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  filterTextModal: {
    fontSize: 14,
    color: '#000',
  },
  activeFilterButtonModal: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  activeFilterTextModal: {
    color: '#fff',
  },
});
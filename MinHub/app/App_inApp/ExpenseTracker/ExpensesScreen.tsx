import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  timestamp: string; //MM/DD/YYYY
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

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const saved = await AsyncStorage.getItem('expenses');
        if (saved) {
          const parsed = JSON.parse(saved);
          setExpenses(parsed);
        }
      } catch (e) {
        console.error('Failed to parse expenses from storage.', e);
      }
    };
    loadExpenses();
  }, []);

  const saveExpenses = async (newExpenses: Expense[]) => {
    try {
      setExpenses(newExpenses);
      await AsyncStorage.setItem('expenses', JSON.stringify(newExpenses));
    } catch (e) {
      console.error('Failed to save expenses:', e);
    }
  };

  const addExpense = async () => {
    if (!title.trim() || !amount.trim()) {
      Alert.alert('Error', 'Please fill in both title and amount');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      title: title.trim(),
      amount: parsedAmount,
      category,
      timestamp: new Date().toLocaleDateString(),
    };

    const updatedExpenses = [...expenses, newExpense];
    await saveExpenses(updatedExpenses);

    setModalVisible(false);
    setTitle('');
    setAmount('');
    setCategory('Other');
  };

  const deleteExpense = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedExpenses = expenses.filter(exp => exp.id !== id);
          await saveExpenses(updatedExpenses);
        },
      },
    ]);
  };

  const clearAllExpenses = () => {
    Alert.alert('Clear All', 'Are you sure you want to delete all expenses?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await saveExpenses([]);
        },
      },
    ]);
  };

  const exportToCSV = async () => {
    if (expenses.length === 0) {
      Alert.alert('Nothing to export', 'There are no expenses to export.');
      return;
    }

    try {
      const header = 'Title,Amount,Category,Date\n';
      const rows = expenses.map(
        exp => `"${exp.title.replace(/"/g, '""')}",${exp.amount},"${exp.category}","${exp.timestamp}"`
      );
      const csv = header + rows.join('\n');

      const fileUri = FileSystem.documentDirectory + 'expenses.csv';
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('CSV Exported', `File saved at: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export CSV file');
      console.error('CSV export error:', error);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const categoryMatch = filterCategory === 'All' || exp.category === filterCategory;
    const dateMatch = !filterDate || exp.timestamp === filterDate.toLocaleDateString();
    return categoryMatch && dateMatch;
  });

  const getMonthlyTotals = () => {
    const monthlyMap: { [month: string]: number } = {};
    for (const exp of filteredExpenses) {
      try {
        const [month, , year] = exp.timestamp.split('/');
        if (month && year) {
          const label = `${month.padStart(2, '0')}/${year}`;
          monthlyMap[label] = (monthlyMap[label] || 0) + exp.amount;
        }
      } catch (e) {
        console.error('Error parsing date:', exp.timestamp);
      }
    }
    return Object.entries(monthlyMap).sort();
  };

  const monthlyTotals = getMonthlyTotals();
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Expenses</Text>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          Total: ${totalAmount.toFixed(2)} ({filteredExpenses.length} expenses)
        </Text>
      </View>

      {/* Filter Controls */}
      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Filter by Category:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item}
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
          ))}
        </ScrollView>

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateFilterButton}>
          <Text style={styles.dateFilterText}>
            {filterDate ? `Date: ${filterDate.toLocaleDateString()}` : 'Filter by date'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={filterDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (event.type === 'set' && selectedDate) {
                setFilterDate(selectedDate);
              }
            }}
          />
        )}

        <TouchableOpacity
          onPress={() => {
            setFilterCategory('All');
            setFilterDate(null);
          }}
          style={styles.clearFiltersButton}
        >
          <Text style={styles.clearFiltersText}>Clear Filters</Text>
        </TouchableOpacity>

        {monthlyTotals.length > 0 && (
          <View style={styles.monthlyTotals}>
            <Text style={styles.monthlyTotalsTitle}>Monthly Totals:</Text>
            {monthlyTotals.map(([month, total]) => (
              <Text key={month} style={styles.monthlyTotal}>
                {month}: ${total.toFixed(2)}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Export and Clear Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.exportButton} onPress={exportToCSV}>
          <Text style={styles.exportButtonText}>Export CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearAllExpenses}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Expenses List */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onLongPress={() => deleteExpense(item.id)}
            style={styles.expenseItem}
          >
            <View style={styles.expenseHeader}>
              <Text style={styles.expenseTitle}>{item.title}</Text>
              <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
            </View>
            <Text style={styles.expenseMeta}>
              {item.category} • {item.timestamp}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>No expenses found</Text>
            <Text style={styles.emptyListSubtext}>
              {expenses.length === 0 ? 'Add your first expense!' : 'Try adjusting your filters'}
            </Text>
          </View>
        }
      />

      {/* Add Expense Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              
              <TextInput
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                autoFocus
              />
              
              <TextInput
                placeholder="Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={styles.input}
              />
              
              <Text style={styles.categoryLabel}>Category:</Text>
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
              
              <TouchableOpacity style={styles.addExpenseButton} onPress={addExpense}>
                <Text style={styles.addExpenseButtonText}>Add Expense</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => {
                  setModalVisible(false);
                  setTitle('');
                  setAmount('');
                  setCategory('Other');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ExpensesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  summary: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  filters: {
    marginBottom: 16,
  },
  filterLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  activeFilterButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterText: {
    color: '#333',
  },
  activeFilterText: {
    color: '#fff',
  },
  dateFilterButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  dateFilterText: {
    color: '#333',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  clearFiltersText: {
    color: '#007bff',
    fontSize: 14,
  },
  monthlyTotals: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  monthlyTotalsTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  monthlyTotal: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  exportButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.48,
  },
  exportButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.48,
  },
  clearButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  expenseItem: {
    backgroundColor: '#f8f8f8',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007bff',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  expenseMeta: {
    fontSize: 12,
    color: '#666',
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyListText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptyListSubtext: {
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalScroll: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  categoryLabel: {
    marginBottom: 8,
    fontWeight: '600',
    color: '#333',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  filterButtonModal: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  filterTextModal: {
    fontSize: 14,
    color: '#333',
  },
  activeFilterButtonModal: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  activeFilterTextModal: {
    color: '#fff',
  },
  addExpenseButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 6,
    marginBottom: 10,
  },
  addExpenseButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  cancelButtonText: {
    color: '#dc3545',
    textAlign: 'center',
    fontSize: 16,
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});
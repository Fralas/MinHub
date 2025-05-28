import React from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Switch,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
  amount: string;
  setAmount: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  isRecurring: boolean;
  setIsRecurring: (value: boolean) => void;
}

const predefinedCategories = ['Food', 'Shopping', 'Trips', 'Transport', 'Health', 'Entertainment', 'Other'];

export default function RecurringExpenseModal({
  visible,
  onClose,
  onAdd,
  amount,
  setAmount,
  category,
  setCategory,
  note,
  setNote,
  isRecurring,
  setIsRecurring,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TextInput
            placeholder="Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            style={styles.input}
          />
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
            style={styles.picker}
          >
            {predefinedCategories.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
          <TextInput
            placeholder="Note (Title)"
            value={note}
            onChangeText={setNote}
            style={styles.input}
          />
          <View style={styles.switchContainer}>
            <Text>Recurring monthly?</Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
            />
          </View>
          <TouchableOpacity onPress={onAdd} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: 'red', marginTop: 10 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  picker: {
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
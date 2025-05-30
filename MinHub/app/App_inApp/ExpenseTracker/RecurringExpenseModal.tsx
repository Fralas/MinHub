import { AArrowDown } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Switch,
  StyleSheet,
} from 'react-native';
import { Menu, Button, Provider } from 'react-native-paper';

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
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <Provider>
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
            <View style={styles.dropdownWrapper}>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setMenuVisible(true)}
                  >
                    {category || 'Select Category'}
                  </Button>
                }
              >
                {predefinedCategories.map((cat) => (
                  <Menu.Item
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      setMenuVisible(false);
                    }}
                    title={cat}
                  />
                ))}
              </Menu>
            </View>
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
    </Provider>
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
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  dropdownWrapper: {
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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

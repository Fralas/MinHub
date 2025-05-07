import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  notes: string;
  isPurchased: boolean;
  createdAt: string;
  price?: number; // Nuovo campo per il prezzo (opzionale)
}

interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

const SHOPPING_LISTS_STORAGE_KEY = '@minhub_shoppingLists_v1';
const CURRENCY_SYMBOL = '€'; // Simbolo valuta

export default function ShoppingListDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ listId: string; listName?: string }>();
  const { listId, listName } = params;

  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);

  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [itemPriceInput, setItemPriceInput] = useState(''); // State per l'input del prezzo (stringa)

  const loadListDetails = useCallback(async () => {
    if (!listId) {
        Alert.alert('Error', 'List ID is missing.');
        router.back();
        return;
    }
    setIsLoading(true);
    try {
      const storedLists = await AsyncStorage.getItem(SHOPPING_LISTS_STORAGE_KEY);
      if (storedLists) {
        const allLists: ShoppingList[] = JSON.parse(storedLists);
        const foundList = allLists.find(l => l.id === listId);
        if (foundList) {
          setCurrentList(foundList);
        } else {
          Alert.alert('Error', 'Shopping list not found.');
          router.back();
        }
      } else {
        Alert.alert('Error', 'No shopping lists found in storage.');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load list details.', error);
      Alert.alert('Error', 'Could not load list details.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [listId, router]);

  useFocusEffect(
    useCallback(() => {
      loadListDetails();
    }, [loadListDetails])
  );

  const saveCurrentList = async (updatedList: ShoppingList | null) => {
    if (!updatedList) return;
    try {
      const storedLists = await AsyncStorage.getItem(SHOPPING_LISTS_STORAGE_KEY);
      let allLists: ShoppingList[] = storedLists ? JSON.parse(storedLists) : [];
      const listIndex = allLists.findIndex(l => l.id === updatedList.id);
      
      const listWithTimestamp = { ...updatedList, updatedAt: new Date().toISOString() };

      if (listIndex > -1) {
        allLists[listIndex] = listWithTimestamp;
      } else {
        allLists.push(listWithTimestamp);
      }
      await AsyncStorage.setItem(SHOPPING_LISTS_STORAGE_KEY, JSON.stringify(allLists));
      setCurrentList(listWithTimestamp);
    } catch (error) {
      console.error('Failed to save list.', error);
      Alert.alert('Error', 'Could not save changes to the list.');
    }
  };

  const handleOpenItemModal = (item?: ShoppingListItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemQuantity(item.quantity);
      setItemUnit(item.unit);
      setItemCategory(item.category);
      setItemNotes(item.notes);
      setItemPriceInput(item.price !== undefined ? item.price.toString() : '');
    } else {
      setEditingItem(null);
      setItemName('');
      setItemQuantity('1');
      setItemUnit('');
      setItemCategory('');
      setItemNotes('');
      setItemPriceInput('');
    }
    setItemModalVisible(true);
  };

  const handleSaveItem = () => {
    if (itemName.trim() === '') {
      Alert.alert('Required', 'Item name cannot be empty.');
      return;
    }
    if (!currentList) {
        Alert.alert('Error', 'Current list not loaded.');
        return;
    }

    let updatedItems;
    const now = new Date().toISOString();
    const currentItemsArray = currentList.items || [];
    const priceValue = parseFloat(itemPriceInput.replace(',', '.')); // Gestisce virgola e punto per decimali

    if (editingItem) {
      updatedItems = currentItemsArray.map(item =>
        item.id === editingItem.id
          ? { ...editingItem, name: itemName.trim(), quantity: itemQuantity.trim(), unit: itemUnit.trim(), category: itemCategory.trim(), notes: itemNotes.trim(), price: isNaN(priceValue) ? undefined : priceValue }
          : item
      );
    } else {
      const newItem: ShoppingListItem = {
        id: Date.now().toString(),
        name: itemName.trim(),
        quantity: itemQuantity.trim() || '1',
        unit: itemUnit.trim(),
        category: itemCategory.trim(),
        notes: itemNotes.trim(),
        isPurchased: false,
        createdAt: now,
        price: isNaN(priceValue) ? undefined : priceValue,
      };
      updatedItems = [...currentItemsArray, newItem];
    }
    saveCurrentList({ ...currentList, items: updatedItems });
    setItemModalVisible(false);
  };

  const handleToggleItemPurchased = (itemId: string) => {
    if (!currentList) return;
    const updatedItems = (currentList.items || []).map(item =>
      item.id === itemId ? { ...item, isPurchased: !item.isPurchased } : item
    );
    saveCurrentList({ ...currentList, items: updatedItems });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!currentList) return;
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedItems = (currentList.items || []).filter(item => item.id !== itemId);
          saveCurrentList({ ...currentList, items: updatedItems });
        },
      },
    ]);
  };

  const { estimatedTotal, spentTotal } = useMemo(() => {
    let estTotal = 0;
    let spTotal = 0;
    if (currentList?.items) {
      currentList.items.forEach(item => {
        const price = item.price !== undefined ? Number(item.price) : 0;
        if (item.isPurchased) {
          spTotal += price * (parseFloat(item.quantity) || 1);
        } else {
          estTotal += price * (parseFloat(item.quantity) || 1);
        }
      });
    }
    return { estimatedTotal: estTotal, spentTotal: spTotal };
  }, [currentList?.items]);

  const groupedItems = useMemo(() => {
    if (!currentList?.items) return [];
    const groups: { [key: string]: ShoppingListItem[] } = {};
    currentList.items.forEach(item => {
      const category = item.category.trim() || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    Object.keys(groups).forEach(category => {
        groups[category].sort((a, b) => {
            if (a.isPurchased === b.isPurchased) {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }
            return a.isPurchased ? 1 : -1;
        });
    });
    return Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0]));
  }, [currentList?.items]);


  const renderShoppingListItem = ({ item }: { item: ShoppingListItem }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity onPress={() => handleToggleItemPurchased(item.id)} style={styles.checkboxArea}>
        <View style={[styles.checkbox, item.isPurchased && styles.checkboxChecked]}>
          {item.isPurchased && <Text style={styles.checkboxCheckmark}>✓</Text>}
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.itemDetailsArea} onPress={() => handleOpenItemModal(item)}>
        <View style={styles.itemNameRow}>
            <Text style={[styles.itemName, item.isPurchased && styles.itemNamePurchased]}>{item.name}</Text>
            {item.price !== undefined && (
                <Text style={[styles.itemPrice, item.isPurchased && styles.itemNamePurchased]}>
                    {CURRENCY_SYMBOL}{item.price.toFixed(2)}
                </Text>
            )}
        </View>
        {(item.quantity || item.unit) && (
          <Text style={[styles.itemSubText, item.isPurchased && styles.itemNamePurchased]}>
            Qty: {item.quantity}{item.unit ? ` ${item.unit}` : ''}
          </Text>
        )}
        {item.notes && <Text style={[styles.itemNotes, item.isPurchased && styles.itemNamePurchased]} numberOfLines={1}>{item.notes}</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteItem(item.id)} style={styles.deleteItemButton}>
        <Text style={styles.deleteItemButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategorySection = ({ item: [category, items] }: { item: [string, ShoppingListItem[]] }) => (
    <View>
      <Text style={styles.categoryHeader}>{category}</Text>
      <FlatList
        data={items}
        renderItem={renderShoppingListItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
      />
    </View>
  );


  if (isLoading || !currentList) {
    return (
      <SafeAreaView style={styles.centeredMessageContainer}>
        <Text style={styles.loadingText}>{isLoading ? 'Loading list...' : 'List not found.'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: listName || currentList.name }} />
        <View style={styles.totalsContainer}>
            <Text style={styles.totalText}>Estimated: {CURRENCY_SYMBOL}{estimatedTotal.toFixed(2)}</Text>
            <Text style={styles.totalText}>Spent: {CURRENCY_SYMBOL}{spentTotal.toFixed(2)}</Text>
        </View>
      {groupedItems.length === 0 ? (
         <View style={styles.centeredMessageContainerContent}>
            <Text style={styles.emptyListText}>This list is empty. Tap '+' to add items!</Text>
          </View>
      ) : (
        <FlatList
            data={groupedItems}
            renderItem={renderCategorySection}
            keyExtractor={([category]) => category}
            contentContainerStyle={styles.listContentContainer}
        />
      )}
      <TouchableOpacity style={styles.addItemButton} onPress={() => handleOpenItemModal()}>
        <Text style={styles.addItemButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={itemModalVisible}
        onRequestClose={() => setItemModalVisible(false)}
      >
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
            <ScrollView contentContainerStyle={styles.modalScrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add New Item'}</Text>
                <TextInput style={styles.modalInput} placeholder="Item Name (e.g., Milk)" value={itemName} onChangeText={setItemName} autoFocus={true}/>
                <View style={styles.rowInputContainer}>
                    <TextInput style={[styles.modalInput, styles.rowInputHalf, {marginRight: 5}]} placeholder="Quantity (e.g., 1)" value={itemQuantity} onChangeText={setItemQuantity} />
                    <TextInput style={[styles.modalInput, styles.rowInputHalf, {marginLeft: 5}]} placeholder="Unit (e.g., L, pcs)" value={itemUnit} onChangeText={setItemUnit}/>
                </View>
                <TextInput style={styles.modalInput} placeholder="Category (e.g., Dairy)" value={itemCategory} onChangeText={setItemCategory}/>
                <TextInput style={styles.modalInput} placeholder={`Price (${CURRENCY_SYMBOL}) (e.g., 1.99)`} value={itemPriceInput} onChangeText={setItemPriceInput} keyboardType="numeric"/>
                <TextInput style={[styles.modalInput, styles.notesInput]} placeholder="Notes (e.g., organic)" value={itemNotes} onChangeText={setItemNotes} multiline/>
                <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setItemModalVisible(false)}>
                    <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveItem}>
                    <Text style={styles.modalButtonText}>Save Item</Text>
                    </TouchableOpacity>
                </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#e9ecef',
    borderBottomWidth: 1,
    borderColor: '#dee2e6',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  listContentContainer: {
    paddingBottom: 100,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centeredMessageContainerContent: { // Per quando la lista è vuota ma i totali sono visibili
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20, // Aggiunto per dare spazio ai totali
  },
  loadingText: {
    fontSize: 18,
    color: '#495057',
  },
  emptyListText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  addItemButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    right: 30,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addItemButtonText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#f8f9fa', // Cambiato per coerenza
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: '#e9ecef',
  },
  checkboxArea: {
    padding: 8,
    marginRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxCheckmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDetailsArea: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 17,
    color: '#343a40',
    fontWeight: '500',
    flexShrink: 1, // Permette al nome di accorciarsi se il prezzo è lungo
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#28a745', // Verde per il prezzo
    marginLeft: 10,
  },
  itemNamePurchased: {
    textDecorationLine: 'line-through',
    color: '#adb5bd',
  },
  itemSubText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 13,
    color: '#868e96',
    fontStyle: 'italic',
    marginTop: 2,
  },
  deleteItemButton: {
    padding: 8,
    marginLeft: 10,
  },
  deleteItemButtonText: {
    fontSize: Platform.OS === 'ios' ? 22 : 18,
    color: '#dc3545',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 15,
    width: '90%',
    maxWidth: 500,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#343a40',
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
  },
  rowInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowInputHalf: {
    flex: 1,
  },
  notesInput: {
      minHeight: 80,
      textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
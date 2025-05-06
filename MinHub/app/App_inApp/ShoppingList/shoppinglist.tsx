import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface ShoppingList {
  id: string;
  name: string;
  createdAt: string;
  itemCount?: number; 
}

const SHOPPING_LISTS_STORAGE_KEY = '@minhub_shoppingLists_v1';

export default function ShoppingListsScreen() {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [currentListName, setCurrentListName] = useState('');
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);

  const loadShoppingLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedLists = await AsyncStorage.getItem(SHOPPING_LISTS_STORAGE_KEY);
      if (storedLists) {
        const parsedLists: ShoppingList[] = JSON.parse(storedLists);
        parsedLists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setShoppingLists(parsedLists);
      } else {
        setShoppingLists([]);
      }
    } catch (error) {
      console.error('Failed to load shopping lists.', error);
      Alert.alert('Error', 'Could not load shopping lists.');
      setShoppingLists([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadShoppingLists();
    }, [loadShoppingLists])
  );

  const saveShoppingLists = async (listsToSave: ShoppingList[]) => {
    try {
      await AsyncStorage.setItem(SHOPPING_LISTS_STORAGE_KEY, JSON.stringify(listsToSave));
      setShoppingLists(listsToSave.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to save shopping lists.', error);
      Alert.alert('Error', 'Could not save shopping lists.');
    }
  };

  const handleOpenModal = (list?: ShoppingList) => {
    if (list) {
      setEditingList(list);
      setCurrentListName(list.name);
    } else {
      setEditingList(null);
      setCurrentListName('');
    }
    setModalVisible(true);
  };

  const handleSaveList = () => {
    if (currentListName.trim() === '') {
      Alert.alert('Invalid Name', 'List name cannot be empty.');
      return;
    }

    let updatedLists;
    if (editingList) {
      updatedLists = shoppingLists.map(list =>
        list.id === editingList.id ? { ...list, name: currentListName.trim() } : list
      );
    } else {
      const newList: ShoppingList = {
        id: Date.now().toString(),
        name: currentListName.trim(),
        createdAt: new Date().toISOString(),
        itemCount: 0,
      };
      updatedLists = [...shoppingLists, newList];
    }
    saveShoppingLists(updatedLists);
    setModalVisible(false);
    setCurrentListName('');
    setEditingList(null);
  };

  const handleDeleteList = (listId: string) => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this shopping list and all its items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedLists = shoppingLists.filter(list => list.id !== listId);
            await saveShoppingLists(updatedLists);
          },
        },
      ]
    );
  };


const navigateToDetail = (list: ShoppingList) => {
    router.push({
      pathname: '/App_inApp/ShoppingList/shoppinglistdetail.tsx/[listId]', 
      params: { listId: list.id, listName: list.name },
    });
  };


  const renderListItem = ({ item }: { item: ShoppingList }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => navigateToDetail(item)}>
      <View style={styles.listItemTextContainer}>
        <Text style={styles.listItemName}>{item.name}</Text>
        <Text style={styles.listItemSubText}>
            { }
            Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.listItemActions}>
        <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteList(item.id)} style={[styles.actionButton, styles.deleteAction]}>
            <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centeredMessageContainer}>
        <Text style={styles.loadingText}>Loading Shopping Lists...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <Stack.Screen
            options={{
                headerTitle: 'My Shopping Lists',
                headerRight: () => (
                    <TouchableOpacity onPress={() => handleOpenModal()} style={styles.headerButton}>
                        <Text style={styles.headerButtonText}>New List</Text>
                    </TouchableOpacity>
                ),
            }}
        />

      {shoppingLists.length === 0 ? (
        <View style={styles.centeredMessageContainer}>
          <Text style={styles.emptyListText}>No shopping lists yet. Create one!</Text>
        </View>
      ) : (
        <FlatList
          data={shoppingLists}
          renderItem={renderListItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContentContainer}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
          setCurrentListName('');
          setEditingList(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingList ? 'Edit List Name' : 'Create New List'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter list name"
              value={currentListName}
              onChangeText={setCurrentListName}
              autoFocus={true}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(!modalVisible);
                  setCurrentListName('');
                  setEditingList(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveList}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerButton: {
    marginRight: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  headerButtonText: {
    color: Platform.OS === 'ios' ? '#007AFF' : '#333',
    fontSize: 17,
    fontWeight: '600',
  },
  listContentContainer: {
    padding: 15,
  },
  listItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  listItemTextContainer: {
    flex: 1,
  },
  listItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
  },
  listItemSubText: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 4,
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 10,
  },
  deleteAction: {
  },
  actionButtonText: {
    fontSize: Platform.OS === 'ios' ? 22 : 18,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
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
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 25,
    backgroundColor: '#f8f9fa',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
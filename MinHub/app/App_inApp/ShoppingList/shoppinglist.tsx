import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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

// Interfacce (assicurati siano consistenti o importate)
interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  notes: string;
  isPurchased: boolean;
  createdAt: string;
  price?: number; // Manteniamo price per coerenza, anche se potrebbe non essere usato nei template
}

interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

// Alias per chiarezza, la struttura è la stessa
type ShoppingListTemplate = ShoppingList;

const SHOPPING_LISTS_STORAGE_KEY = '@minhub_shoppingLists_v1';
const TEMPLATES_STORAGE_KEY = '@minhub_shoppingTemplates_v1'; // Nuova chiave per i template

export default function ShoppingListScreen() {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [templates, setTemplates] = useState<ShoppingListTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);
  const router = useRouter();

  const [listModalVisible, setListModalVisible] = useState(false);
  const [templateSelectModalVisible, setTemplateSelectModalVisible] = useState(false);

  const [currentListName, setCurrentListName] = useState('');
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);

  // --- Caricamento Liste Spesa ---
  const loadShoppingLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedLists = await AsyncStorage.getItem(SHOPPING_LISTS_STORAGE_KEY);
      const parsedLists = storedLists ? JSON.parse(storedLists) : [];
      setShoppingLists(parsedLists.sort((a: ShoppingList, b: ShoppingList) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()));
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

  // --- Salvataggio Liste Spesa ---
  const saveShoppingLists = async (listsToSave: ShoppingList[]) => {
    try {
      const sortedLists = listsToSave.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      await AsyncStorage.setItem(SHOPPING_LISTS_STORAGE_KEY, JSON.stringify(sortedLists));
      setShoppingLists(sortedLists); // Aggiorna lo stato locale
    } catch (error) {
      console.error('Failed to save shopping lists.', error);
      Alert.alert('Error', 'Could not save shopping lists.');
    }
  };

  // --- Caricamento Templates (solo quando serve) ---
   const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const storedTemplates = await AsyncStorage.getItem(TEMPLATES_STORAGE_KEY);
      const parsedTemplates = storedTemplates ? JSON.parse(storedTemplates) : [];
      setTemplates(parsedTemplates.sort((a: ShoppingListTemplate, b: ShoppingListTemplate) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Failed to load templates.', error);
      Alert.alert('Error', 'Could not load templates.');
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // --- Gestione Modale Lista (Crea/Modifica Nome) ---
  const handleOpenListModal = (list?: ShoppingList) => {
    if (list) {
      setEditingList(list);
      setCurrentListName(list.name);
    } else {
      setEditingList(null);
      setCurrentListName('');
    }
    setListModalVisible(true);
  };

  const handleSaveList = () => {
    if (currentListName.trim() === '') {
      Alert.alert('Invalid Name', 'List name cannot be empty.');
      return;
    }

    let updatedLists;
    const now = new Date().toISOString();

    if (editingList) {
      updatedLists = shoppingLists.map(list =>
        list.id === editingList.id ? { ...list, name: currentListName.trim(), updatedAt: now } : list
      );
    } else {
      const newList: ShoppingList = {
        id: Date.now().toString(),
        name: currentListName.trim(),
        createdAt: now,
        updatedAt: now,
        items: [],
      };
      updatedLists = [newList, ...shoppingLists];
    }
    saveShoppingLists(updatedLists);
    setListModalVisible(false);
    setCurrentListName('');
    setEditingList(null);
  };

  const handleDeleteList = (listId: string) => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this shopping list?',
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

  // --- Funzionalità Template ---
  const handleSaveAsTemplate = async (listToSave: ShoppingList) => {
    Alert.alert(
        'Save as Template',
        `Do you want to save "${listToSave.name}" as a template?`,
        [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Save',
                onPress: async () => {
                    setIsLoading(true); // Mostra caricamento
                    try {
                        const storedTemplates = await AsyncStorage.getItem(TEMPLATES_STORAGE_KEY);
                        let templates: ShoppingListTemplate[] = storedTemplates ? JSON.parse(storedTemplates) : [];

                        // Pulisci gli items: resetta 'isPurchased' e rimuovi 'price'
                        const cleanedItems = listToSave.items.map(({ price, isPurchased, ...itemData }) => ({
                            ...itemData,
                            isPurchased: false, // Sempre non acquistato nel template
                        }));

                        const newTemplate: ShoppingListTemplate = {
                            id: `template-${Date.now().toString()}`, // ID univoco per template
                            name: listToSave.name, // Usa il nome della lista
                            items: cleanedItems,
                            createdAt: new Date().toISOString(), // Timestamp salvataggio template
                            updatedAt: new Date().toISOString(),
                        };

                        // Opzionale: controlla se esiste già un template con lo stesso nome
                        const existingIndex = templates.findIndex(t => t.name === newTemplate.name);
                        if (existingIndex > -1) {
                             // Sovrascrivi o chiedi conferma? Per ora sovrascriviamo
                            templates[existingIndex] = newTemplate;
                            Alert.alert('Template Updated', `Template "${newTemplate.name}" has been updated.`);
                        } else {
                            templates.push(newTemplate);
                            Alert.alert('Template Saved', `"${newTemplate.name}" saved as a template.`);
                        }

                        await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
                    } catch (error) {
                        console.error('Failed to save template.', error);
                        Alert.alert('Error', 'Could not save the template.');
                    } finally {
                        setIsLoading(false);
                    }
                }
            }
        ]
    );
  };

  const handleOpenTemplateSelectModal = () => {
      loadTemplates(); // Carica i template quando apri il modale
      setTemplateSelectModalVisible(true);
  };

  const handleCreateListFromTemplate = (template: ShoppingListTemplate) => {
      const now = new Date().toISOString();
      const itemsFromTemplate = template.items.map(item => ({
          ...item,
          id: `item-${Date.now().toString()}-${Math.random()}`, // Nuovo ID per l'item nella nuova lista
          isPurchased: false, // Assicurati sia false
          // price: item.price // Decidi se mantenere i prezzi dal template
      }));

      const newList: ShoppingList = {
        id: Date.now().toString(),
        name: template.name, // Potresti aggiungere "(Copy)" o data?
        createdAt: now,
        updatedAt: now,
        items: itemsFromTemplate,
      };
      saveShoppingLists([newList, ...shoppingLists]);
      setTemplateSelectModalVisible(false);
  };

  // --- Navigazione e Rendering ---
  const navigateToDetail = (list: ShoppingList) => {
     router.push({ pathname: `/App_inApp/ShoppingList/shoppinglistdetail/[listId]`, params: { listId: list.id, listName: list.name } });
  };

  const renderListItem = ({ item }: { item: ShoppingList }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => navigateToDetail(item)}>
      <View style={styles.listItemTextContainer}>
        <Text style={styles.listItemName}>{item.name}</Text>
        <Text style={styles.listItemSubText}>
            {item.items?.length || 0} items - Updated: {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.listItemActions}>
        <TouchableOpacity onPress={() => handleSaveAsTemplate(item)} style={styles.actionButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.actionButtonText}>➕</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleOpenListModal(item)} style={styles.actionButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteList(item.id)} style={[styles.actionButton, styles.deleteAction]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderTemplateItem = ({ item }: { item: ShoppingListTemplate }) => (
    <TouchableOpacity style={styles.templateItem} onPress={() => handleCreateListFromTemplate(item)}>
      <Text style={styles.templateItemText}>{item.name}</Text>
      <Text style={styles.templateItemSubText}>{item.items?.length || 0} items</Text>
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
                headerTitle: 'Shopping Lists',
                headerRight: () => (
                    <View style={styles.headerButtonsContainer}>
                        <TouchableOpacity onPress={handleOpenTemplateSelectModal} style={styles.headerButton} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
                           <Text style={styles.headerButtonText}>Template</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleOpenListModal()} style={styles.headerButton} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
                            <Text style={styles.headerButtonText}>New</Text>
                        </TouchableOpacity>
                    </View>
                ),
            }}
        />

      {shoppingLists.length === 0 ? (
        <View style={styles.centeredMessageContainer}>
          <Text style={styles.emptyListText}>No shopping lists yet. Create one or use a template!</Text>
        </View>
      ) : (
        <FlatList
          data={shoppingLists}
          renderItem={renderListItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContentContainer}
        />
      )}

      {/* Modale per Crea/Modifica Nome Lista */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={listModalVisible}
        onRequestClose={() => setListModalVisible(false)}
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
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setListModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveList} >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modale per Selezionare Template */}
       <Modal
        animationType="slide"
        transparent={false} // Usiamo un modale non trasparente per i template
        visible={templateSelectModalVisible}
        onRequestClose={() => setTemplateSelectModalVisible(false)}
      >
        <SafeAreaView style={styles.modalFullScreenContainer}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create List from Template</Text>
                <TouchableOpacity onPress={() => setTemplateSelectModalVisible(false)} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            </View>

          {isLoadingTemplates ? (
             <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 20}}/>
          ) : templates.length === 0 ? (
            <View style={styles.centeredMessageContainer}>
                 <Text style={styles.emptyListText}>No templates saved yet.</Text>
                 <Text style={styles.emptyListSubText}>You can save any shopping list as a template using the '➕' icon.</Text>
            </View>
          ) : (
            <FlatList
              data={templates}
              renderItem={renderTemplateItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContentContainer}
            />
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerButtonsContainer: {
      flexDirection: 'row',
  },
  headerButton: {
    marginHorizontal: 8, // Spazio tra bottoni
    paddingVertical: 5,
    paddingHorizontal: 5,
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
    paddingVertical: 12, // Ridotto leggermente
    paddingHorizontal: 15,
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
    marginRight: 10, // Spazio prima delle azioni
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
    marginLeft: 8, // Spazio tra i pulsanti azione
  },
  deleteAction: {},
  actionButtonText: {
    fontSize: Platform.OS === 'ios' ? 22 : 18,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // Aggiunto padding
  },
  loadingText: {
    fontSize: 18,
    color: '#495057',
  },
  emptyListText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 5, // Spazio sotto
  },
  emptyListSubText: { // Nuovo stile per sotto-testo lista vuota
      fontSize: 14,
      color: '#adb5bd',
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
  modalFullScreenContainer: { // Stile per il modale di selezione template
      flex: 1,
      backgroundColor: '#f8f9fa',
  },
  modalHeader: { // Header per il modale full screen
      padding: 15,
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderColor: '#dee2e6',
      backgroundColor: '#ffffff',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '500',
  },
  templateItem: { // Stile per le voci nel modale template
      backgroundColor: '#ffffff',
      padding: 15,
      borderBottomWidth: 1,
      borderColor: '#e9ecef',
  },
  templateItemText: {
      fontSize: 17,
      color: '#343a40',
  },
  templateItemSubText: {
      fontSize: 14,
      color: '#6c757d',
      marginTop: 4,
  }
});
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Platform,
  SectionList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

interface WishlistItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  desireLevel: number;
  category: string;
}

const STORAGE_KEY = '@wishlist_items_v2';

const EMOJIS = ['🍕', '🎸', '📚', '🎮', '✈️', '🎧', '📷', '🎨', '🏔️', '🌟', '💻', '🧸', '❤️', '🚗'];
const CATEGORIES = ['Food', 'Music', 'Books', 'Games', 'Travel', 'Tech', 'Toys', 'Other'];

export default function Wishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDesireLevel, setNewDesireLevel] = useState('5');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🌟');
  const [selectedCategory, setSelectedCategory] = useState<string>('Other');

  const loadWishlist = useCallback(async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      setWishlist(JSON.parse(data));
    }
  }, []);

  const saveWishlist = async (items: WishlistItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const handleAddItem = () => {
    if (!newName.trim()) return;

    const newItem: WishlistItem = {
      id: Date.now().toString(),
      name: newName,
      emoji: selectedEmoji,
      description: newDescription,
      desireLevel: parseInt(newDesireLevel),
      category: selectedCategory,
    };

    const updated = [newItem, ...wishlist];
    setWishlist(updated);
    saveWishlist(updated);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setNewDesireLevel('5');
    setSelectedEmoji('🌟');
    setSelectedCategory('Other');
    setModalVisible(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [loadWishlist])
  );

  const groupedWishlist = CATEGORIES.map((category) => ({
    title: category,
    data: wishlist.filter((item) => item.category === category),
  })).filter((section) => section.data.length > 0);

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>
        {item.emoji} {item.name} ({item.desireLevel}/10)
      </Text>
      <Text style={styles.descriptionText}>{item.description}</Text>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Wishlist</Text>

      {groupedWishlist.length === 0 ? (
        <Text style={styles.emptyText}>No items yet. Tap '+' to add one!</Text>
      ) : (
        <SectionList
          sections={groupedWishlist}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add to Wishlist</Text>
            <TextInput
              style={styles.input}
              placeholder="Item name"
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newDescription}
              onChangeText={setNewDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="How much do you want it? (1-10)"
              keyboardType="numeric"
              value={newDesireLevel}
              onChangeText={setNewDesireLevel}
            />

            <Text style={styles.subheading}>Pick an Emoji:</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setSelectedEmoji(emoji)}
                  style={[
                    styles.emojiButton,
                    selectedEmoji === emoji && styles.selectedEmoji,
                  ]}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.subheading}>Choose a Category:</Text>
            <View style={styles.emojiGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.emojiButton,
                    selectedCategory === cat && styles.selectedEmoji,
                  ]}
                >
                  <Text style={styles.emojiText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleAddItem}>
              <Text style={styles.confirmButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 30 : 40,
    right: 30,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addButtonText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#00000099',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  subheading: {
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 16,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    justifyContent: 'center',
  },
  emojiButton: {
    padding: 5,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  selectedEmoji: {
    backgroundColor: '#cdeaff',
  },
  emojiText: {
    fontSize: 20,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

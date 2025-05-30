import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  Switch, 
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WishlistItem = {
  id: string;
  name: string;
  price: string;
  bought: boolean;
};

export default function Wishlist() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Load wishlist from storage on component mount
  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const saved = await AsyncStorage.getItem('wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        setWishlist(parsed);
      }
    } catch (e) {
      console.error('Failed to load wishlist:', e);
    }
  };

  const saveWishlist = async (newWishlist: WishlistItem[]) => {
    try {
      setWishlist(newWishlist);
      await AsyncStorage.setItem('wishlist', JSON.stringify(newWishlist));
    } catch (e) {
      console.error('Failed to save wishlist:', e);
    }
  };

  const addItem = async () => {
    if (name.trim() === '' || price.trim() === '') {
      Alert.alert('Error', 'Please fill in both name and price');
      return;
    }

    // Validate price
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const newItem: WishlistItem = {
      id: Date.now().toString(),
      name: name.trim(),
      price: numericPrice.toFixed(2),
      bought: false,
    };

    const updatedWishlist = [...wishlist, newItem];
    await saveWishlist(updatedWishlist);
    
    setName('');
    setPrice('');
  };

  const toggleBought = async (id: string) => {
    const updatedWishlist = wishlist.map(item =>
      item.id === id ? { ...item, bought: !item.bought } : item
    );
    await saveWishlist(updatedWishlist);
  };

  const deleteItem = (id: string) => {
    Alert.alert(
      'Delete Item', 
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedWishlist = wishlist.filter(item => item.id !== id);
            await saveWishlist(updatedWishlist);
          },
        },
      ]
    );
  };

  const getTotalPrice = () => {
    return wishlist.reduce((total, item) => total + parseFloat(item.price), 0);
  };

  const getBoughtTotal = () => {
    return wishlist
      .filter(item => item.bought)
      .reduce((total, item) => total + parseFloat(item.price), 0);
  };

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <TouchableOpacity 
      style={[styles.item, item.bought && styles.boughtItem]}
      onLongPress={() => deleteItem(item.id)}
    >
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, item.bought && styles.boughtText]}>
          {item.name}
        </Text>
        <Text style={[styles.itemPrice, item.bought && styles.boughtText]}>
          €{item.price}
        </Text>
      </View>
      <View style={styles.switchContainer}>
        <Text style={styles.checkmark}>{item.bought ? '✓' : ''}</Text>
        <Switch
          value={item.bought}
          onValueChange={() => toggleBought(item.id)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={item.bought ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wishlist</Text>
      
      {/* Summary */}
      {wishlist.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Total: €{getTotalPrice().toFixed(2)} ({wishlist.length} items)
          </Text>
          <Text style={styles.summaryText}>
            Bought: €{getBoughtTotal().toFixed(2)} ({wishlist.filter(item => item.bought).length} items)
          </Text>
        </View>
      )}

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Item name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Price (€)"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Wishlist */}
      <FlatList
        data={wishlist}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>Your wishlist is empty</Text>
            <Text style={styles.emptyListSubtext}>Add your first item above!</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
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
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  boughtItem: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
  },
  boughtText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    marginRight: 8,
    fontSize: 18,
    color: '#28a745',
    fontWeight: 'bold',
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
});
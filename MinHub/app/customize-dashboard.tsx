import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

const lightPurplePalette = {
  primary: '#8A63D2',
  background: '#F5F3F9',
  card: '#FFFFFF',
  text: '#1A202C',
  subtleText: '#718096',
  border: '#E2E8F0',
  iconBackground: '#EDE9F6',
};

interface AppFeatureForSort {
  id: string;
  name: string;
  iconName?: keyof typeof Ionicons.glyphMap;
}

const allAppFeaturesList: AppFeatureForSort[] = [
    { id: 'todo', name: 'Todo List', iconName: 'list-outline' },
    { id: 'notes', name: 'Notes', iconName: 'document-text-outline' },
    { id: 'diary', name: 'Diary', iconName: 'book-outline' },
    { id: 'periodTracker', name: 'Period Tracker', iconName: 'calendar-outline' },
    { id: 'studyPlanner', name: 'Study Planner', iconName: 'school-outline' },
    { id: 'meditation', name: 'Meditation', iconName: 'leaf-outline' },
    { id: 'plantGrowth', name: 'Virtual Plant', iconName: 'leaf-outline' },
    { id: 'calculator', name: 'Calculator', iconName: 'calculator-outline' },
    { id: 'shoppingList', name: 'Shopping Lists', iconName: 'cart-outline' },
    { id: 'reminders', name: 'Reminders', iconName: 'alarm-outline' },
    { id: 'foodScheduler', name: 'Food', iconName: 'restaurant-outline' },
    { id: 'drink', name: 'ReDrink', iconName: 'water-outline' },
    { id: 'calendar', name: 'Calendar', iconName: 'calendar-number-outline' },
    { id: 'clock', name: 'Clock', iconName: 'time-outline' },
    { id: 'workout', name: 'Workout', iconName: 'barbell-outline' },
    { id: 'countdown', name: 'Countdown', iconName: 'hourglass-outline' },
    { id: 'sleepHelper', name: 'Sleep Helper', iconName: 'moon-outline' },
    { id: 'earTraining', name: 'EarTraining', iconName: 'musical-notes-outline' },
    { id: 'pomodoro', name: 'Pomostudy', iconName: 'timer-outline' },
    { id: 'memory', name: 'Memory', iconName: 'game-controller-outline' },
    { id: 'expense', name: 'Expense Tracker', iconName: 'cash-outline'},
];

const CUSTOM_DASHBOARD_ORDER_KEY = 'minhub_custom_dashboard_order';

export default function CustomizeDashboardScreen() {
  const router = useRouter();
  const styles = createThemedStyles(lightPurplePalette);
  const [orderedFeatures, setOrderedFeatures] = useState<AppFeatureForSort[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      setIsLoading(true);
      try {
        const customOrderJson = await AsyncStorage.getItem(CUSTOM_DASHBOARD_ORDER_KEY);
        if (customOrderJson) {
          const customOrderIds: string[] = JSON.parse(customOrderJson);
          const featuresMap = new Map(allAppFeaturesList.map(f => [f.id, f]));
          const sorted = customOrderIds.map(id => featuresMap.get(id)).filter(Boolean) as AppFeatureForSort[];
          allAppFeaturesList.forEach(feature => {
            if (!customOrderIds.includes(feature.id)) {
              sorted.push(feature);
            }
          });
          setOrderedFeatures(sorted);
        } else {
          setOrderedFeatures([...allAppFeaturesList]); 
        }
      } catch (e) {
        console.error("Failed to load custom dashboard order", e);
        setOrderedFeatures([...allAppFeaturesList]);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrder();
  }, []);

  const handleSaveOrder = async () => {
    setIsLoading(true);
    try {
      const orderToSave = orderedFeatures.map(f => f.id);
      await AsyncStorage.setItem(CUSTOM_DASHBOARD_ORDER_KEY, JSON.stringify(orderToSave));
      Alert.alert("Order Saved", "Your dashboard order has been updated.");
      if (router.canGoBack()) router.back();
    } catch (e) {
      console.error("Failed to save custom dashboard order", e);
      Alert.alert("Error", "Could not save your preferences.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderItem = ({ item, drag, isActive }: RenderItemParams<AppFeatureForSort>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.draggableRow,
            isActive && styles.draggableRowActive,
          ]}
        >
          <Ionicons name="reorder-three-outline" size={28} color={lightPurplePalette.subtleText} />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };


  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Customize Dashboard" }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Drag to Reorder</Text>
            <Text style={styles.headerSubtitle}>Press and hold an item, then drag it to your desired position.</Text>
        </View>
        <DraggableFlatList
          data={orderedFeatures}
          onDragEnd={({ data }) => setOrderedFeatures(data)}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          containerStyle={{ flex: 1 }}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveOrder} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={lightPurplePalette.card} /> : <Text style={styles.saveButtonText}>Save Order</Text>}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const createThemedStyles = (theme: typeof lightPurplePalette) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    safeArea: {
        flex: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 20 : 10,
        paddingBottom: 16,
        backgroundColor: theme.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: theme.text,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.subtleText,
        textAlign: 'center',
        marginTop: 4,
    },
    draggableRow: {
        backgroundColor: theme.card,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 26,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    draggableRowActive: {
        backgroundColor: theme.iconBackground,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2, },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dragIcon: {
        marginRight: 16,
    },
    rowLabel: {
        fontSize: 17,
        color: theme.text,
    },
    saveButton: {
        backgroundColor: theme.primary,
        paddingVertical: 16,
        marginHorizontal: 20,
        marginBottom: Platform.OS === 'ios' ? 10 : 20, 
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop:10,
    },
    saveButtonText: {
        color: theme.card,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
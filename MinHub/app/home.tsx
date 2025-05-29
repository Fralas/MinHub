import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const USER_PROFILE_KEY = 'minhub_user_profile_data';
const REVERSE_DASHBOARD_ORDER_KEY = 'minhub_reverse_dashboard_order';

interface UserProfile {
  age: string;
  accountName: string;
  profession: string;
  email: string;
  hobbies: string[];
  reasonForUse: string;
  questionnaireCompletedOn: string;
}

interface AppFeature {
  id: string;
  name: string;
  href: any;
  relevance?: number;
  iconName?: keyof typeof Ionicons.glyphMap;
}

const lightPurplePalette = {
  primary: '#8A63D2',
  background: '#F5F3F9',
  card: '#FFFFFF',
  text: '#1A202C',
  subtleText: '#718096',
  border: '#E2E8F0',
  danger: '#E53E3E',
  iconBackground: '#EDE9F6',
  featureButtonText: '#333333',
  welcomeText: '#8A63D2',
  titleText: '#6B46C1', 
  headerBackground: '#FFFFFF',
};

const allAppFeatures: AppFeature[] = [
  { id: 'todo', name: 'Todo List', href: '/App_inApp/ToDoList/toDoList', iconName: 'list-outline' },
  { id: 'notes', name: 'Notes', href: '/App_inApp/Notes/notes', iconName: 'document-text-outline' },
  { id: 'diary', name: 'Diary', href: '/App_inApp/Diary/diary', iconName: 'book-outline' },
  { id: 'periodTracker', name: 'Period Tracker', href: '/App_inApp/PeriodTracker/periodTracker', iconName: 'calendar-outline' },
  { id: 'studyPlanner', name: 'Study Planner', href: '/App_inApp/StudyPlanner/studyPlanner', iconName: 'school-outline' },
  { id: 'meditation', name: 'Meditation', href: '/App_inApp/Meditation/guided-meditations', iconName: 'leaf-outline' },
  { id: 'plantGrowth', name: 'Virtual Plant', href: '/App_inApp/PlantGrowth/plantGrowth', iconName: 'leaf-outline' },
  { id: 'calculator', name: 'Calculator', href: '/App_inApp/Calculator/calculator', iconName: 'calculator-outline' },
  { id: 'shoppingList', name: 'Shopping Lists', href: '/App_inApp/ShoppingList/shoppinglist', iconName: 'cart-outline' },
  { id: 'reminders', name: 'Reminders', href: '/App_inApp/Reminders/reminders', iconName: 'alarm-outline' },
  { id: 'foodScheduler', name: 'Food', href: '/App_inApp/Food/foodScheduler', iconName: 'restaurant-outline' },
  { id: 'drink', name: 'ReDrink', href: '/App_inApp/DrinkReminder/DrinkReminder', iconName: 'water-outline' },
  { id: 'calendar', name: 'Calendar', href: '/App_inApp/Calendar/calendar', iconName: 'calendar-number-outline' },
  { id: 'clock', name: 'Clock', href: '/App_inApp/Clock/clock', iconName: 'time-outline' },
  { id: 'workout', name: 'Workout', href: '/App_inApp/Workout/workout', iconName: 'barbell-outline' },
  { id: 'countdown', name: 'Countdown', href: '/App_inApp/Countdown/countdown', iconName: 'hourglass-outline' },
  { id: 'sleepHelper', name: 'Sleep Helper', href: '/App_inApp/SleepHelper/sleep-helper', iconName: 'moon-outline' },
  { id: 'earTraining', name: 'EarTraining', href: '/App_inApp/EarTraining/earTraining', iconName: 'musical-notes-outline' },
  { id: 'pomodoro', name: 'Pomostudy', href: '/App_inApp/Pomodoro/pomodoro', iconName: 'timer-outline' },
  { id: 'memory', name: 'Memory', href: '/App_inApp/Memory/MemoryGame', iconName: 'game-controller-outline' },
  { id: 'expense', name: 'Expense Tracker', href: '/App_inApp/ExpenseTracker/ExpensesScreen', iconName: 'cash-outline' },
];

function useAppInitialData() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDashboardOrderReversed, setIsDashboardOrderReversed] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setIsLoadingData(true);
        try {
          const profileDataString = await AsyncStorage.getItem(USER_PROFILE_KEY);
          if (profileDataString) {
            setUserProfile(JSON.parse(profileDataString));
          } else {
            setUserProfile(null);
          }

          const reverseOrderSetting = await AsyncStorage.getItem(REVERSE_DASHBOARD_ORDER_KEY);
          setIsDashboardOrderReversed(reverseOrderSetting === 'true');

        } catch (error) {
          console.error('Failed to load app initial data:', error);
          setUserProfile(null);
          setIsDashboardOrderReversed(false);
        } finally {
          setIsLoadingData(false);
        }
      };

      loadData();
    }, [])
  );

  return { userProfile, isDashboardOrderReversed, isLoadingData };
}

export default function HomeScreen() {
  const { userProfile, isDashboardOrderReversed, isLoadingData } = useAppInitialData();
  const router = useRouter();
  const styles = createThemedStyles(lightPurplePalette);

  const personalizedFeatures = useMemo(() => {
    let features = [...allAppFeatures]; 

    if (userProfile) {
      features = features
        .map(feature => {
          let relevance = 0;
          if (userProfile.profession === '🧑‍🎓 Student' && (feature.id === 'studyPlanner' || feature.id === 'pomodoro' || feature.id === 'notes')) {
            relevance = 10;
          }
          if (userProfile.reasonForUse === '🧘‍♀️ Reduce stress' && (feature.id === 'meditation' || feature.id === 'diary' || feature.id === 'sleepHelper' || feature.id === 'drink' || feature.id === 'memory')) {
            relevance = 10;
          }
          if (userProfile.reasonForUse === '💪 Increase productivity' && (feature.id === 'todo' || feature.id === 'pomodoro' || feature.id === 'studyPlanner')) {
            relevance = 10;
          }
          if (userProfile.hobbies.includes('🍳 Cooking') && (feature.id === 'foodScheduler' || feature.id === 'shoppingList')) {
              relevance = 8;
          }
          return { ...feature, relevance };
        })
        .sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
    }
    
    if (isDashboardOrderReversed) {
      return features.reverse();
    }
    return features;
  }, [userProfile, isDashboardOrderReversed]);

  if (isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightPurplePalette.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.customHeader}>
        <View style={{ width: 40 }} /> 
        <View style={styles.titleContainer}>
          {userProfile?.accountName ? (
            <Text style={styles.welcomeTitle}>
              Welcome, {userProfile.accountName}!
            </Text>
          ) : (
            <Text style={styles.defaultHomeTitle}> 
              MinHub Home
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
           <Ionicons name="settings-outline" size={28} color={lightPurplePalette.primary} />
        </TouchableOpacity>
      </View>

      {userProfile?.profession === '🧑‍🎓 Student' && (
        <Text style={styles.suggestionText}>Student mode: Study tools are prioritized!</Text>
      )}

      <ScrollView contentContainerStyle={styles.featuresGrid}>
        {personalizedFeatures.map((feature) => (
          <Link href={feature.href} asChild key={feature.id}>
            <TouchableOpacity style={styles.featureButton}>
              {feature.iconName && <Ionicons name={feature.iconName} size={36} color={lightPurplePalette.primary} style={styles.featureIcon} />}
              <Text style={styles.featureButtonText}>{feature.name}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createThemedStyles = (theme: typeof lightPurplePalette) => {
  const numColumns = 2;
  const horizontalPaddingTotalForGrid = 32;
  const gapBetweenItems = 16;
  const itemWidth = (screenWidth - horizontalPaddingTotalForGrid - (gapBetweenItems * (numColumns - 1))) / numColumns;
  const headerHeight = Platform.OS === 'android' ? 110 : 100;

  return StyleSheet.create({
    safeAreaContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    customHeader: {
      height: headerHeight,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      backgroundColor: theme.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 3,
      paddingTop: Platform.OS === 'android' ? 10 : 0,
    },
    settingsButton: {
      padding: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    titleContainer: { 
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 5, 
    },

    welcomeTitle: { 
      fontSize: 20, 
      fontWeight: 'bold',
      color: theme.titleText, 
      textAlign: 'center', 
    },
    defaultHomeTitle: { 
      fontSize: 30,
      fontWeight: 'bold',
      color: theme.titleText,
      textAlign: 'center',
    },
    suggestionText: {
      fontSize: 15,
      color: theme.welcomeText,
      marginTop: 15,
      marginBottom: 20,
      textAlign: 'center',
      paddingHorizontal: 20,
      fontWeight: '500',
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: horizontalPaddingTotalForGrid / 2,
      paddingTop: 16, 
      paddingBottom: 30,
    },
    featureButton: {
      width: itemWidth,
      height: itemWidth * 0.9,
      backgroundColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: gapBetweenItems,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 3,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 5,
      padding: 10,
    },
    featureIcon: {
      marginBottom: 10,
    },
    featureButtonText: {
      fontSize: 14,
      color: theme.featureButtonText,
      textAlign: 'center',
      fontWeight: '600',
    },
  });
};



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
import { useTheme } from '../src/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const USER_PROFILE_KEY = 'minhub_user_profile_data';

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
}

const allAppFeatures: AppFeature[] = [
  { id: 'todo', name: 'Todo List', href: '/App_inApp/ToDoList/toDoList' },
  { id: 'notes', name: 'Notes', href: '/App_inApp/Notes/notes' },
  { id: 'diary', name: 'Diary', href: '/App_inApp/Diary/diary' },
  { id: 'periodTracker', name: 'Period Tracker', href: '/App_inApp/PeriodTracker/periodTracker' },
  { id: 'studyPlanner', name: 'Study Planner', href: '/App_inApp/StudyPlanner/studyPlanner' },
  { id: 'meditation', name: 'Meditation', href: '/App_inApp/Meditation/guided-meditations' },
  { id: 'plantGrowth', name: 'Virtual Plant', href: '/App_inApp/PlantGrowth/plantGrowth' },
  { id: 'calculator', name: 'Calculator', href: '/App_inApp/Calculator/calculator' },
  { id: 'shoppingList', name: 'Shopping Lists', href: '/App_inApp/ShoppingList/shoppinglist' },
  { id: 'reminders', name: 'Reminders', href: '/App_inApp/Reminders/reminders' },
  { id: 'foodScheduler', name: 'Food', href: '/App_inApp/Food/foodScheduler' },
  { id: 'calendar', name: 'Calendar', href: '/App_inApp/Calendar/calendar' },
  { id: 'clock', name: 'Clock', href: '/App_inApp/Clock/clock' },
  { id: 'workout', name: 'Workout', href: '/App_inApp/Workout/workout' },
  { id: 'countdown', name: 'Countdown', href: '/App_inApp/Countdown/countdown' },
  { id: 'sleepHelper', name: 'Sleep Helper', href: '/App_inApp/SleepHelper/sleep-helper' },
  { id: 'earTraining', name: 'EarTraining', href: '/App_inApp/EarTraining/earTraining' },
  { id: 'pomodoro', name: 'Pomostudy', href: '/App_inApp/Pomodoro/pomodoro' },
];

function useUserProfile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadUserProfile = async () => {
        setIsLoadingProfile(true);
        try {
          const profileDataString = await AsyncStorage.getItem(USER_PROFILE_KEY);
          if (isActive && profileDataString) {
            setUserProfile(JSON.parse(profileDataString));
          } else if (isActive) {
            setUserProfile(null);
          }
        } catch (error) {
          if (isActive) setUserProfile(null);
          console.error('Failed to load user profile data on focus:', error);
        } finally {
          if (isActive) setIsLoadingProfile(false);
        }
      };

      loadUserProfile();

      return () => {
        isActive = false;
      };
    }, [])
  );

  return { userProfile, isLoadingProfile };
}

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { userProfile, isLoadingProfile } = useUserProfile();
  const router = useRouter();
  const personalizedFeatures = useMemo(() => {
    if (!userProfile) {
      return allAppFeatures;
    }
    return [...allAppFeatures]
      .map(feature => {
        let relevance = 0;
        if (userProfile.profession === '🧑‍🎓 Student' && (feature.id === 'studyPlanner' || feature.id === 'pomodoro' || feature.id === 'notes')) {
          relevance = 10;
        }
        if (userProfile.reasonForUse === '🧘‍♀️ Reduce stress' && (feature.id === 'meditation' || feature.id === 'diary' || feature.id === 'sleepHelper')) {
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
  }, [userProfile]);

  const styles = createThemedStyles(theme, isDark);

  if (isLoadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.titlePlaceholder} />
        <Text style={styles.title}>
          {userProfile?.accountName ? `Welcome, ${userProfile.accountName}!` : 'MinHub Home'}
        </Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
           <Ionicons name="settings-outline" size={26} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {userProfile?.profession === '🧑‍🎓 Student' && (
        <Text style={styles.suggestionText}>Student mode: Study tools are prioritized!</Text>
      )}

      <ScrollView contentContainerStyle={styles.iconContainer}>
        {personalizedFeatures.map((feature) => (
          <Link href={feature.href} asChild key={feature.id}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>{feature.name}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createThemedStyles = (theme: import('../src/styles/themes').Theme, isDark: boolean) => {
  const numColumns = 2;
  const horizontalPaddingTotalForIconContainer = 20; 
  const gapBetweenItems = 15;
  const itemWidth = (screenWidth - horizontalPaddingTotalForIconContainer - (gapBetweenItems * (numColumns - 1))) / numColumns;

  return StyleSheet.create({
    safeAreaContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15, 
      paddingTop: Platform.OS === 'android' ? 35 : 25,
      paddingBottom: 15,
      width: '100%',
    },
    titlePlaceholder: { 
      width: 26 + 15, 
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
    title: {
      flex: 1, 
      fontSize: 22, 
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginHorizontal: 5, 
    },
    suggestionText: {
      fontSize: 16,
      color: theme.primary,
      marginTop: 10,
      marginBottom: 20,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    iconContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: horizontalPaddingTotalForIconContainer / 2,
      paddingBottom: 30,
      width: '100%',
    },
    iconButton: {
      width: itemWidth,
      height: itemWidth,
      backgroundColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: gapBetweenItems,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.25 : 0.1,
      shadowRadius: 3,
      padding: 8,
    },
    iconText: {
      fontSize: 14,
      color: theme.text,
      textAlign: 'center',
      fontWeight: '500',
    },
  });
};
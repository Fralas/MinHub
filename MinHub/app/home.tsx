import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
const ONBOARDING_COMPLETED_KEY = 'minhub_onboarding_completed';


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
  href: string;
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

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profileDataString = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (profileDataString) {
          setUserProfile(JSON.parse(profileDataString));
        }
      } catch (error) {
      } finally {
        setIsLoadingProfile(false);
      }
    };
    loadUserProfile();
  }, []);
  return { userProfile, isLoadingProfile };
}

export default function HomeScreen() {
  const { userProfile, isLoadingProfile } = useUserProfile();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      router.replace('/'); 
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

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

  if (isLoadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#641E7A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
            <Text style={styles.title}>
            {userProfile?.accountName ? `Welcome, ${userProfile.accountName}!` : 'MinHub Home'}
            </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {userProfile?.profession === '🧑‍🎓 Student' && (
        <Text style={styles.suggestionText}>Student mode: Study tools are prioritized!</Text>
      )}

      <ScrollView contentContainerStyle={styles.iconContainer}>
        {personalizedFeatures.map((feature) => (
          <Link href={feature.href as any} asChild key={feature.id}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>{feature.name}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const numColumns = 2;
const horizontalPaddingTotal = 20;
const gapBetweenItems = 15;
const itemWidth = (screenWidth - horizontalPaddingTotal - (gapBetweenItems * (numColumns - 1))) / numColumns;

const styles = StyleSheet.create({
  safeAreaContainer: { 
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: horizontalPaddingTotal / 2,
    paddingTop: Platform.OS === 'android' ? 25 : 15,
    paddingBottom: 10,
    width: '100%',
  },
  titleContainer: {
    flex: 1, 
    alignItems: 'center', 
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logoutButtonText: {
    color: '#641E7A', 
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 24, 
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  suggestionText: {
    fontSize: 16,
    color: '#641E7A',
    marginBottom: 15, 
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalPaddingTotal / 2,
    paddingBottom: 30,
    width: '100%',
  },
  iconButton: {
    width: itemWidth,
    height: itemWidth,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: gapBetweenItems,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#dce1e6',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2.5,
    padding: 8,
  },
  iconText: {
    fontSize: 14,
    color: '#34495e',
    textAlign: 'center',
    fontWeight: '500',
  },
});
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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
        <ActivityIndicator size="large" color="#00796b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {userProfile?.accountName ? `Welcome, ${userProfile.accountName}!` : 'MinHub Home'}
      </Text>
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
    </View>
  );
}

const numColumns = 2;
const horizontalPaddingTotal = 70; 
const gapBetweenItems = 30; 
const itemWidth = (screenWidth - horizontalPaddingTotal - (gapBetweenItems * (numColumns - 1))) / numColumns;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#2c3e50',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  suggestionText: {
    fontSize: 16,
    color: '#00796b',
    marginBottom: 20,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0dae0',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    padding: 5, 
  },
  iconText: {
    fontSize: 18,
    color: '#34495e',
    textAlign: 'center',
    fontWeight: '500',
  },
});
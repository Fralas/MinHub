import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet
} from 'react-native';
import { useTheme } from '../src/contexts/ThemeContext';

const USER_PROFILE_KEY = 'minhub_user_profile_data';

interface UserProfileData {
  age: string;
  accountName: string;
  profession: string;
  email: string;
  hobbies: string[];
  reasonForUse: string;
  questionnaireCompletedOn: string;
}

const ProfessionOptions = ["🧑‍🎓 Student", "🧑‍💼 Employed", "🚫 Neither", "🤔 Other"];
const HobbyOptions = ["🎨 Painting", "🎵 Music", "⚽ Sports", "📚 Reading", "🎮 Gaming", "🍳 Cooking"];


export default function EditProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = createThemedStyles(theme);

  const [isLoading, setIsLoading] = useState(true);
  const [accountName, setAccountName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  
  const [originalProfile, setOriginalProfile] = useState<Partial<UserProfileData>>({});


  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        const jsonData = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (jsonData) {
          const profile: UserProfileData = JSON.parse(jsonData);
          setOriginalProfile(profile);
          setAccountName(profile.accountName || '');
          setAge(profile.age || '');
          setEmail(profile.email || '');
          setProfession(profile.profession || '');
          setSelectedHobbies(profile.hobbies || []);
        }
      } catch (error) {
        console.error("Failed to load profile data", error);
        Alert.alert("Error", "Could not load profile data.");
      } finally {
        setIsLoading(false);
      }
    };
    loadProfileData();
  }, []);

}

const createThemedStyles = (theme: import('../src/styles/themes').Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContentContainer: {
        paddingBottom: 30,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 8,
      fontWeight: '500',
    },
    input: {
      backgroundColor: theme.card,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 15,
      fontSize: 16,
    },
    optionsRowContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    optionChip: {
      backgroundColor: theme.card,
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    optionChipSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    optionChipText: {
      color: theme.primary,
      fontSize: 14,
    },
    optionChipTextSelected: {
      color: theme.card, 
    },
    saveButton: {
      backgroundColor: theme.primary,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
    },
    saveButtonText: {
      color: theme.card, 
      fontSize: 18,
      fontWeight: 'bold',
    },
  });
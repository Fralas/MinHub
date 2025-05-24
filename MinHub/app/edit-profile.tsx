import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router'; // useRouter non era usato, useNavigation sì
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
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

const validateEmailFormat = (emailToValidate: string): boolean => {
  if (!emailToValidate) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailToValidate);
};

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const styles = createThemedStyles(theme);

  const [isLoading, setIsLoading] = useState(true);
  const [accountName, setAccountName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
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

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError && validateEmailFormat(text)) {
        setEmailError('');
    }
  };

  const handleSaveProfile = async () => {
    if (!validateEmailFormat(email)) {
      setEmailError('Please enter a valid email address.');
      Alert.alert("Invalid Email", "Please check your email address.");
      return;
    }
    setEmailError('');
    setIsLoading(true);

    const updatedProfile: UserProfileData = {
      ...(originalProfile as UserProfileData),
      accountName: accountName.trim(),
      age: age.trim(),
      email: email.trim(),
      profession: profession,
      hobbies: selectedHobbies,
    };

    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      Alert.alert("Profile Updated", "Your profile has been saved successfully.");
      setOriginalProfile(updatedProfile); // Aggiorna lo stato originale con i dati salvati
    } catch (error) {
      console.error("Failed to save profile data", error);
      Alert.alert("Error", "Could not save profile data.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleHobby = (hobby: string) => {
    setSelectedHobbies(prev =>
      prev.includes(hobby) ? prev.filter(h => h !== hobby) : [...prev, hobby]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
        headerRight: () => (
            <TouchableOpacity onPress={handleSaveProfile} style={{ marginRight: 15 }}>
                <Text style={{ color: theme.primary, fontSize: 17, fontWeight: '600' }}>Save</Text>
            </TouchableOpacity>
        ),
    });
  }, [navigation, accountName, age, email, profession, selectedHobbies, theme.primary]);


  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Account Name</Text>
          <TextInput
            style={styles.input}
            value={accountName}
            onChangeText={setAccountName}
            placeholder="Your account name"
            placeholderTextColor={theme.subtleText}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Your age"
            keyboardType="numeric"
            placeholderTextColor={theme.subtleText}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : {}]}
            value={email}
            onChangeText={handleEmailChange}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.subtleText}
            onBlur={() => validateEmailFormat(email) ? setEmailError('') : setEmailError('Invalid email format.')}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Profession</Text>
          <View style={styles.optionsRowContainer}>
            {ProfessionOptions.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.optionChip, profession === option && styles.optionChipSelected]}
                onPress={() => setProfession(option)}
              >
                <Text style={[styles.optionChipText, profession === option && styles.optionChipTextSelected]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Hobbies</Text>
          <View style={styles.optionsRowContainer}>
            {HobbyOptions.map(hobby => (
              <TouchableOpacity
                key={hobby}
                style={[styles.optionChip, selectedHobbies.includes(hobby) && styles.optionChipSelected]}
                onPress={() => toggleHobby(hobby)}
              >
                <Text style={[styles.optionChipText, selectedHobbies.includes(hobby) && styles.optionChipTextSelected]}>{hobby}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
    </View>
  );
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
      marginBottom: 25,
    },
    label: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 10,
      fontWeight: '600',
    },
    input: {
      backgroundColor: theme.card,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 17,
    },
    inputError: {
      borderColor: theme.danger,
    },
    errorText: {
      color: theme.danger,
      fontSize: 13,
      marginTop: 5,
    },
    optionsRowContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    optionChip: {
      backgroundColor: theme.card,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: theme.primary,
    },
    optionChipSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    optionChipText: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: '500',
    },
    optionChipTextSelected: {
      color: theme.card,
    },
  });
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router';
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

const lightPurplePalette = {
  primary: '#8A63D2',
  background: '#F5F3F9',
  card: '#FFFFFF',
  text: '#1A202C',
  labelText: '#553c9a', 
  subtleText: '#A0AEC0',
  border: '#DCD7E7',    
  danger: '#E53E3E',       
  chipSelectedText: '#FFFFFF',
  chipText: '#8A63D2', 
  chipBackground: '#EDE9F6',
  saveButtonBackground: '#8A63D2',
  saveButtonText: '#FFFFFF',
};


export default function EditProfileScreen() {
  const navigation = useNavigation();
  const styles = createThemedStyles(lightPurplePalette);

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
      setOriginalProfile(updatedProfile);
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
            <TouchableOpacity onPress={handleSaveProfile} style={styles.saveButton} disabled={isLoading}>
                <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
        ),
        headerStyle: {
            backgroundColor: lightPurplePalette.background,
            shadowOpacity: 0, 
            elevation: 0,
        },
        headerTitleStyle: {
            color: lightPurplePalette.text,
            fontWeight: 'bold',
        },
        headerTintColor: lightPurplePalette.primary 
    });
  }, [navigation, accountName, age, email, profession, selectedHobbies, isLoading, styles]);


  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={lightPurplePalette.primary} />
      </View>
    );
  }

  const renderInput = (label: string, value: string, onChangeText: (text: string) => void, placeholder: string, keyboardType: 'default' | 'numeric' | 'email-address' = 'default', error?: string) => (
    <View style={styles.formGroup}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            style={[styles.input, error ? styles.inputError : {}]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            keyboardType={keyboardType}
            autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
            placeholderTextColor={lightPurplePalette.subtleText}
            selectionColor={lightPurplePalette.primary} 
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
        <SafeAreaView style={styles.safeArea}>
            {renderInput('Account Name', accountName, setAccountName, 'E.g. John Doe')}
            {renderInput('Age', age, setAge, 'E.g. 25', 'numeric')}
            {renderInput('Email', email, handleEmailChange, 'your.email@example.com', 'email-address', emailError)}
            
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

const createThemedStyles = (theme: typeof lightPurplePalette) =>
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
      paddingBottom: 40,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    formGroup: {
      marginBottom: 30, 
    },
    label: {
      fontSize: 17, 
      color: theme.labelText, 
      marginBottom: 14, 
      fontWeight: '700', 
      letterSpacing: 0.3, 
    },
    input: {
      backgroundColor: theme.card,
      color: theme.text,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 14, 
      paddingVertical: 18,
      paddingHorizontal: 18, 
      fontSize: 16,
    },
    inputError: {
      borderColor: theme.danger,
      borderWidth: 1.5,
    },
    errorText: {
      color: theme.danger,
      fontSize: 14,
      marginTop: 8,
    },
    optionsRowContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    optionChip: {
      backgroundColor: theme.chipBackground,
      paddingVertical: 12, 
      paddingHorizontal: 22, 
      borderRadius: 22, 
      borderWidth: 1.5,
      borderColor: theme.chipBackground, 
    },
    optionChipSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary, 
    },
    optionChipText: {
      color: theme.chipText, 
      fontSize: 15,
      fontWeight: '600',
    },
    optionChipTextSelected: {
      color: theme.chipSelectedText, 
    },
    saveButton: {
        backgroundColor: theme.saveButtonBackground,
        paddingHorizontal: 22,
        paddingVertical: 10, 
        borderRadius: 22,    
        marginRight: 10, 
    },
    saveButtonText: {
        color: theme.saveButtonText, 
        fontSize: 17, 
        fontWeight: 'bold',
    }
  });

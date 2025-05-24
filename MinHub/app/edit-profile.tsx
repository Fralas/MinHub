import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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


  const handleSaveProfile = async () => {
    const updatedProfile: UserProfileData = {
      ...originalProfile,
      accountName: accountName.trim(),
      age: age.trim(),
      email: email.trim(),
      profession: profession,
      hobbies: selectedHobbies,
    };

      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      Alert.alert("Profile Updated", "Your profile has been saved successfully.");
  };
 

  return (
    <View style={styles.container}>
    <ScrollView contentContainerStyle={styles.scrollContentContainer}>
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

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
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
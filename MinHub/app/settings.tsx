import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const USER_PROFILE_KEY = 'minhub_user_profile_data';
const ONBOARDING_COMPLETED_KEY = 'minhub_onboarding_completed';

export default function SettingsScreen() {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.row} onPress={() => { }}>
          <Text style={styles.rowLabel}>Edit Profile</Text>
          <Text style={styles.rowIcon}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => { }}>
          <Text style={styles.rowLabel}>Notifications</Text>
          <Text style={styles.rowIcon}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => { }}>
          <Text style={styles.rowLabel}>Appearance</Text>
          <Text style={styles.rowIcon}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6e7a8a',
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 16,
    backgroundColor: '#f0f4f8',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f8',
  },
  rowLabel: {
    fontSize: 17,
    color: '#333',
  },
  rowIcon: {
    fontSize: 20,
    color: '#c7c7cc',
  },
  logoutButton: {
    backgroundColor: 'white',
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 17,
    color: '#e74c3c',
    fontWeight: '500',
  },
});
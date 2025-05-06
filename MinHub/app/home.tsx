import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Page</Text>
      <View style={styles.iconContainer}>
        <Link href="/App_inApp/ToDoList/toDoList" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>Todo List</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/App_inApp/Clock/clock" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>Clock</Text>
          </TouchableOpacity>
        </Link>

        {/* New Link for Notes App */}
        <Link href="/App_inApp/Notes/notes" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>Notes</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 50,
    color: '#2c3e50',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    flexWrap: 'wrap', // Allows items to wrap if too many
  },
  iconButton: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 10,
    backgroundColor: '#fff',
    minWidth: 100, // Ensure buttons have a decent width
    margin: 10, // Add some margin around buttons
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconText: {
    marginTop: 5,
    fontSize: 16,
    color: '#34495e',
  },
});
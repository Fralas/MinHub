import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MinHub Home</Text>
      <View style={styles.iconContainer}>
        <Link href="/App_inApp/ToDoList/toDoList" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>Todo List</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/App_inApp/Notes/notes" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>Notes</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/App_inApp/ShoppingList/shoppinglist" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>Shopping Lists</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/App_inApp/Reminders/reminders" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>Reminders</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/App_inApp/Calendar/calendar" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>Calendar</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/App_inApp/Clock/clock" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>Clock</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/App_inApp/Pomodoro/pomodoro" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>Pomostudy</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 50,
    color: '#2c3e50',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '95%',
    flexWrap: 'wrap',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#d0dae0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    minWidth: 120,
    height: 100,
    margin: 10,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconText: {
    fontSize: 15,
    color: '#34495e',
    textAlign: 'center',
  },
});
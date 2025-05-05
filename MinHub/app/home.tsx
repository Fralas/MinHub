import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Per le icone, puoi installare @expo/vector-icons
// npm install @expo/vector-icons
// import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Page</Text>
      <View style={styles.iconContainer}>
        {/* Link alla Todo List */}
        <Link href="/App_inApp/ToDoList/toDoList" asChild>
          <TouchableOpacity style={styles.iconButton}>
            {/* Qui puoi inserire un'icona, ad esempio: */}
            {/* <Ionicons name="list" size={32} color="blue" /> */}
            <Text style={styles.iconText}>Todo List</Text>
          </TouchableOpacity>
        </Link>

        {/* Link all'Orologio */}
        <Link href="/App_inApp/Clock/clock" asChild>
          <TouchableOpacity style={styles.iconButton}>
            {/* Qui puoi inserire un'icona, ad esempio: */}
            {/* <Ionicons name="time" size={32} color="green" /> */}
            <Text style={styles.iconText}>Orologio</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  iconContainer: {
    flexDirection: 'row', // Mette le icone una accanto all'altra
    justifyContent: 'space-around', // Spazia le icone uniformemente
    width: '80%', // Occupa l'80% della larghezza
  },
  iconButton: {
    alignItems: 'center', // Centra il testo/icona dentro il bottone
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
  },
  iconText: {
    marginTop: 5, // Spazio tra icona (se presente) e testo
    fontSize: 16,
  },
});
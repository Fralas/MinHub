import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';

const NOTES = [
  { name: 'C', file: require('./notes/c6.mp3') },
  { name: 'D', file: require('./notes/d6.mp3') },
  { name: 'E', file: require('./notes/e6.mp3') },
  { name: 'F', file: require('./notes/f6.mp3') },
  { name: 'G', file: require('./notes/g6.mp3') },
  { name: 'A', file: require('./notes/a6.mp3') },
  { name: 'B', file: require('./notes/b6.mp3') },
];

export default function EarTraining() {
  const [currentNote, setCurrentNote] = useState<{ name: string; file: any } | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [options, setOptions] = useState<string[]>([]);

  const generateQuestion = async () => {

    const correct = NOTES[Math.floor(Math.random() * NOTES.length)];

    const shuffled = NOTES
      .filter((note) => note.name !== correct.name)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Mix correct with wrong answers
    const choices = [...shuffled.map((n) => n.name), correct.name].sort(() => 0.5 - Math.random());

    setCurrentNote(correct);
    setOptions(choices);

    // Play note
    const { sound } = await Audio.Sound.createAsync(correct.file);
    setSound(sound);
    await sound.playAsync();
  };

  const handleAnswer = (answer: string) => {
    if (answer === currentNote?.name) {
      Alert.alert('Correct!', 'Well done!');
    } else {
      Alert.alert('Incorrect', `It was ${currentNote?.name}`);
    }
    generateQuestion(); 
  };

  useEffect(() => {
    generateQuestion();

    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 Ear Training</Text>
      <Text style={styles.instruction}>Listen to the note and choose the correct name:</Text>
      {options.map((option) => (
        <View style={styles.buttonContainer} key={option}>
          <Button title={option} onPress={() => handleAnswer(option)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  instruction: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    marginVertical: 10,
  },
});
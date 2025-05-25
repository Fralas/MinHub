import React, { useRef } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { NOTES } from './notes';
import { Audio } from 'expo-av';

export default function DemoNotesScreen() {
  const soundRef = useRef<Audio.Sound | null>(null);

  const handlePlayDemo = async (note: typeof NOTES[0]) => {
    if (soundRef.current) await soundRef.current.unloadAsync();
    const { sound } = await Audio.Sound.createAsync(note.file);
    soundRef.current = sound;
    await sound.playAsync();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎧 Demo Notes</Text>
      {NOTES.map(note => (
        <View style={styles.buttonContainer} key={note.name}>
          <Button title={`Play ${note.name}`} onPress={() => handlePlayDemo(note)} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginVertical: 6,
    width: '100%',
  },
});

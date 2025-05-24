import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Preset = {
  id: number;
  name: string;
  duration: number;
};

const STORAGE_KEY = 'TIMER_PRESETS';

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [totalTime, setTotalTime] = useState(0);

  // Fix here: use ReturnType<typeof setInterval> | null
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load presets on mount
  useEffect(() => {
    const loadPresets = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setPresets(JSON.parse(saved));
    };
    loadPresets();
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLeft]);

  const startTimer = () => {
    const seconds = parseInt(inputMinutes) * 60;
    if (isNaN(seconds) || seconds <= 0) return;
    setTimeLeft(seconds);
    setTotalTime(seconds);
    setIsRunning(true);
  };

  const savePreset = async () => {
    const duration = parseInt(inputMinutes) * 60;
    if (!presetName || isNaN(duration)) return;

    const newPreset: Preset = {
      id: Date.now(),
      name: presetName,
      duration,
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPresets));
    setPresetName('');
    setInputMinutes('');
  };

  const applyPreset = (preset: Preset) => {
    setTimeLeft(preset.duration);
    setTotalTime(preset.duration);
    setIsRunning(true);
  };

  const deletePreset = async (id: number) => {
    const filtered = presets.filter((p) => p.id !== id);
    setPresets(filtered);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Circular Progress
  const radius = 80;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.container}>
      <Svg height={radius * 2} width={radius * 2}>
        <Circle
          stroke="#eee"
          fill="none"
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke="#3b82f6"
          fill="none"
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>

      <TextInput
        placeholder="Minutes"
        value={inputMinutes}
        onChangeText={setInputMinutes}
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={startTimer}>
        <Text style={styles.buttonText}>Start Timer</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Preset Name"
        value={presetName}
        onChangeText={setPresetName}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={savePreset}>
        <Text style={styles.buttonText}>Save Preset</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Presets:</Text>
      <FlatList
        data={presets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.presetItem}>
            <TouchableOpacity onPress={() => applyPreset(item)}>
              <Text style={styles.presetText}>
                {item.name} ({Math.floor(item.duration / 60)} min)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Delete preset', 'Are you sure?', [
                  { text: 'Cancel' },
                  { text: 'Delete', onPress: () => deletePreset(item.id) },
                ])
              }
            >
              <Text style={styles.deleteButton}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  timeText: {
    fontSize: 32,
    fontWeight: 'bold',
    position: 'absolute',
    top: 90,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: '80%',
    borderRadius: 8,
    padding: 10,
    marginTop: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  sectionTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
  presetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  presetText: {
    fontSize: 16,
  },
  deleteButton: {
    color: '#d11a2a',
    fontSize: 20,
    paddingHorizontal: 8,
  },
});
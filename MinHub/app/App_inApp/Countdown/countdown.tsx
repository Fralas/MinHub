import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";

export default function Countdown() {
  const [inputMinutes, setInputMinutes] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [presets, setPresets] = useState<number[]>([60, 300, 600]); // default: 1m, 5m, 10m

  const startCountdown = (duration: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(duration);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStart = () => {
    const seconds = parseInt(inputMinutes) * 60;
    if (!isNaN(seconds) && seconds > 0) {
      startCountdown(seconds);
    }
  };

  const handleAddPreset = () => {
    const seconds = parseInt(inputMinutes) * 60;
    if (!isNaN(seconds) && seconds > 0 && !presets.includes(seconds)) {
      setPresets((prev) => [...prev, seconds]);
      setInputMinutes("");
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Countdown Timer</Text>
      <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>

      <TextInput
        placeholder="Minutes"
        value={inputMinutes}
        onChangeText={setInputMinutes}
        keyboardType="numeric"
        style={styles.input}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleAddPreset}>
          <Text style={styles.buttonText}>Add Preset</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Presets</Text>
      <FlatList
        data={presets}
        keyExtractor={(item) => item.toString()}
        horizontal
        contentContainerStyle={styles.presetList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.presetButton}
            onPress={() => startCountdown(item)}
          >
            <Text style={styles.presetText}>{Math.floor(item / 60)} min</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  timerText: {
    fontSize: 48,
    textAlign: "center",
    marginVertical: 24,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 18,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  presetList: {
    gap: 10,
  },
  presetButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  presetText: {
    color: "white",
    fontSize: 16,
  },
});
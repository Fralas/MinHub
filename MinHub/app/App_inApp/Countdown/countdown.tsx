import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Countdown() {
  const [inputMinutes, setInputMinutes] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [presets, setPresets] = useState<{ name: string; duration: number }[]>([]);

  // Load presets from AsyncStorage
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const json = await AsyncStorage.getItem("timerPresets");
        if (json) {
          setPresets(JSON.parse(json));
        }
      } catch (err) {
        console.error("Failed to load presets", err);
      }
    };
    loadPresets();
  }, []);

  // Save presets to AsyncStorage on change
  useEffect(() => {
    const savePresets = async () => {
      try {
        await AsyncStorage.setItem("timerPresets", JSON.stringify(presets));
      } catch (err) {
        console.error("Failed to save presets", err);
      }
    };
    savePresets();
  }, [presets]);

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

  const handleAddPreset = () => {
    const seconds = parseInt(inputMinutes) * 60;
    if (!isNaN(seconds) && seconds > 0) {
      const name = `${parseInt(inputMinutes)} Min${parseInt(inputMinutes) > 1 ? "s" : ""}`;
      setPresets((prev) => [...prev, { name, duration: seconds }]);
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
      <TextInput
        placeholder="Minutes"
        value={inputMinutes}
        onChangeText={setInputMinutes}
        keyboardType="numeric"
        style={styles.input}
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleAddPreset}>
          <Text style={styles.buttonText}>Add Preset</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={presets}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.presetList}
        renderItem={({ item }) => (
          <View style={styles.presetCard}>
            <Text style={styles.presetName}>{item.name}</Text>
            <View style={styles.presetBottomRow}>
              <Text style={styles.timeLeft}>{formatTime(item.duration)}</Text>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => startCountdown(item.duration)}
              >
                <Text style={styles.playButtonText}>▶</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Text style={styles.countdownText}>{formatTime(secondsLeft)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  presetList: {
    paddingBottom: 20,
  },
  presetCard: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  presetName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  presetBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeLeft: {
    fontSize: 16,
  },
  playButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  playButtonText: {
    color: "white",
    fontSize: 18,
  },
  countdownText: {
    fontSize: 36,
    textAlign: "center",
    marginTop: 24,
    fontWeight: "bold",
  },
});

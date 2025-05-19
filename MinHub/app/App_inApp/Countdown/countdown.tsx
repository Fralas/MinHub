import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function Countdown() {
  const [inputTime, setInputTime] = useState(""); 
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      clearInterval(intervalRef.current!);
      setIsRunning(false);
    }

    return () => clearInterval(intervalRef.current!);
  }, [isRunning, seconds]);

  const start = () => {
    const time = parseInt(inputTime, 10);
    if (!isRunning && time > 0) {
      setSeconds(time);
      setIsRunning(true);
    }
  };

  const pause = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current!);
  };

  const reset = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current!);
    setSeconds(0);
    setInputTime("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Countdown Timer</Text>

      <TextInput
        placeholder="Enter time in seconds"
        keyboardType="numeric"
        style={styles.input}
        value={inputTime}
        onChangeText={setInputTime}
        editable={!isRunning}
      />

      <Text style={styles.timerText}>{seconds}s</Text>

      <View style={styles.buttons}>
        <TouchableOpacity onPress={start} style={styles.button}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={pause} style={styles.button}>
          <Text style={styles.buttonText}>Pause</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={reset} style={styles.button}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    width: 200,
    marginBottom: 20,
    textAlign: "center",
  },
  timerText: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 30,
  },
  buttons: {
    flexDirection: "row",
    gap: 16,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
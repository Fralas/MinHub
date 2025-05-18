import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const RADIUS = 100;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Pomodoro() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [studyDuration, setStudyDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);

  const totalSeconds = (isBreak ? (cycles === 3 ? longBreakDuration : shortBreakDuration) : studyDuration) * 60;
  const currentSeconds = minutes * 60 + seconds;
  const progress = currentSeconds / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  useEffect(() => {
    let interval: number | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            if (isBreak) {
              setCycles(prev => prev + 1);
              if (cycles === 3) {
                setMinutes(longBreakDuration);
                setCycles(0);
              } else {
                setMinutes(shortBreakDuration);
              }
            } else {
              setMinutes(studyDuration);
            }
            setIsBreak(!isBreak);
            setSeconds(0);
          } else {
            setMinutes(prev => prev - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(prev => prev - 1);
        }
      }, 1000);
    } else {
      if (interval !== null) clearInterval(interval);
    }

    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [isRunning, minutes, seconds, isBreak, cycles, studyDuration, shortBreakDuration, longBreakDuration]);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setMinutes(studyDuration);
    setSeconds(0);
    setIsBreak(false);
    setCycles(0);
  };

  const formatTime = (time: number) => {
    return time < 10 ? `0${time}` : time;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isBreak ? 'Break Time' : 'Work Time'}</Text>

      <View style={styles.timerContainer}>
        <Svg width={2 * (RADIUS + STROKE_WIDTH)} height={2 * (RADIUS + STROKE_WIDTH)}>
          <Circle
            stroke="#ecf0f1"
            fill="none"
            cx={RADIUS + STROKE_WIDTH}
            cy={RADIUS + STROKE_WIDTH}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
          />
          <Circle
            stroke="#e74c3c"
            fill="none"
            cx={RADIUS + STROKE_WIDTH}
            cy={RADIUS + STROKE_WIDTH}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${CIRCUMFERENCE}, ${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            originX={RADIUS + STROKE_WIDTH}
            originY={RADIUS + STROKE_WIDTH}
          />
        </Svg>
        <Text style={styles.timer}>
          {formatTime(minutes)}:{formatTime(seconds)}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text>Study Duration (min):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(studyDuration)}
          onChangeText={(text) => setStudyDuration(parseInt(text) || 0)}
        />

        <Text>Short Break (min):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(shortBreakDuration)}
          onChangeText={(text) => setShortBreakDuration(parseInt(text) || 0)}
        />

        <Text>Long Break (min):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(longBreakDuration)}
          onChangeText={(text) => setLongBreakDuration(parseInt(text) || 0)}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isRunning ? styles.stopButton : styles.startButton]}
          onPress={handleStartStop}
        >
          <Text style={styles.buttonText}>{isRunning ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.cycleInfo}>Cycles: {cycles}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 30,
  },
  timer: {
    position: 'absolute',
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    width: 100,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    margin: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  startButton: {
    backgroundColor: '#27ae60',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cycleInfo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
});
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Operation = '+' | '-' | '*' | '/' | '^';
type AngleMode = 'DEG' | 'RAD';

export default function CalculatorScreen() {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [previousOperand, setPreviousOperand] = useState<string | null>(null);
  const [currentOperand, setCurrentOperand] = useState<string | null>('0');
  const [operation, setOperation] = useState<Operation | null>(null);
  const [shouldOverwriteDisplay, setShouldOverwriteDisplay] = useState<boolean>(true);
  const [angleMode, setAngleMode] = useState<AngleMode>('RAD');
  const [memoryValue, setMemoryValue] = useState<number>(0);
  const [isErrorState, setIsErrorState] = useState<boolean>(false);

  const toRadians = (degrees: number): number => degrees * (Math.PI / 180);
  const toDegrees = (radians: number): number => radians * (180 / Math.PI);

  const formatResultDisplay = (value: string | number): string => {
    let num;
    if (typeof value === 'string') {
      if (value === 'Error' || value === 'Infinity' || value === '-Infinity') return value;
      num = parseFloat(value);
    } else {
      num = value;
    }

    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return 'Infinity';

    let numStr = num.toString();
    if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-9 && num !== 0)) {
      numStr = num.toExponential(7);
    } else {
      numStr = parseFloat(num.toPrecision(12)).toString();
    }
    return numStr.substring(0, 15);
  };

  const resetErrorState = () => {
    if (isErrorState) {
      clearAll();
      setIsErrorState(false);
    }
  };

  const clearAll = () => {
    setDisplayValue('0');
    setPreviousOperand(null);
    setCurrentOperand('0');
    setOperation(null);
    setShouldOverwriteDisplay(true);
    setIsErrorState(false);
  };

  const inputDigit = (digit: string) => {
    resetErrorState();
    let newOperand;
    if (shouldOverwriteDisplay) {
      newOperand = digit;
      setShouldOverwriteDisplay(false);
    } else {
      if (currentOperand === '0' && digit !== '.') {
        newOperand = digit;
      } else if (digit === '.' && currentOperand?.includes('.')) {
        return;
      } else {
        newOperand = (currentOperand || '') + digit;
      }
    }
    if (newOperand.length > 15) return;
    setCurrentOperand(newOperand);
    setDisplayValue(newOperand);
  };

  const performCalculation = (): string | null => {
    if (previousOperand === null || operation === null || currentOperand === null) {
      return null;
    }
    const prev = parseFloat(previousOperand);
    const curr = parseFloat(currentOperand);

    if (isNaN(prev) || isNaN(curr)) { setIsErrorState(true); return 'Error';}

    let result: number;
    switch (operation) {
      case '+': result = prev + curr; break;
      case '-': result = prev - curr; break;
      case '*': result = prev * curr; break;
      case '/':
        if (curr === 0) { Alert.alert("Error", "Cannot divide by zero"); setIsErrorState(true); return 'Error'; }
        result = prev / curr;
        break;
      case '^': result = Math.pow(prev, curr); break;
      default: return null;
    }
    return formatResultDisplay(result);
  };

  const handleOperation = (selectedOperation: Operation) => {
    resetErrorState();
    if (currentOperand === null && previousOperand === null) return;

    if (operation && previousOperand !== null && currentOperand !== null && !shouldOverwriteDisplay) {
      const result = performCalculation();
      if (result !== null) {
        setDisplayValue(result);
        setPreviousOperand(result === 'Error' ? null : result);
        setCurrentOperand(null);
        setOperation(result === 'Error' ? null : selectedOperation);
        setShouldOverwriteDisplay(true);
        if (result === 'Error') { setIsErrorState(true); return;}
      } else {
        clearAll(); return;
      }
    } else if (currentOperand !== null) {
      setPreviousOperand(currentOperand);
      setCurrentOperand(null);
    }
    setOperation(selectedOperation);
    setShouldOverwriteDisplay(true);
  };

  const handleEquals = () => {
    if (operation && previousOperand !== null && currentOperand !== null) {
      const result = performCalculation();
      if (result !== null) {
        setDisplayValue(result);
        setPreviousOperand(null);
        setCurrentOperand(result === 'Error' ? '0' : result);
        setOperation(null);
        setShouldOverwriteDisplay(true);
        if (result === 'Error') setIsErrorState(true);
      } else {
         clearAll();
      }
    }
  };

  const handleToggleSign = () => {
    resetErrorState();
    const target = currentOperand !== null && !shouldOverwriteDisplay ? currentOperand : displayValue;
    if (target !== null && target !== '0' && target !== 'Error') {
      const newValue = target.startsWith('-') ? target.substring(1) : '-' + target;
      setCurrentOperand(newValue);
      setDisplayValue(newValue);
      setShouldOverwriteDisplay(false);
    }
  };
  
  const handleBackspace = () => {
    if (shouldOverwriteDisplay || currentOperand === null || currentOperand === 'Error' || currentOperand === '0') {
        if(isErrorState) clearAll();
        return;
    }
    if (currentOperand.length === 1 || (currentOperand.length === 2 && currentOperand.startsWith('-'))) {
      setCurrentOperand('0');
      setDisplayValue('0');
      setShouldOverwriteDisplay(true);
    } else {
      const newOperand = currentOperand.slice(0, -1);
      setCurrentOperand(newOperand);
      setDisplayValue(newOperand);
    }
  };

  const applyUnaryFunction = (func: (num: number) => number | string, operandSource?: string) => {
    resetErrorState();
    const source = operandSource || currentOperand;
    if (source !== null && source !== 'Error') {
      const num = parseFloat(source);
      if (!isNaN(num)) {
        const resultValue = func(num);
        const resultString = typeof resultValue === 'string' ? resultValue : formatResultDisplay(resultValue);
        setDisplayValue(resultString);
        setCurrentOperand(resultString);
        setShouldOverwriteDisplay(true);
        if (resultString === 'Error') setIsErrorState(true);
      }
    }
  };

  const handleSquare = () => applyUnaryFunction(num => Math.pow(num, 2));
  const handleSquareRoot = () => applyUnaryFunction(num => {
      if (num < 0) { Alert.alert("Error", "Invalid input for square root"); return 'Error'; }
      return Math.sqrt(num);
  });
  const handleReciprocal = () => applyUnaryFunction(num => {
      if (num === 0) { Alert.alert("Error", "Cannot divide by zero"); return 'Error'; }
      return 1 / num;
  });
  const handleFactorial = () => applyUnaryFunction(num => {
    if (num < 0 || !Number.isInteger(num)) { Alert.alert("Error", "Factorial is for non-negative integers"); return 'Error'; }
    if (num === 0 || num === 1) return 1;
    if (num > 20) { Alert.alert("Error", "Input too large for factorial"); return 'Error'; } // Prevent overflow
    let result = 1;
    for (let i = 2; i <= num; i++) result *= i;
    return result;
  });

  const handleTrigonometric = (funcType: 'sin' | 'cos' | 'tan') => {
    resetErrorState();
    if (currentOperand !== null && currentOperand !== 'Error') {
      let num = parseFloat(currentOperand);
      if (!isNaN(num)) {
        const angle = angleMode === 'DEG' ? toRadians(num) : num;
        let resultValue: number;
        switch (funcType) {
          case 'sin': resultValue = Math.sin(angle); break;
          case 'cos': resultValue = Math.cos(angle); break;
          case 'tan':
            const cosAngle = Math.cos(angle);
            if (Math.abs(cosAngle) < 1e-12) { Alert.alert("Error", "Invalid input for tan (e.g. 90deg)"); setIsErrorState(true); setDisplayValue('Error'); setCurrentOperand('Error'); setShouldOverwriteDisplay(true); return; }
            resultValue = Math.tan(angle); break;
          default: return;
        }
        const result = formatResultDisplay(resultValue);
        setDisplayValue(result); setCurrentOperand(result); setShouldOverwriteDisplay(true);
      }
    }
  };

  const handleLogarithm = (funcType: 'ln' | 'log10' | 'exp' | '10x') => {
    resetErrorState();
    if (currentOperand !== null && currentOperand !== 'Error') {
      const num = parseFloat(currentOperand);
      if (!isNaN(num)) {
        let resultValue: number;
        if (funcType === 'ln' || funcType === 'log10') {
          if (num <= 0) { Alert.alert("Error", "Invalid input for logarithm"); setIsErrorState(true); setDisplayValue('Error'); setCurrentOperand('Error'); setShouldOverwriteDisplay(true); return; }
          resultValue = funcType === 'ln' ? Math.log(num) : Math.log10(num);
        } else {
          resultValue = funcType === 'exp' ? Math.exp(num) : Math.pow(10, num);
        }
        const result = formatResultDisplay(resultValue);
        setDisplayValue(result); setCurrentOperand(result); setShouldOverwriteDisplay(true);
      }
    }
  };

  const insertConstant = (constantName: 'PI' | 'E') => {
    resetErrorState();
    const value = constantName === 'PI' ? Math.PI : Math.E;
    const constStr = formatResultDisplay(value);
    setCurrentOperand(constStr);
    setDisplayValue(constStr);
    setShouldOverwriteDisplay(false);
  };
  
  const handleMemoryClear = () => setMemoryValue(0);
  const handleMemoryRecall = () => {
    resetErrorState();
    const memStr = formatResultDisplay(memoryValue);
    setCurrentOperand(memStr); setDisplayValue(memStr); setShouldOverwriteDisplay(false);
  };
  const handleMemoryAdd = () => {
    if (isErrorState) return;
    const currentVal = parseFloat(displayValue);
    if(!isNaN(currentVal)) setMemoryValue(prevMem => prevMem + currentVal);
  };
  const handleMemorySubtract = () => {
    if (isErrorState) return;
    const currentVal = parseFloat(displayValue);
    if(!isNaN(currentVal)) setMemoryValue(prevMem => prevMem - currentVal);
  };
  const handleMemoryStore = () => {
    if (isErrorState) return;
    const currentVal = parseFloat(displayValue);
    if(!isNaN(currentVal)) setMemoryValue(currentVal);
  };

  const handleParenthesis = (p: '(' | ')') => {
    resetErrorState();
    inputDigit(p);
  };
  
  const renderButton = (label: string, onPress: () => void, style?: any | any[], textStyle?: any | any[]) => (
    <TouchableOpacity style={[styles.button, ...(Array.isArray(style) ? style : [style])]} onPress={onPress}>
      <Text style={[styles.buttonText, ...(Array.isArray(textStyle) ? textStyle : [textStyle]) ]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Calculator' }} />
      <View style={styles.displayContainer}>
        <Text style={styles.angleModeText}>{angleMode} M:{formatResultDisplay(memoryValue)}</Text>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {displayValue}
        </Text>
      </View>
      <View style={styles.buttonGrid}>
        <View style={styles.buttonRow}>
          {renderButton('MC', handleMemoryClear, styles.memoryButton)}
          {renderButton('MR', handleMemoryRecall, styles.memoryButton)}
          {renderButton('M+', handleMemoryAdd, styles.memoryButton)}
          {renderButton('M-', handleMemorySubtract, styles.memoryButton)}
          {renderButton('MS', handleMemoryStore, styles.memoryButton)}
        </View>
        <View style={styles.buttonRow}>
          {renderButton(angleMode === 'RAD' ? 'DEG' : 'RAD', () => setAngleMode(prev => prev === 'RAD' ? 'DEG' : 'RAD'), styles.sciButton)}
          {renderButton('sin', () => handleTrigonometric('sin'), styles.sciButton)}
          {renderButton('cos', () => handleTrigonometric('cos'), styles.sciButton)}
          {renderButton('tan', () => handleTrigonometric('tan'), styles.sciButton)}
          {renderButton('eˣ', () => handleLogarithm('exp'), styles.sciButton)}
        </View>
        <View style={styles.buttonRow}>
          {renderButton('xʸ', () => handleOperation('^'), styles.sciButton)}
          {renderButton('ln', () => handleLogarithm('ln'), styles.sciButton)}
          {renderButton('log', () => handleLogarithm('log10'), styles.sciButton)}
          {renderButton('10ˣ', () => handleLogarithm('10x'), styles.sciButton)}
          {renderButton('x!', handleFactorial, styles.sciButton)}
        </View>
        <View style={styles.buttonRow}>
          {renderButton('AC', clearAll, styles.utilityButtonLg, styles.darkText)}
          {renderButton('←', handleBackspace, styles.utilityButtonLg, styles.darkText)}
          {renderButton('π', () => insertConstant('PI'), styles.utilityButtonLg, styles.darkText)}
          {renderButton('/', () => handleOperation('/'), styles.operatorButton)}
        </View>
        <View style={styles.buttonRow}>
          {renderButton('x²', handleSquare, styles.numberButton, styles.darkText)}
          {renderButton('√', handleSquareRoot, styles.numberButton, styles.darkText)}
          {renderButton('e', () => insertConstant('E'), styles.numberButton, styles.darkText)}
          {renderButton('*', () => handleOperation('*'), styles.operatorButton)}
        </View>
        <View style={styles.buttonRow}>
          {renderButton('7', () => inputDigit('7'), styles.numberButton, styles.darkText)}
          {renderButton('8', () => inputDigit('8'), styles.numberButton, styles.darkText)}
          {renderButton('9', () => inputDigit('9'), styles.numberButton, styles.darkText)}
          {renderButton('-', () => handleOperation('-'), styles.operatorButton)}
        </View>
        <View style={styles.buttonRow}>
          {renderButton('4', () => inputDigit('4'), styles.numberButton, styles.darkText)}
          {renderButton('5', () => inputDigit('5'), styles.numberButton, styles.darkText)}
          {renderButton('6', () => inputDigit('6'), styles.numberButton, styles.darkText)}
          {renderButton('+', () => handleOperation('+'), styles.operatorButton)}
        </View>
        <View style={styles.buttonRow}>
          {renderButton('1', () => inputDigit('1'), styles.numberButton, styles.darkText)}
          {renderButton('2', () => inputDigit('2'), styles.numberButton, styles.darkText)}
          {renderButton('3', () => inputDigit('3'), styles.numberButton, styles.darkText)}
          {renderButton('=', handleEquals, styles.equalsButton)}
        </View>
        <View style={styles.buttonRow}>
          {renderButton('(', () => handleParenthesis('('), styles.numberButton, styles.darkText)}
          {renderButton('0', () => inputDigit('0'), styles.numberButton, styles.darkText)}
          {renderButton(')', () => handleParenthesis(')'), styles.numberButton, styles.darkText)}
          {renderButton('.', () => inputDigit('.'), styles.numberButton, styles.darkText)}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  displayContainer: {
    flex: 1.8,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  angleModeText: {
    fontSize: 14,
    color: '#757575',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  displayText: {
    fontSize: 50,
    color: '#333333',
    fontWeight: '300',
  },
  buttonGrid: {
    flex: 4,
  },
  buttonRow: {
    flex: 1,
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  buttonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  darkText: {
    color: '#333333',
    fontSize: 20,
  },
  numberButton: {
    backgroundColor: '#FFFFFF',
  },
  utilityButton: {
    backgroundColor: '#E0E0E0',
  },
  utilityButtonLg: {
    backgroundColor: '#D6D7D9',
  },
  sciButton: {
    backgroundColor: '#CFD8DC',
  },
  operatorButton: {
    backgroundColor: '#B0BEC5',
  },
  equalsButton: {
    backgroundColor: '#4285F4',
  },
  memoryButton: {
    backgroundColor: '#90A4AE',
  },
});
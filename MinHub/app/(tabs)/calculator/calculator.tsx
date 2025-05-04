import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function CalculatorScreen() {
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [result, setResult] = useState<null | number | string>(null);

  const handleSum = () => {
    const a = parseFloat(num1);
    const b = parseFloat(num2);
    if (!isNaN(a) && !isNaN(b)) {
      setResult(a + b);
    } else {
      setResult('Valori non validi');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calcolatrice</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Numero 1"
        value={num1}
        onChangeText={setNum1}
      />
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Numero 2"
        value={num2}
        onChangeText={setNum2}
      />
      <Button title="Somma" onPress={handleSum} />
      {result !== null && <Text style={styles.result}>Risultato: {result}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    fontSize: 18,
  },
  result: {
    fontSize: 24,
    marginTop: 20,
    textAlign: 'center',
  },
});

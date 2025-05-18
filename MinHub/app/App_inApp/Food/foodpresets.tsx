import AsyncStorage from '@react-native-async-storage/async-storage';

export type FoodPreset = {
 name: string;
 carbs: number;
 protein: number;
 fat: number;
 calories: number;
};

const STORAGE_KEY = 'food_presets';

export const getDefaultPresets = (): FoodPreset[] => [
 {
  name: 'Grilled Chicken Salad',
  carbs: 10,
  protein: 30,
  fat: 5,
  calories: 250,
 },
];

export const loadPresets = async (): Promise<FoodPreset[]> => {
 try {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : getDefaultPresets();
 } catch (e) {
  console.error('Failed to load presets', e);
  return getDefaultPresets();
 }
};

export const savePresets = async (presets: FoodPreset[]) => {
 try {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
 } catch (e) {
  console.error('Failed to save presets', e);
 }
};
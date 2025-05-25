import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, Theme } from '../styles/themes';

interface ThemeContextData {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemTheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('minhub_theme_preference');
      if (savedTheme) {
        setThemePreference(savedTheme as 'light' | 'dark' | 'system');
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (preference: 'light' | 'dark' | 'system') => {
    setThemePreference(preference);
    await AsyncStorage.setItem('minhub_theme_preference', preference);
  };

  const isDark = themePreference === 'system' ? systemTheme === 'dark' : themePreference === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
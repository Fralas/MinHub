import { Theme } from '../styles/themes';

interface ThemeContextData {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}
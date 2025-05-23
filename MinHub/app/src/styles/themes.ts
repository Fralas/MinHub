export interface Theme {
  background: string;
  card: string;
  text: string;
  subtleText: string;
  primary: string;
  border: string;
  danger: string;
}

export const lightTheme: Theme = {
  background: '#f0f4f8',
  card: '#ffffff',
  text: '#1c1c1e',
  subtleText: '#6e7a8a',
  primary: '#00796b',
  border: '#dce1e6',
  danger: '#e74c3c',
};

export const darkTheme: Theme = {
  background: '#000000',
  card: '#1c1c1e',
  text: '#f2f2f7',
  subtleText: '#8e8e93',
  primary: '#009688',
  border: '#2c2c2e',
  danger: '#ff453a',
};
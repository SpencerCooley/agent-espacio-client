'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeOptions } from '@mui/material/styles';
import { hackerBuzzTheme, hackerBuzzDarkTheme } from '../themes';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  themeOptions: ThemeOptions;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const themeOptions = mode === 'light' ? hackerBuzzTheme : hackerBuzzDarkTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, themeOptions }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used within ThemeProvider');
  return context;
};

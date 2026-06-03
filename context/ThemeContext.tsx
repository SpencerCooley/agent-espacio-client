'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeOptions } from '@mui/material/styles';
import {
  hackerBuzzTheme, hackerBuzzDarkTheme,
  midnightGlowTheme, midnightGlowDarkTheme,
  playfulCandyTheme, playfulCandyDarkTheme,
  luxeartTheme, luxeartDarkTheme,
  retroGamifyTheme, retroGamifyDarkTheme,
  scientificAcademiaTheme, scientificAcademiaDarkTheme,
  mintCreamTheme, mintCreamDarkTheme,
} from '../themes';

type ThemeMode = 'light' | 'dark';
type ThemeName = 'hackerBuzz' | 'midnightGlow' | 'playfulCandy' | 'luxeart' | 'retroGamify' | 'scientificAcademia' | 'mintCream';

const themeMap: Record<ThemeName, { light: ThemeOptions; dark: ThemeOptions }> = {
  hackerBuzz: { light: hackerBuzzTheme, dark: hackerBuzzDarkTheme },
  midnightGlow: { light: midnightGlowTheme, dark: midnightGlowDarkTheme },
  playfulCandy: { light: playfulCandyTheme, dark: playfulCandyDarkTheme },
  luxeart: { light: luxeartTheme, dark: luxeartDarkTheme },
  retroGamify: { light: retroGamifyTheme, dark: retroGamifyDarkTheme },
  scientificAcademia: { light: scientificAcademiaTheme, dark: scientificAcademiaDarkTheme },
  mintCream: { light: mintCreamTheme, dark: mintCreamDarkTheme },
};

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themeOptions: ThemeOptions;
  availableThemes: ThemeName[];
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('hackerBuzz');

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
    const savedTheme = localStorage.getItem('themeName') as ThemeName | null;
    if (savedMode) {
      setMode(savedMode);
    }
    if (savedTheme && themeMap[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
    localStorage.setItem('themeName', theme);
  };

  const themeOptions = themeMap[currentTheme][mode];
  const availableThemes: ThemeName[] = Object.keys(themeMap) as ThemeName[];

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, currentTheme, setTheme, themeOptions, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used within ThemeProvider');
  return context;
};

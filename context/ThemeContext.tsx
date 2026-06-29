'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeOptions, createTheme } from '@mui/material/styles';
import { themeService, ThemeDefinition } from '../services/themes';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  currentThemeId: string;
  setThemeId: (themeId: string) => void;
  theme: ReturnType<typeof createTheme>;
  themeOptions: ThemeOptions;
  availableThemes: { id: string; name: string }[];
  loading: boolean;
}

// Minimal default theme to avoid flash while loading
const defaultThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: { primary: '#ffffff', secondary: '#b0b0b0' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [currentThemeId, setCurrentThemeId] = useState<string>('');
  const [themeDef, setThemeDef] = useState<ThemeDefinition | null>(null);
  const [availableThemes, setAvailableThemes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Migrate old localStorage key from themeName -> themeId
    const oldName = localStorage.getItem('themeName');
    if (oldName) {
      localStorage.setItem('themeId', oldName);
      localStorage.removeItem('themeName');
    }

    const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
    const savedThemeId = localStorage.getItem('themeId') || '';

    if (savedMode) {
      setMode(savedMode);
    }
    if (savedThemeId) {
      setCurrentThemeId(savedThemeId);
    }

    // Load available themes list
    themeService.getThemes()
      .then((res) => {
        setAvailableThemes(res.themes ?? []);
        // If no saved theme, default to first available
        if (!savedThemeId && res.themes && res.themes.length > 0) {
          const first = res.themes[0];
          setCurrentThemeId(first.id);
          localStorage.setItem('themeId', first.id);
        }
      })
      .catch(() => {
        // Ignore
      });

    // Load theme definition
    const idToLoad = savedThemeId || '';
    if (idToLoad) {
      themeService.getTheme(idToLoad)
        .then((def) => {
          setThemeDef(def);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
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

  const setThemeId = (themeId: string) => {
    setCurrentThemeId(themeId);
    localStorage.setItem('themeId', themeId);
    setLoading(true);
    themeService.getTheme(themeId)
      .then((def) => {
        setThemeDef(def);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const themeOptions = themeDef
    ? (mode === 'light' ? themeDef.light_definition : themeDef.dark_definition)
    : defaultThemeOptions;

  const theme = createTheme(themeOptions as ThemeOptions);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, currentThemeId, setThemeId, theme, themeOptions, availableThemes, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used within ThemeProvider');
  return context;
};

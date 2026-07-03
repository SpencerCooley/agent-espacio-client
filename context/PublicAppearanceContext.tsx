'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { Branding, settingsService } from '../services/settings';
import { themeService, ThemeDefinition } from '../services/themes';

interface PublicAppearanceContextType {
  // Branding
  branding: Branding;
  brandingLoading: boolean;
  updateBranding: (updates: Partial<Branding>) => Promise<void>;
  refreshBranding: () => Promise<void>;

  // Theme
  themeId: string;
  themeMode: 'light' | 'dark';
  themeDefinition: ThemeDefinition | null;
  themeLoading: boolean;
  updatePublicTheme: (themeId: string, mode: 'light' | 'dark') => Promise<void>;
  refreshTheme: () => Promise<void>;

  // Combined
  refreshAppearance: () => Promise<void>;

  // MUI theme (created from definition + mode)
  muiTheme: ReturnType<typeof createTheme>;
}

const defaultBranding: Branding = {
  logo_light_asset_id: null,
  logo_dark_asset_id: null,
  background_asset_id: null,
  background_style: 'cover',
  logo_light_url: null,
  logo_dark_url: null,
  background_url: null,
};

const defaultThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
    text: { primary: '#212121', secondary: '#757575' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
};

const PublicAppearanceContext = createContext<PublicAppearanceContextType | undefined>(undefined);

export function PublicAppearanceProvider({ children }: { children: ReactNode }) {
  // Branding state
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [brandingLoading, setBrandingLoading] = useState(true);

  // Theme state
  const [themeId, setThemeId] = useState('');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [themeDefinition, setThemeDefinition] = useState<ThemeDefinition | null>(null);
  const [themeLoading, setThemeLoading] = useState(true);

  // Load branding
  const refreshBranding = useCallback(async () => {
    try {
      const res = await settingsService.getBranding();
      setBranding(res);
    } catch (err) {
      console.error('Failed to load branding', err);
    } finally {
      setBrandingLoading(false);
    }
  }, []);

  // Load theme preference and definition
  const refreshTheme = useCallback(async () => {
    setThemeLoading(true);
    try {
      const pref = await settingsService.getPublicTheme();
      const id = pref.theme_id || '';
      const mode = pref.mode === 'dark' ? 'dark' : 'light';
      setThemeId(id);
      setThemeMode(mode);

      if (id) {
        try {
          const def = await themeService.getTheme(id);
          setThemeDefinition(def);
        } catch (err) {
          console.error('Failed to load theme definition', err);
          setThemeDefinition(null);
        }
      } else {
        setThemeDefinition(null);
      }
    } catch (err) {
      console.error('Failed to load public theme', err);
    } finally {
      setThemeLoading(false);
    }
  }, []);

  // Combined refresh
  const refreshAppearance = useCallback(async () => {
    await Promise.all([refreshBranding(), refreshTheme()]);
  }, [refreshBranding, refreshTheme]);

  // Initial load
  useEffect(() => {
    refreshAppearance();
  }, [refreshAppearance]);

  // Update branding
  const updateBranding = useCallback(async (updates: Partial<Branding>) => {
    const newBranding = { ...branding, ...updates };
    try {
      await settingsService.updateBranding(newBranding);
      // Refetch to get enriched branding with signed URLs
      const refreshed = await settingsService.getBranding();
      setBranding(refreshed);
    } catch (err) {
      console.error('Failed to update branding', err);
      throw err;
    }
  }, [branding]);

  // Update public theme
  const updatePublicTheme = useCallback(async (newId: string, newMode: 'light' | 'dark') => {
    try {
      await settingsService.updatePublicTheme(newId, newMode);
      setThemeId(newId);
      setThemeMode(newMode);

      if (newId) {
        try {
          const def = await themeService.getTheme(newId);
          setThemeDefinition(def);
        } catch (err) {
          console.error('Failed to load new theme definition', err);
          setThemeDefinition(null);
        }
      } else {
        setThemeDefinition(null);
      }
    } catch (err) {
      console.error('Failed to update public theme', err);
      throw err;
    }
  }, []);

  // Create MUI theme from definition
  const muiTheme = useMemo(() => {
    if (themeDefinition) {
      const def = themeMode === 'light'
        ? themeDefinition.light_definition
        : themeDefinition.dark_definition;
      return createTheme(def as ThemeOptions);
    }
    return createTheme(defaultThemeOptions);
  }, [themeDefinition, themeMode]);

  return (
    <PublicAppearanceContext.Provider
      value={{
        branding,
        brandingLoading,
        updateBranding,
        refreshBranding,
        themeId,
        themeMode,
        themeDefinition,
        themeLoading,
        updatePublicTheme,
        refreshTheme,
        refreshAppearance,
        muiTheme,
      }}
    >
      {children}
    </PublicAppearanceContext.Provider>
  );
}

export function usePublicAppearance() {
  const context = useContext(PublicAppearanceContext);
  if (!context) {
    throw new Error('usePublicAppearance must be used within a PublicAppearanceProvider');
  }
  return context;
}

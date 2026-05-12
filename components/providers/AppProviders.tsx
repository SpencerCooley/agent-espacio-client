'use client';

import { ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, useThemeContext } from '../../context/ThemeContext';
import { AppProvider } from '../../context/AppContext';
import EmotionRegistry from './EmotionRegistry';

function ThemedMUIProvider({ children }: { children: ReactNode }) {
  const { themeOptions } = useThemeContext();
  const theme = createTheme(themeOptions);

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <EmotionRegistry>
      <ThemeProvider>
        <ThemedMUIProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </ThemedMUIProvider>
      </ThemeProvider>
    </EmotionRegistry>
  );
}

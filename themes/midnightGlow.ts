import { ThemeOptions } from '@mui/material/styles';

export const midnightGlowTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#1a1a1a',
      light: '#4a4a4a',
      dark: '#000000',
    },
    secondary: {
      main: '#6366f1',
      light: '#8b5cf6',
      dark: '#4338ca',
    },
    background: {
      default: '#e5e7eb',
      paper: '#f9fafb',
    },
    text: {
      primary: '#111827',
      secondary: '#374151',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#111827',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#111827',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
};

export const midnightGlowDarkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa',
      light: '#93c5fd',
      dark: '#3b82f6',
    },
    secondary: {
      main: '#c084fc',
      light: '#d8b4fe',
      dark: '#a855f7',
    },
    background: {
      default: '#0a0a0a',
      paper: '#171717',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#f8fafc',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: '0 0 15px rgba(96, 165, 250, 0.3)',
          '&:hover': {
            boxShadow: '0 0 25px rgba(96, 165, 250, 0.5)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(96, 165, 250, 0.1)',
          border: '1px solid rgba(96, 165, 250, 0.2)',
        },
      },
    },
  },
};

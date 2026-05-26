import { ThemeOptions } from '@mui/material/styles';

export const playfulCandyTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#ff6b9d',
      light: '#ffb3d1',
      dark: '#e91e63',
    },
    secondary: {
      main: '#4fc3f7',
      light: '#81d4fa',
      dark: '#29b6f6',
    },
    background: {
      default: '#fef7ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#2d3748',
      secondary: '#4a5568',
    },
    success: {
      main: '#68d391',
    },
    warning: {
      main: '#fbd38d',
    },
    error: {
      main: '#fc8181',
    },
  },
  typography: {
    fontFamily: '"Comic Neue", "Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.75rem',
      fontWeight: 700,
      color: '#2d3748',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 600,
      color: '#2d3748',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      color: '#4a5568',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1.1rem',
      lineHeight: 1.6,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(255, 107, 157, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(255, 107, 157, 0.4)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.1s ease-in-out',
        },
        contained: {
          background: 'linear-gradient(135deg, #ff6b9d 0%, #4fc3f7 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #e91e63 0%, #29b6f6 100%)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(255, 107, 157, 0.15)',
          border: '2px solid rgba(255, 107, 157, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(255, 107, 157, 0.25)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
        },
      },
    },
  },
};

export const playfulCandyDarkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff8cc8',
      light: '#ffb3d9',
      dark: '#ff6bb7',
    },
    secondary: {
      main: '#64b5f6',
      light: '#90caf9',
      dark: '#42a5f5',
    },
    background: {
      default: '#1a0d1f',
      paper: '#2d1b2e',
    },
    text: {
      primary: '#f7fafc',
      secondary: '#e2e8f0',
    },
    success: {
      main: '#81c784',
    },
    warning: {
      main: '#ffb74d',
    },
    error: {
      main: '#e57373',
    },
  },
  typography: {
    fontFamily: '"Comic Neue", "Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.75rem',
      fontWeight: 700,
      color: '#f7fafc',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 600,
      color: '#f7fafc',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      color: '#e2e8f0',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1.1rem',
      lineHeight: 1.6,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: '0 4px 20px rgba(255, 140, 200, 0.4)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(255, 140, 200, 0.6)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          background: 'linear-gradient(135deg, #ff8cc8 0%, #64b5f6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #ff6bb7 0%, #42a5f5 100%)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 140, 200, 0.2)',
          border: '2px solid rgba(255, 140, 200, 0.3)',
          background: 'linear-gradient(145deg, #2d1b2e 0%, #3d2a3e 100%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(255, 140, 200, 0.4), 0 0 30px rgba(100, 181, 246, 0.2)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
        },
      },
    },
  },
};

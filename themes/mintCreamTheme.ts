import { ThemeOptions } from '@mui/material/styles';

export const mintCreamTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ce93d8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#fef7ed',
      paper: '#fff9f0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
};

export const mintCreamDarkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#69f0ae',
      light: '#a7ffeb',
      dark: '#00e676',
    },
    secondary: {
      main: '#ce93d8',
      light: '#f3e5f5',
      dark: '#9c27b0',
    },
    background: {
      default: '#2d2d2d',
      paper: '#3a3a3a',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
};

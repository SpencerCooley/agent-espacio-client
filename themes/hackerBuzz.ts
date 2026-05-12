import { ThemeOptions } from '@mui/material/styles';

export const hackerBuzzTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#2d3748',
      light: '#4a5568',
      dark: '#1a202c',
    },
    secondary: {
      main: '#38a169',
      light: '#68d391',
      dark: '#2f855a',
    },
    background: {
      default: '#f7fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
    },
    error: {
      main: '#e53e3e',
    },
    warning: {
      main: '#d69e2e',
    },
    success: {
      main: '#38a169',
    },
    info: {
      main: '#3182ce',
    },
  },
  typography: {
    fontFamily: '"JetBrains Mono", "Fira Code", "Source Code Pro", "Consolas", monospace',
    h1: {
      fontSize: '2.25rem',
      fontWeight: 600,
      color: '#1a202c',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      color: '#1a202c',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#2d3748',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '0.875rem',
      fontFamily: '"JetBrains Mono", monospace',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      fontFamily: '"JetBrains Mono", monospace',
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          border: '1px solid transparent',
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
          },
        },
        outlined: {
          borderColor: '#e2e8f0',
          '&:hover': {
            borderColor: '#38a169',
            backgroundColor: 'rgba(56, 161, 105, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.875rem',
            '& fieldset': {
              borderColor: '#e2e8f0',
            },
            '&:hover fieldset': {
              borderColor: '#cbd5e0',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#38a169',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
          fontSize: '0.8125rem',
          fontFamily: '"JetBrains Mono", monospace',
        },
      },
    },
  },
};

export const hackerBuzzDarkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#68d391',
      light: '#9ae6b4',
      dark: '#38a169',
    },
    secondary: {
      main: '#63b3ed',
      light: '#90cdf4',
      dark: '#4299e1',
    },
    background: {
      default: '#0d1117',
      paper: '#161b22',
    },
    text: {
      primary: '#f0f6fc',
      secondary: '#8b949e',
    },
    error: {
      main: '#f85149',
    },
    warning: {
      main: '#d29922',
    },
    success: {
      main: '#3fb950',
    },
    info: {
      main: '#58a6ff',
    },
  },
  typography: {
    fontFamily: '"JetBrains Mono", "Fira Code", "Source Code Pro", "Consolas", monospace',
    h1: {
      fontSize: '2.25rem',
      fontWeight: 600,
      color: '#f0f6fc',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      color: '#f0f6fc',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#e6edf3',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '0.875rem',
      fontFamily: '"JetBrains Mono", monospace',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      fontFamily: '"JetBrains Mono", monospace',
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          border: '1px solid transparent',
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 0 8px rgba(104, 211, 145, 0.4)',
          },
        },
        outlined: {
          borderColor: '#30363d',
          '&:hover': {
            borderColor: '#68d391',
            backgroundColor: 'rgba(104, 211, 145, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0 0 0 1px rgba(240, 246, 252, 0.1)',
          border: '1px solid #30363d',
          backgroundColor: '#161b22',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          transition: 'all 0.2s ease-in-out',
          backgroundColor: '#161b22',
          '&:hover': {
            boxShadow: '0 0 0 1px rgba(104, 211, 145, 0.3), 0 4px 8px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.875rem',
            backgroundColor: '#0d1117',
            '& fieldset': {
              borderColor: '#30363d',
            },
            '&:hover fieldset': {
              borderColor: '#484f58',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#68d391',
              boxShadow: '0 0 0 2px rgba(104, 211, 145, 0.2)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
          fontSize: '0.8125rem',
          fontFamily: '"JetBrains Mono", monospace',
          backgroundColor: '#21262d',
          color: '#8b949e',
          '&:hover': {
            backgroundColor: '#30363d',
          },
        },
      },
    },
  },
};

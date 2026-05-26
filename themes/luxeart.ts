import { ThemeOptions } from '@mui/material/styles';

export const luxeartTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#1c1c1e',
      light: '#48484a',
      dark: '#000000',
    },
    secondary: {
      main: '#c9a96e',
      light: '#e6c893',
      dark: '#a08649',
    },
    background: {
      default: '#c2bcabff',
      paper: '#ffffff',
    },
    text: {
      primary: '#1c1c1e',
      secondary: '#636366',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#c9a96e',
    },
    success: {
      main: '#2e7d32',
    },
    info: {
      main: '#8e8e93',
    },
  },
  typography: {
    fontFamily: '"Playfair Display", "Times New Roman", "serif"',
    h1: {
      fontSize: '3rem',
      fontWeight: 300,
      color: '#1c1c1e',
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 300,
      color: '#1c1c1e',
      letterSpacing: '-0.015em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 400,
      color: '#1c1c1e',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.375rem',
      fontWeight: 400,
      color: '#636366',
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 500,
      fontSize: '0.75rem',
      letterSpacing: '0.08em',
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.8,
      color: '#1c1c1e',
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.7,
      color: '#636366',
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          padding: '16px 32px',
          fontSize: '0.75rem',
          fontWeight: 500,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: 'none',
          backgroundColor: '#1c1c1e',
          '&:hover': {
            backgroundColor: '#000000',
            boxShadow: '0 8px 24px rgba(28, 28, 30, 0.15)',
          },
        },
        outlined: {
          borderColor: '#d1d1d6',
          borderWidth: '1px',
          '&:hover': {
            borderColor: '#c9a96e',
            backgroundColor: 'rgba(201, 169, 110, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 32px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(209, 209, 214, 0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
            '& fieldset': {
              borderColor: 'rgba(209, 209, 214, 0.5)',
            },
            '&:hover fieldset': {
              borderColor: '#c9a96e',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#c9a96e',
              borderWidth: '1px',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 500,
          fontSize: '0.75rem',
          fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
  },
};

export const luxeartDarkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#e6c893',
      light: '#f4deb3',
      dark: '#c9a96e',
    },
    secondary: {
      main: '#8e8e93',
      light: '#aeaeb2',
      dark: '#636366',
    },
    background: {
      default: '#0a0a0a',
      paper: 'rgba(28, 28, 30, 0.8)',
    },
    text: {
      primary: '#f2f2f7',
      secondary: '#aeaeb2',
    },
    error: {
      main: '#ff6b6b',
    },
    warning: {
      main: '#e6c893',
    },
    success: {
      main: '#51cf66',
    },
    info: {
      main: '#8e8e93',
    },
  },
  typography: {
    fontFamily: '"Playfair Display", "Times New Roman", "serif"',
    h1: {
      fontSize: '3rem',
      fontWeight: 300,
      color: '#f2f2f7',
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 300,
      color: '#f2f2f7',
      letterSpacing: '-0.015em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 400,
      color: '#e6c893',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.375rem',
      fontWeight: 400,
      color: '#aeaeb2',
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 500,
      fontSize: '0.75rem',
      letterSpacing: '0.08em',
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.8,
      color: '#f2f2f7',
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.7,
      color: '#aeaeb2',
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          padding: '16px 32px',
          fontSize: '0.75rem',
          fontWeight: 500,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: 'none',
          backgroundColor: '#e6c893',
          color: '#0a0a0a',
          '&:hover': {
            backgroundColor: '#f4deb3',
            boxShadow: '0 0 32px rgba(230, 200, 147, 0.3), 0 8px 24px rgba(0, 0, 0, 0.4)',
          },
        },
        outlined: {
          borderColor: 'rgba(142, 142, 147, 0.5)',
          borderWidth: '1px',
          color: '#e6c893',
          '&:hover': {
            borderColor: '#e6c893',
            backgroundColor: 'rgba(230, 200, 147, 0.08)',
            boxShadow: '0 0 16px rgba(230, 200, 147, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: 'rgba(28, 28, 30, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(230, 200, 147, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(230, 200, 147, 0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: 'rgba(28, 28, 30, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(230, 200, 147, 0.1)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            backgroundColor: 'rgba(28, 28, 30, 0.95)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8), 0 0 32px rgba(230, 200, 147, 0.15)',
            border: '1px solid rgba(230, 200, 147, 0.2)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
            backgroundColor: 'rgba(28, 28, 30, 0.6)',
            backdropFilter: 'blur(10px)',
            '& fieldset': {
              borderColor: 'rgba(142, 142, 147, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(230, 200, 147, 0.6)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#e6c893',
              borderWidth: '1px',
              boxShadow: '0 0 8px rgba(230, 200, 147, 0.3)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 500,
          fontSize: '0.75rem',
          fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          backgroundColor: 'rgba(230, 200, 147, 0.1)',
          color: '#e6c893',
          border: '1px solid rgba(230, 200, 147, 0.2)',
        },
      },
    },
  },
};

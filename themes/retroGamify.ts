import { ThemeOptions } from '@mui/material/styles';

export const retroGamifyTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#ff00ff',
      light: '#ff66ff',
      dark: '#cc00cc',
    },
    secondary: {
      main: '#00ffff',
      light: '#66ffff',
      dark: '#00cccc',
    },
    background: {
      default: '#e6ffe6',
      paper: '#ffffff',
    },
    text: {
      primary: '#000080',
      secondary: '#800080',
    },
    error: {
      main: '#ff0000',
    },
    warning: {
      main: '#ffff00',
    },
    success: {
      main: '#00ff00',
    },
    info: {
      main: '#0080ff',
    },
  },
  typography: {
    fontFamily: '"Courier New", "Monaco", "Lucida Console", monospace',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#ff00ff',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      textShadow: '3px 3px 0px #00ffff, 6px 6px 0px #ffff00',
      fontFamily: '"Courier New", monospace',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#0080ff',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      textShadow: '2px 2px 0px #ff00ff',
      fontFamily: '"Courier New", monospace',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#800080',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontFamily: '"Courier New", monospace',
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 700,
      fontSize: '0.875rem',
      letterSpacing: '0.1em',
      fontFamily: '"Courier New", monospace',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.4,
      color: '#000080',
      fontFamily: '"Courier New", monospace',
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.3,
      color: '#800080',
      fontFamily: '"Courier New", monospace',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          padding: '12px 24px',
          fontSize: '0.875rem',
          fontWeight: 700,
          border: '4px solid',
          transition: 'none',
          '&:hover': {
            transform: 'translate(-2px, -2px)',
            boxShadow: '4px 4px 0px currentColor',
          },
          '&:active': {
            transform: 'translate(0px, 0px)',
            boxShadow: '2px 2px 0px currentColor',
          },
        },
        contained: {
          backgroundColor: '#ff00ff',
          color: '#ffffff',
          borderColor: '#cc00cc',
          boxShadow: '4px 4px 0px #cc00cc',
          '&:hover': {
            backgroundColor: '#ff66ff',
            boxShadow: '6px 6px 0px #cc00cc',
          },
        },
        outlined: {
          borderColor: '#00ffff',
          color: '#00ffff',
          backgroundColor: '#ffffff',
          boxShadow: '4px 4px 0px #00cccc',
          '&:hover': {
            backgroundColor: '#e6ffff',
            boxShadow: '6px 6px 0px #00cccc',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '4px solid #ff00ff',
          boxShadow: '8px 8px 0px #00ffff',
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '4px solid #0080ff',
          boxShadow: '6px 6px 0px #ffff00',
          transition: 'transform 0.1s ease-out',
          '&:hover': {
            transform: 'translate(-2px, -2px)',
            boxShadow: '8px 8px 0px #ffff00',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            fontFamily: '"Courier New", monospace',
            fontSize: '0.875rem',
            backgroundColor: '#e6ffe6',
            '& fieldset': {
              borderColor: '#800080',
              borderWidth: '3px',
            },
            '&:hover fieldset': {
              borderColor: '#ff00ff',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00ffff',
              borderWidth: '3px',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 700,
          fontSize: '0.75rem',
          fontFamily: '"Courier New", monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          border: '2px solid',
          backgroundColor: '#ffff00',
          color: '#800080',
          borderColor: '#ff00ff',
        },
      },
    },
  },
};

export const retroGamifyDarkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ff41',
      light: '#66ff77',
      dark: '#00cc33',
    },
    secondary: {
      main: '#ff0080',
      light: '#ff66b3',
      dark: '#cc0066',
    },
    background: {
      default: '#001100',
      paper: '#002200',
    },
    text: {
      primary: '#00ff41',
      secondary: '#80ff80',
    },
    error: {
      main: '#ff3333',
    },
    warning: {
      main: '#ffff66',
    },
    success: {
      main: '#66ff66',
    },
    info: {
      main: '#6666ff',
    },
  },
  typography: {
    fontFamily: '"Courier New", "Monaco", "Lucida Console", monospace',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#00ff41',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      textShadow: '0 0 10px #00ff41, 3px 3px 0px #ff0080, 6px 6px 0px #ffff66',
      fontFamily: '"Courier New", monospace',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#ff0080',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      textShadow: '0 0 8px #ff0080, 2px 2px 0px #00ff41',
      fontFamily: '"Courier New", monospace',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#ffff66',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      textShadow: '0 0 6px #ffff66',
      fontFamily: '"Courier New", monospace',
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 700,
      fontSize: '0.875rem',
      letterSpacing: '0.1em',
      fontFamily: '"Courier New", monospace',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.4,
      color: '#00ff41',
      fontFamily: '"Courier New", monospace',
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.3,
      color: '#80ff80',
      fontFamily: '"Courier New", monospace',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          padding: '12px 24px',
          fontSize: '0.875rem',
          fontWeight: 700,
          border: '4px solid',
          transition: 'none',
          '&:hover': {
            transform: 'translate(-2px, -2px)',
            boxShadow: '4px 4px 0px currentColor, 0 0 15px currentColor',
          },
          '&:active': {
            transform: 'translate(0px, 0px)',
            boxShadow: '2px 2px 0px currentColor',
          },
        },
        contained: {
          backgroundColor: '#00ff41',
          color: '#001100',
          borderColor: '#00cc33',
          boxShadow: '4px 4px 0px #00cc33, 0 0 10px #00ff41',
          '&:hover': {
            backgroundColor: '#66ff77',
            boxShadow: '6px 6px 0px #00cc33, 0 0 20px #00ff41',
          },
        },
        outlined: {
          borderColor: '#ff0080',
          color: '#ff0080',
          backgroundColor: '#002200',
          boxShadow: '4px 4px 0px #cc0066, 0 0 8px #ff0080',
          '&:hover': {
            backgroundColor: '#330033',
            boxShadow: '6px 6px 0px #cc0066, 0 0 15px #ff0080',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '4px solid #00ff41',
          boxShadow: '8px 8px 0px #ff0080, 0 0 20px rgba(0, 255, 65, 0.3)',
          backgroundColor: '#002200',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '4px solid #ff0080',
          boxShadow: '6px 6px 0px #ffff66, 0 0 15px rgba(255, 0, 128, 0.4)',
          backgroundColor: '#002200',
          transition: 'transform 0.1s ease-out',
          '&:hover': {
            transform: 'translate(-2px, -2px)',
            boxShadow: '8px 8px 0px #ffff66, 0 0 25px rgba(255, 0, 128, 0.6)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            fontFamily: '"Courier New", monospace',
            fontSize: '0.875rem',
            backgroundColor: '#001100',
            '& fieldset': {
              borderColor: '#80ff80',
              borderWidth: '3px',
            },
            '&:hover fieldset': {
              borderColor: '#00ff41',
              boxShadow: '0 0 8px #00ff41',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ff0080',
              borderWidth: '3px',
              boxShadow: '0 0 12px #ff0080',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 700,
          fontSize: '0.75rem',
          fontFamily: '"Courier New", monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          border: '2px solid',
          backgroundColor: '#ffff66',
          color: '#001100',
          borderColor: '#ff0080',
          boxShadow: '0 0 8px rgba(255, 255, 102, 0.5)',
        },
      },
    },
  },
};

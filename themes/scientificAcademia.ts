import { ThemeOptions } from '@mui/material/styles';

export const scientificAcademiaTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#64748b',
      light: '#94a3b8',
      dark: '#475569',
    },
    background: {
      default: '#ffffff',
      paper: '#f8fafc',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    error: {
      main: '#dc2626',
    },
    warning: {
      main: '#d97706',
    },
    success: {
      main: '#059669',
    },
    info: {
      main: '#0284c7',
    },
  },
  typography: {
    fontFamily: '"Computer Modern Serif", "Times New Roman", "Times", serif',
    fontSize: 13,
    h1: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#0f172a',
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
      marginBottom: '0.5rem',
    },
    h2: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#0f172a',
      letterSpacing: '-0.005em',
      lineHeight: 1.4,
      marginBottom: '0.4rem',
    },
    h3: {
      fontSize: '1.125rem',
      fontWeight: 500,
      color: '#1e293b',
      lineHeight: 1.4,
      marginBottom: '0.3rem',
    },
    h4: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#334155',
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#475569',
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '0.8125rem',
      fontWeight: 500,
      color: '#64748b',
      lineHeight: 1.4,
    },
    button: {
      textTransform: 'none',
      fontWeight: 400,
      fontSize: '0.8125rem',
      fontFamily: '"Source Sans Pro", "Helvetica Neue", "Arial", sans-serif',
    },
    body1: {
      fontSize: '0.8125rem',
      lineHeight: 1.6,
      color: '#0f172a',
      fontFamily: '"Computer Modern Serif", "Times New Roman", serif',
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: '#475569',
      fontFamily: '"Computer Modern Serif", "Times New Roman", serif',
    },
    caption: {
      fontSize: '0.6875rem',
      lineHeight: 1.4,
      color: '#64748b',
      fontStyle: 'italic',
    },
    overline: {
      fontSize: '0.625rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#94a3b8',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          padding: '6px 12px',
          fontSize: '0.8125rem',
          fontWeight: 400,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: '#2563eb',
          '&:hover': {
            backgroundColor: '#1d4ed8',
          },
        },
        outlined: {
          borderColor: '#cbd5e1',
          color: '#475569',
          '&:hover': {
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.04)',
          },
        },
        text: {
          color: '#2563eb',
          '&:hover': {
            backgroundColor: 'rgba(37, 99, 235, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            fontSize: '0.8125rem',
            fontFamily: '"Source Sans Pro", "Helvetica Neue", "Arial", sans-serif',
            '& fieldset': {
              borderColor: '#cbd5e1',
            },
            '&:hover fieldset': {
              borderColor: '#94a3b8',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2563eb',
              borderWidth: '1px',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.8125rem',
            color: '#64748b',
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          '& .MuiTableCell-root': {
            padding: '8px 12px',
            fontSize: '0.75rem',
            borderBottom: '1px solid #e2e8f0',
            fontFamily: '"Source Sans Pro", "Helvetica Neue", "Arial", sans-serif',
          },
          '& .MuiTableCell-head': {
            fontWeight: 500,
            backgroundColor: '#f1f5f9',
            color: '#334155',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontWeight: 400,
          fontSize: '0.6875rem',
          height: '22px',
          fontFamily: '"Source Sans Pro", "Helvetica Neue", "Arial", sans-serif',
          backgroundColor: '#f1f5f9',
          color: '#475569',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#e2e8f0',
        },
      },
    },
  },
};

export const scientificAcademiaDarkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa',
      light: '#93c5fd',
      dark: '#3b82f6',
    },
    secondary: {
      main: '#94a3b8',
      light: '#cbd5e1',
      dark: '#64748b',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    success: {
      main: '#10b981',
    },
    info: {
      main: '#06b6d4',
    },
  },
  typography: {
    fontFamily: '"Computer Modern Serif", "Times New Roman", "Times", serif',
    fontSize: 13,
    h1: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#f1f5f9',
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
      marginBottom: '0.5rem',
    },
    h2: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#f1f5f9',
      letterSpacing: '-0.005em',
      lineHeight: 1.4,
      marginBottom: '0.4rem',
    },
    h3: {
      fontSize: '1.125rem',
      fontWeight: 500,
      color: '#e2e8f0',
      lineHeight: 1.4,
      marginBottom: '0.3rem',
    },
    h4: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#cbd5e1',
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#94a3b8',
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '0.8125rem',
      fontWeight: 500,
      color: '#64748b',
      lineHeight: 1.4,
    },
    button: {
      textTransform: 'none',
      fontWeight: 400,
      fontSize: '0.8125rem',
      fontFamily: '"Source Sans Pro", "Helvetica Neue", "Arial", sans-serif',
    },
    body1: {
      fontSize: '0.8125rem',
      lineHeight: 1.6,
      color: '#f1f5f9',
      fontFamily: '"Computer Modern Serif", "Times New Roman", serif',
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: '#cbd5e1',
      fontFamily: '"Computer Modern Serif", "Times New Roman", serif',
    },
    caption: {
      fontSize: '0.6875rem',
      lineHeight: 1.4,
      color: '#94a3b8',
      fontStyle: 'italic',
    },
    overline: {
      fontSize: '0.625rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#64748b',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          padding: '6px 12px',
          fontSize: '0.8125rem',
          fontWeight: 400,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: '#3b82f6',
          '&:hover': {
            backgroundColor: '#2563eb',
          },
        },
        outlined: {
          borderColor: '#475569',
          color: '#cbd5e1',
          '&:hover': {
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
          },
        },
        text: {
          color: '#60a5fa',
          '&:hover': {
            backgroundColor: 'rgba(96, 165, 250, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          boxShadow: '0 0 0 1px rgba(148, 163, 184, 0.1)',
          border: '1px solid #334155',
          backgroundColor: '#1e293b',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          boxShadow: '0 0 0 1px rgba(148, 163, 184, 0.1)',
          border: '1px solid #334155',
          backgroundColor: '#1e293b',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            fontSize: '0.8125rem',
            fontFamily: '"Source Sans Pro", "Helvetica Neue", "Arial", sans-serif',
            backgroundColor: '#0f172a',
            '& fieldset': {
              borderColor: '#475569',
            },
            '&:hover fieldset': {
              borderColor: '#64748b',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#60a5fa',
              borderWidth: '1px',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.8125rem',
            color: '#94a3b8',
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          '& .MuiTableCell-root': {
            padding: '8px 12px',
            fontSize: '0.75rem',
            borderBottom: '1px solid #334155',
            fontFamily: '"Source Sans Pro", "Helvetica Neue", "Arial", sans-serif',
          },
          '& .MuiTableCell-head': {
            fontWeight: 500,
            backgroundColor: '#334155',
            color: '#e2e8f0',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontWeight: 400,
          fontSize: '0.6875rem',
          height: '22px',
          fontFamily: '"Source Sans Pro", "Helvetica Neue", "Arial", sans-serif',
          backgroundColor: '#334155',
          color: '#cbd5e1',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#334155',
        },
      },
    },
  },
};

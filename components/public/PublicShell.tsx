'use client';

import { ReactNode } from 'react';
import { Box, AppBar, Toolbar, IconButton, Tooltip } from '@mui/material';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { Workspaces } from '@mui/icons-material';
import Link from 'next/link';
import DesignCenterPanel from './DesignCenterPanel';
import { usePublicAppearance } from '../../context/PublicAppearanceContext';
import { useApp } from '../../context/AppContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PublicShellProps {
  children: ReactNode;
  logoText?: string;
  fullBleed?: boolean;
}

export default function PublicShell({ children, logoText = 'Agent Espacio', fullBleed = false }: PublicShellProps) {
  const {
    branding,
    themeMode,
    muiTheme,
  } = usePublicAppearance();
  const { isAuthenticated } = useApp();

  const isDarkMode = themeMode === 'dark';
  const logoUrl = (isDarkMode ? branding.logo_dark_url : branding.logo_light_url)
    ? `${API_BASE_URL}${isDarkMode ? branding.logo_dark_url : branding.logo_light_url}`
    : null;
  const bgUrl = branding.background_url
    ? `${API_BASE_URL}${branding.background_url}`
    : null;

  const backgroundSx = bgUrl
    ? branding.background_style === 'tile'
      ? {
          backgroundImage: `url(${bgUrl})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
        }
      : {
          backgroundImage: `url(${bgUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
    : {};

  return (
    <MUIThemeProvider theme={muiTheme}>
      <Box
        sx={{
          ...(fullBleed
            ? { height: '100vh', overflow: 'hidden' }
            : { minHeight: '100vh' }),
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          color: 'text.primary',
          ...backgroundSx,
        }}
      >
        {/* Header */}
        <AppBar
          position={fullBleed ? 'relative' : 'sticky'}
          color="inherit"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            zIndex: (theme) => theme.zIndex.appBar,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, md: 64 } }}>
            <Link
              href="/"
              passHref
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              {logoUrl ? (
                <Box
                  component="img"
                  src={logoUrl}
                  alt={logoText}
                  sx={{
                    minHeight: 24,
                    width: 'auto',
                    maxWidth: 'none',
                    objectFit: 'contain',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease',
                    '&:hover': {
                      opacity: 0.7,
                    },
                  }}
                />
              ) : (
                <Box
                  component="span"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: 'text.primary',
                    fontSize: { xs: '1.1rem', md: '1.25rem' },
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease',
                    '&:hover': {
                      opacity: 0.7,
                    },
                  }}
                >
                  {logoText}
                </Box>
              )}
            </Link>

            {/* Control Center link — workspace is the control center */}
            {isAuthenticated && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="My Workspace">
                  <IconButton
                    component={Link}
                    href="/workspace"
                    sx={{
                      color: 'text.primary',
                      bgcolor: 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                  >
                    <Workspaces fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        {/* Scrollable Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            width: '100%',
            minWidth: 0,
            overflowX: 'hidden',
            ...(fullBleed ? { display: 'flex', flexDirection: 'column', overflow: 'hidden' } : {}),
          }}
        >
          {bgUrl && !fullBleed ? (
            <Box
              sx={{
                maxWidth: 1400,
                mx: 'auto',
                bgcolor: 'background.paper',
                minHeight: '100vh',
                px: { xs: 2, md: 4 },
                py: 2,
              }}
            >
              {children}
            </Box>
          ) : bgUrl && fullBleed ? (
            <Box
              sx={{
                width: '100%',
                bgcolor: 'background.paper',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {children}
            </Box>
          ) : (
            children
          )}
        </Box>

        {/* Design Center - only shows when authenticated */}
        <DesignCenterPanel />
      </Box>
    </MUIThemeProvider>
  );
}

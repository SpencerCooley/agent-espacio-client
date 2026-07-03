'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  Paper,
  Typography,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Brush as BrushIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import BrandingTab from './BrandingTab';
import ThemeTab from './ThemeTab';

export default function DesignCenterPanel() {
  const { isAuthenticated } = useApp();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), 350);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!isAuthenticated) return null;

  return (
    <>
      <Fab
        color="primary"
        aria-label="open design center"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: (theme) => theme.zIndex.appBar + 1,
          display: open ? 'none' : 'flex',
        }}
      >
        <BrushIcon />
      </Fab>

      {mounted && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: { xs: '100%', sm: 400 },
            zIndex: (theme) => theme.zIndex.drawer,
            transform: open ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          <Paper
            elevation={8}
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 0,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 2, flexShrink: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Design Center
                </Typography>
                <IconButton onClick={() => setOpen(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>

              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
              >
                <Tab label="Branding" />
                <Tab label="Theme" />
              </Tabs>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {activeTab === 0 && <BrandingTab />}
              {activeTab === 1 && (
                <Box sx={{ p: 2 }}>
                  <ThemeTab />
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      )}
    </>
  );
}

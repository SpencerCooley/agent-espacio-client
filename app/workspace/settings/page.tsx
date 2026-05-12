'use client';

import { useState } from 'react';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import WorkspaceLayout from '../../../components/layout/WorkspaceLayout';
import { useApp } from '../../../context/AppContext';
import { useThemeContext } from '../../../context/ThemeContext';
import {
  Typography,
  Paper,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Switch,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Person as PersonIcon,
  VpnKey as KeyIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import Link from 'next/link';

function SettingsContent() {
  const { user } = useApp();
  const { mode, toggleTheme } = useThemeContext();
  const isAdmin = user?.role === 'admin';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton 
          component={Link} 
          href="/workspace" 
          sx={{ mr: 2 }}
          title="Back to Workspace"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Settings
        </Typography>
      </Box>

      {/* User Info */}
      <Paper sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Email" 
              secondary={user?.email} 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <KeyIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Role" 
              secondary={
                <Chip 
                  label={isAdmin ? 'Administrator' : 'User'} 
                  color={isAdmin ? 'primary' : 'default'}
                  size="small"
                />
              }
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItem>
        </List>
      </Paper>

      {/* Appearance */}
      <Paper>
        <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }}>
          Appearance
        </Typography>
        <Divider />
        <List>
          <ListItem>
            <ListItemIcon>
              {mode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
            </ListItemIcon>
            <ListItemText 
              primary="Dark Mode" 
              secondary={mode === 'dark' ? 'Currently enabled' : 'Currently disabled'}
            />
            <Switch
              edge="end"
              checked={mode === 'dark'}
              onChange={toggleTheme}
            />
          </ListItem>
        </List>
      </Paper>

      {/* Admin Section */}
      {isAdmin && (
        <Paper sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }}>
            Administration
          </Typography>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton component="a" href="/admin">
                <ListItemIcon>
                  <KeyIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Go to Admin Panel" 
                  secondary="Manage users and API keys"
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Paper>
      )}
    </Box>
  );
}

export default function SettingsPage() {
  const { user } = useApp();
  const isAdmin = user?.role === 'admin';

  return (
    <ProtectedRoute>
      <WorkspaceLayout showAdminToggle={isAdmin}>
        <SettingsContent />
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}

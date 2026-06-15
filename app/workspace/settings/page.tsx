'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import WorkspaceLayout from '../../../components/layout/WorkspaceLayout';
import { useApp } from '../../../context/AppContext';
import { useThemeContext } from '../../../context/ThemeContext';
import { settingsService, PublicTheme } from '../../../services/settings';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Button,
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Person as PersonIcon,
  VpnKey as KeyIcon,
  ArrowBack as ArrowBackIcon,
  Palette as PaletteIcon,
  Computer as ComputerIcon,
  Star as StarIcon,
  Games as GamesIcon,
  School as SchoolIcon,
  LocalCafe as CafeIcon,
  Nightlight as NightlightIcon,
} from '@mui/icons-material';
import Link from 'next/link';

const themeIcons: Record<string, React.ReactNode> = {
  hackerBuzz: <ComputerIcon />,
  midnightGlow: <NightlightIcon />,
  playfulCandy: <StarIcon />,
  luxeart: <PaletteIcon />,
  retroGamify: <GamesIcon />,
  scientificAcademia: <SchoolIcon />,
  mintCream: <CafeIcon />,
};

const themeLabels: Record<string, string> = {
  hackerBuzz: 'Hacker Buzz',
  midnightGlow: 'Midnight Glow',
  playfulCandy: 'Playful Candy',
  luxeart: 'Luxe Art',
  retroGamify: 'Retro Gamify',
  scientificAcademia: 'Scientific Academia',
  mintCream: 'Mint Cream',
};

function PublicAppearanceSection() {
  const [publicTheme, setPublicTheme] = useState<PublicTheme>({ name: 'hackerBuzz', mode: 'dark' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { availableThemes } = useThemeContext();

  useEffect(() => {
    settingsService.getPublicTheme()
      .then((res) => {
        setPublicTheme(res);
      })
      .catch(() => {
        // Fallback already set
      });
  }, []);

  const handleThemeChange = (event: SelectChangeEvent<string>) => {
    const newTheme = { ...publicTheme, name: event.target.value };
    setPublicTheme(newTheme);
    saveTheme(newTheme);
  };

  const handleModeToggle = () => {
    const newTheme = { ...publicTheme, mode: publicTheme.mode === 'dark' ? 'light' : 'dark' as 'light' | 'dark' };
    setPublicTheme(newTheme);
    saveTheme(newTheme);
  };

  const saveTheme = async (theme: PublicTheme) => {
    setSaving(true);
    try {
      await settingsService.updatePublicTheme(theme.name, theme.mode);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save public theme', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }} color="text.primary">
        Public Appearance
      </Typography>
      <Typography variant="caption" sx={{ px: 2, pb: 1, display: 'block' }} color="text.secondary">
        This controls how public pages look to visitors
      </Typography>
      <Divider />
      <List>
        {/* Theme Selector */}
        <ListItem>
          <ListItemIcon>
            <PaletteIcon />
          </ListItemIcon>
          <ListItemText
            primary="Public Theme"
            secondary="Choose the visual style for public pages"
          />
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id="public-theme-select-label">Theme</InputLabel>
            <Select
              labelId="public-theme-select-label"
              id="public-theme-select"
              value={publicTheme.name}
              label="Theme"
              onChange={handleThemeChange}
            >
              {availableThemes.map((theme) => (
                <MenuItem key={theme} value={theme}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {themeIcons[theme]}
                    {themeLabels[theme]}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </ListItem>

        <Divider component="li" />

        {/* Dark Mode Toggle */}
        <ListItem>
          <ListItemIcon>
            {publicTheme.mode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
          </ListItemIcon>
          <ListItemText
            primary="Public Dark Mode"
            secondary={publicTheme.mode === 'dark' ? 'Currently enabled' : 'Currently disabled'}
          />
          <Switch
            edge="end"
            checked={publicTheme.mode === 'dark'}
            onChange={handleModeToggle}
          />
        </ListItem>

        {saved && (
          <ListItem>
            <Typography variant="caption" color="success.main" sx={{ ml: 4 }}>
              Saved!
            </Typography>
          </ListItem>
        )}
      </List>
    </Paper>
  );
}

function SettingsContent() {
  const { user } = useApp();
  const { mode, toggleTheme, currentTheme, setTheme, availableThemes } = useThemeContext();
  const isAdmin = user?.role === 'admin';

  const handleThemeChange = (event: SelectChangeEvent<string>) => {
    setTheme(event.target.value as typeof currentTheme);
  };

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
        <Typography variant="h4" color="text.primary">
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
      <Paper sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }} color="text.primary">
          Appearance
        </Typography>
        <Divider />
        <List>
          {/* Theme Selector */}
          <ListItem>
            <ListItemIcon>
              <PaletteIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Theme" 
              secondary="Choose your visual style"
            />
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel id="theme-select-label">Theme</InputLabel>
              <Select
                labelId="theme-select-label"
                id="theme-select"
                value={currentTheme}
                label="Theme"
                onChange={handleThemeChange}
              >
                {availableThemes.map((theme) => (
                  <MenuItem key={theme} value={theme}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {themeIcons[theme]}
                      {themeLabels[theme]}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </ListItem>

          <Divider component="li" />

          {/* Dark Mode Toggle */}
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

      {/* Preview Section */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }} color="text.primary">
          Theme Preview
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Primary Button
              </Typography>
              <Button variant="contained" color="primary" fullWidth>
                Primary
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Secondary Button
              </Typography>
              <Button variant="contained" color="secondary" fullWidth>
                Secondary
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Text Colors
              </Typography>
              <Typography variant="body2" color="text.primary">
                Primary Text
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Secondary Text
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Public Appearance */}
      <PublicAppearanceSection />

      {/* Admin Section */}
      {isAdmin && (
        <Paper>
          <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }} color="text.primary">
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

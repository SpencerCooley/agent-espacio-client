'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { usePublicAppearance } from '../../context/PublicAppearanceContext';
import { themeService, ThemeListItem } from '../../services/themes';

export default function ThemeTab() {
  const {
    themeId,
    themeMode,
    updatePublicTheme,
    themeLoading,
  } = usePublicAppearance();

  const [availableThemes, setAvailableThemes] = useState<ThemeListItem[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingThemes(true);
    themeService.getThemes()
      .then((res) => setAvailableThemes(res.themes || []))
      .catch((err) => {
        console.error('Failed to load themes', err);
        setError('Failed to load themes');
      })
      .finally(() => setLoadingThemes(false));
  }, []);

  const handleThemeChange = async (newId: string) => {
    setSaving(true);
    setError(null);
    try {
      await updatePublicTheme(newId, themeMode);
    } catch (err: any) {
      setError(err.message || 'Failed to update theme');
    } finally {
      setSaving(false);
    }
  };

  const handleModeToggle = async () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setSaving(true);
    setError(null);
    try {
      await updatePublicTheme(themeId, newMode);
    } catch (err: any) {
      setError(err.message || 'Failed to update theme mode');
    } finally {
      setSaving(false);
    }
  };

  if (themeLoading || loadingThemes) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaletteIcon fontSize="small" />
        Public Theme
      </Typography>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="theme-select-label">Theme</InputLabel>
        <Select
          labelId="theme-select-label"
          value={themeId}
          label="Theme"
          onChange={(e) => handleThemeChange(e.target.value)}
          onMouseDown={(e) => e.preventDefault()}
          disabled={saving}
        >
          {availableThemes.map((theme) => (
            <MenuItem key={theme.id} value={theme.id}>
              {theme.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        {themeMode === 'dark' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
        Dark Mode
      </Typography>

      <FormControlLabel
        onMouseDown={(e) => e.preventDefault()}
        control={
          <Switch
            checked={themeMode === 'dark'}
            onChange={handleModeToggle}
            disabled={saving}
          />
        }
        label={themeMode === 'dark' ? 'Enabled' : 'Disabled'}
      />

      {saving && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Saving...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

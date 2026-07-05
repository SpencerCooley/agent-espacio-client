'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
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
import { themeService, ThemeListItem, ThemeDefinition } from '../../services/themes';

/* ------------------------------------------------------------------ */
/* Palette color key definitions                                      */
/* ------------------------------------------------------------------ */

interface PaletteColor {
  key: string;
  label: string;
  tooltip: string;
  path: string[];          // path into palette object, e.g. ['primary', 'main']
  gridColumn?: string;
  gridRow?: string;
}

const PALETTE_COLORS: PaletteColor[] = [
  { key: 'primaryMain',       label: 'Primary',    tooltip: 'Buttons, links, active states',             path: ['primary', 'main'],       gridColumn: 'span 1', gridRow: 'span 2' },
  { key: 'primaryLight',      label: 'Light',      tooltip: 'Hovered primary elements',                  path: ['primary', 'light'] },
  { key: 'primaryDark',       label: 'Dark',       tooltip: 'Pressed primary elements',                  path: ['primary', 'dark'] },
  { key: 'backgroundDefault', label: 'Background', tooltip: 'Page background',                           path: ['background', 'default'], gridColumn: 'span 2' },
  { key: 'secondaryMain',     label: 'Secondary',  tooltip: 'Chips, secondary actions',                  path: ['secondary', 'main'] },
  { key: 'secondaryLight',    label: 'Light',      tooltip: 'Hovered secondary elements',                path: ['secondary', 'light'] },
  { key: 'secondaryDark',     label: 'Dark',       tooltip: 'Pressed secondary elements',                path: ['secondary', 'dark'] },
  { key: 'backgroundPaper',   label: 'Paper',      tooltip: 'Cards, panels, dialogs',                    path: ['background', 'paper'] },
  { key: 'textPrimary',       label: 'Text',       tooltip: 'Headings and body text',                    path: ['text', 'primary'] },
  { key: 'textSecondary',     label: 'Muted',      tooltip: 'Captions and metadata',                     path: ['text', 'secondary'] },
  { key: 'errorMain',         label: 'Error',      tooltip: 'Error states and destructive actions',      path: ['error', 'main'] },
  { key: 'warningMain',       label: 'Warn',       tooltip: 'Warnings and cautionary states',            path: ['warning', 'main'] },
  { key: 'successMain',       label: 'Success',    tooltip: 'Success and confirmation states',           path: ['success', 'main'] },
  { key: 'infoMain',          label: 'Info',       tooltip: 'Informational states and tips',             path: ['info', 'main'] },
  { key: 'divider',           label: 'Divider',    tooltip: 'Borders and separators',                    path: ['divider'],               gridColumn: 'span 2' },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function getNestedValue(obj: any, path: string[]): string {
  let val = obj;
  for (const key of path) {
    val = val?.[key];
  }
  return typeof val === 'string' ? val : '#888888';
}

function setNestedValue(obj: any, path: string[], value: string): any {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  return { ...obj, [head]: rest.length === 0 ? value : setNestedValue(obj?.[head] || {}, rest, value) };
}

function extractColors(def: Record<string, any>): Record<string, string> {
  const palette = def?.palette || {};
  const result: Record<string, string> = {};
  for (const c of PALETTE_COLORS) {
    result[c.key] = getNestedValue(c.path[0] === 'divider' ? palette : palette, c.path);
  }
  return result;
}

function buildUpdatedPalette(baseDef: Record<string, any>, colors: Record<string, string>): Record<string, any> {
  let palette = { ...(baseDef?.palette || {}) };
  for (const c of PALETTE_COLORS) {
    if (c.path[0] === 'divider') {
      palette = { ...palette, divider: colors[c.key] };
    } else {
      palette = setNestedValue(palette, c.path, colors[c.key]);
    }
  }
  return { ...baseDef, palette };
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ThemeTab() {
  const {
    themeId,
    themeMode,
    updatePublicTheme,
    themeLoading,
    refreshTheme,
    setDraftDefinition,
  } = usePublicAppearance();

  const [availableThemes, setAvailableThemes] = useState<ThemeListItem[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Full definition of the selected theme (for color editing)
  const [editDef, setEditDef] = useState<ThemeDefinition | null>(null);
  const [editMode, setEditMode] = useState<'light' | 'dark'>('light');
  const [colors, setColors] = useState<Record<string, string>>({});
  const [autoSaving, setAutoSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load theme list
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

  // Load full definition when themeId changes
  useEffect(() => {
    if (!themeId) {
      setEditDef(null);
      setColors({});
      return;
    }
    themeService.getTheme(themeId)
      .then((def) => {
        setEditDef(def);
        const side = editMode === 'light' ? def.light_definition : def.dark_definition;
        setColors(extractColors(side));
      })
      .catch(() => setEditDef(null));
  }, [themeId]); // intentionally only themeId — editMode handled separately

  // Re-extract colors when editMode changes
  useEffect(() => {
    if (!editDef) return;
    const side = editMode === 'light' ? editDef.light_definition : editDef.dark_definition;
    setColors(extractColors(side));
    setDraftDefinition(null);
  }, [editMode, editDef, setDraftDefinition]);

  // Sync draft definition whenever colors change (for live preview)
  useEffect(() => {
    if (!editDef || Object.keys(colors).length === 0) return;
    const side = editMode === 'light' ? editDef.light_definition : editDef.dark_definition;
    const updatedSide = buildUpdatedPalette(side, colors);
    const draft: ThemeDefinition = {
      ...editDef,
      [editMode === 'light' ? 'light_definition' : 'dark_definition']: updatedSide,
    };
    setDraftDefinition(draft);
  }, [colors]); // intentionally narrow deps — only fire when colors change

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
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

  const handleColorChange = useCallback((key: string, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));

    // Debounced auto-save
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!editDef) return;
      setAutoSaving(true);
      try {
        const side = editMode === 'light' ? editDef.light_definition : editDef.dark_definition;
        // We need the latest colors — read from the closure won't work due to stale ref.
        // Instead, build from current state by re-reading.
        setColors((currentColors) => {
          const updatedSide = buildUpdatedPalette(side, currentColors);
          const defKey = editMode === 'light' ? 'light_definition' : 'dark_definition';
          themeService.updateTheme(editDef.id, { [defKey]: updatedSide })
            .then(() => refreshTheme())
            .catch((err) => console.error('Auto-save failed', err))
            .finally(() => setAutoSaving(false));
          return currentColors; // no mutation
        });
      } catch {
        setAutoSaving(false);
      }
    }, 600);
  }, [editDef, editMode, refreshTheme]);

  if (themeLoading || loadingThemes) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Theme selector */}
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

      {/* Dark mode toggle */}
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
          <Typography variant="caption" color="text.secondary">Saving...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}

      {/* Color controls — only shown when a theme is loaded */}
      {editDef && (
        <>
          <Divider sx={{ my: 2 }} />

          {/* Light / Dark edit toggle */}
          <ToggleButtonGroup
            size="small"
            value={editMode}
            exclusive
            onChange={(_, v) => v && setEditMode(v)}
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="light">
              <LightModeIcon fontSize="small" sx={{ mr: 0.5 }} />
              Light
            </ToggleButton>
            <ToggleButton value="dark">
              <DarkModeIcon fontSize="small" sx={{ mr: 0.5 }} />
              Dark
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Palette grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gridAutoRows: '36px',
              gap: 0.75,
            }}
          >
            {PALETTE_COLORS.map((c) => (
              <Tooltip key={c.key} title={`${c.label} — ${c.tooltip}`} arrow placement="top">
                <Box
                  sx={{
                    gridColumn: c.gridColumn,
                    gridRow: c.gridRow,
                    position: 'relative',
                    bgcolor: colors[c.key] || '#888',
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    minHeight: 36,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'box-shadow 0.15s ease',
                    '&:hover': {
                      boxShadow: 2,
                    },
                  }}
                >
                  <input
                    type="color"
                    value={colors[c.key] || '#888888'}
                    onChange={(e) => handleColorChange(c.key, e.target.value)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      border: 'none',
                      padding: 0,
                      margin: 0,
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      px: 0.75,
                      py: 0.25,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
                      pointerEvents: 'none',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        lineHeight: 1.2,
                        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                      }}
                    >
                      {c.label}
                    </Typography>
                  </Box>
                </Box>
              </Tooltip>
            ))}
          </Box>

          {autoSaving && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <CircularProgress size={14} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

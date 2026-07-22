'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import WorkspaceLayout from '../../../components/layout/WorkspaceLayout';
import { useApp } from '../../../context/AppContext';
import { useThemeContext } from '../../../context/ThemeContext';
import { settingsService, PublicTheme } from '../../../services/settings';
import { repoService, SshKey } from '../../../services/repos';
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
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Person as PersonIcon,
  VpnKey as VpnKeyIcon,
  Key as KeyIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Image as ImageIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import Link from 'next/link';

function PublicAppearanceSection() {
  const [publicTheme, setPublicTheme] = useState<PublicTheme>({ theme_id: '', mode: 'dark' });
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
    const newTheme = { ...publicTheme, theme_id: event.target.value };
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
      await settingsService.updatePublicTheme(theme.theme_id, theme.mode);
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
              value={publicTheme.theme_id}
              label="Theme"
              onChange={handleThemeChange}
            >
              {availableThemes.map((theme) => (
                <MenuItem key={theme.id} value={theme.id}>
                  {theme.name}
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

function BrandingSection() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Agent Espacio';
  const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Collaborative workspace for AI agents and humans';
  const ogImage = process.env.NEXT_PUBLIC_OG_IMAGE_URL;
  const favicon = process.env.NEXT_PUBLIC_FAVICON_URL;

  return (
    <Paper sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }} color="text.primary">
        Branding
      </Typography>
      <Typography variant="caption" sx={{ px: 2, pb: 1, display: 'block' }} color="text.secondary">
        These values are set via environment variables at build time. Changes require a rebuild.
      </Typography>
      <Divider />
      <List>
        <ListItem>
          <ListItemIcon>
            <LanguageIcon />
          </ListItemIcon>
          <ListItemText
            primary="Site Name"
            secondary={siteName}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText
            primary="Site Description"
            secondary={siteDescription}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemIcon>
            <ImageIcon />
          </ListItemIcon>
          <ListItemText
            primary="Default Cover Image"
            secondary={ogImage || 'Not set'}
          />
        </ListItem>
        <Divider component="li" />
        <ListItem>
          <ListItemIcon>
            <LanguageIcon />
          </ListItemIcon>
          <ListItemText
            primary="Favicon"
            secondary={favicon || 'Not set'}
          />
        </ListItem>
      </List>
    </Paper>
  );
}

function SshKeysSection() {
  const [keys, setKeys] = useState<SshKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = useCallback(() => {
    repoService.listSshKeys()
      .then((data) => setKeys(data.keys))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleAdd = () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) return;
    setAdding(true);
    setError(null);
    repoService.addSshKey({ name: newKeyName.trim(), public_key: newKeyValue.trim() })
      .then(() => {
        setNewKeyName('');
        setNewKeyValue('');
        setDialogOpen(false);
        loadKeys();
      })
      .catch((err) => {
        setError(err.message || 'Failed to add SSH key');
      })
      .finally(() => setAdding(false));
  };

  const handleDelete = (keyId: number) => {
    repoService.deleteSshKey(keyId)
      .then(() => loadKeys())
      .catch((err) => setError(err.message || 'Failed to delete key'));
  };

  return (
    <Paper sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }} color="text.primary">
        SSH Keys
      </Typography>
      <Typography variant="caption" sx={{ px: 2, pb: 1, display: 'block' }} color="text.secondary">
        Manage SSH keys for pushing code to repositories
      </Typography>
      <Divider />
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}
      <List>
        {keys.length === 0 ? (
          <ListItem>
            <ListItemText
              primary="No SSH keys registered"
              secondary="Add a key to push code to repositories"
            />
          </ListItem>
        ) : (
          keys.map((key) => (
            <ListItem
              key={key.id}
              secondaryAction={
                <IconButton edge="end" size="small" color="error" onClick={() => handleDelete(key.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemIcon>
                <KeyIcon />
              </ListItemIcon>
              <ListItemText
                primary={key.name}
                secondary={key.fingerprint}
              />
            </ListItem>
          ))
        )}
      </List>
      <Box sx={{ px: 2, pb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<VpnKeyIcon />}
          onClick={() => { setError(null); setDialogOpen(true); }}
        >
          Add SSH Key
        </Button>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add SSH Key</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Key Name"
            placeholder="e.g., MacBook Pro"
            fullWidth
            variant="outlined"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Public Key"
            placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI..."
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={newKeyValue}
            onChange={(e) => setNewKeyValue(e.target.value)}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Paste your public key (usually in ~/.ssh/id_ed25519.pub or ~/.ssh/id_rsa.pub)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={!newKeyName.trim() || !newKeyValue.trim() || adding}
          >
            {adding ? 'Adding...' : 'Add Key'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function SettingsContent() {
  const { user } = useApp();
  const { mode, toggleTheme, currentThemeId, setThemeId, availableThemes } = useThemeContext();
  const isAdmin = user?.role === 'admin';

  const handleThemeChange = (event: SelectChangeEvent<string>) => {
    setThemeId(event.target.value);
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
              <VpnKeyIcon />
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

      {/* SSH Keys */}
      <SshKeysSection />

      {/* Appearance */}
      <Paper sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }} color="text.primary">
          Admin Appearance
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
                value={currentThemeId}
                label="Theme"
                onChange={handleThemeChange}
              >
                {availableThemes.map((theme) => (
                  <MenuItem key={theme.id} value={theme.id}>
                    {theme.name}
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

      {/* Public Appearance */}
      <PublicAppearanceSection />

      {/* Branding */}
      <BrandingSection />

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
                  <VpnKeyIcon />
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

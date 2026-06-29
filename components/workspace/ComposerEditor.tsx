'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Autocomplete,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  Add as AddIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { artifactService, Artifact } from '../../services/artifacts';
import { assetService } from '../../services/assets';

interface ComposerSection {
  artifact_id: string;
  caption: string;
}

interface ComposerContent {
  sections: ComposerSection[];
}

interface ComposerEditorProps {
  artifact: Artifact;
}

interface PickerItem {
  id: string;
  name: string;
  type: string;
  kind: 'artifact' | 'asset';
  mime_type?: string;
}

export default function ComposerEditor({ artifact }: ComposerEditorProps) {
  const [sections, setSections] = useState<ComposerSection[]>([]);
  const [pickerItems, setPickerItems] = useState<PickerItem[]>([]);
  const [loadingPicker, setLoadingPicker] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newSectionId, setNewSectionId] = useState<string | null>(null);
  const [name, setName] = useState(artifact.name);

  // Load initial content
  useEffect(() => {
    const content = (artifact.content as unknown) as ComposerContent;
    setSections(content?.sections || []);
    setName(artifact.name);
  }, [artifact]);

  const handleNameChange = useCallback(async (newName: string) => {
    setName(newName);
    if (newName.trim() && newName !== artifact.name) {
      try {
        await artifactService.updateArtifact(artifact.id, { name: newName.trim() });
      } catch (err: any) {
        console.error('Failed to update composition name', err);
      }
    }
  }, [artifact.id, artifact.name]);

  // Load all available artifacts and assets for picker
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoadingPicker(true);
        const [artifactsRes, assetsRes] = await Promise.all([
          artifactService.listArtifacts(),
          assetService.listAssets(),
        ]);

        const artifactItems: PickerItem[] = (artifactsRes.artifacts || [])
          .filter((a: Artifact) => a.id !== artifact.id && a.type !== 'composer')
          .map((a: Artifact) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            kind: 'artifact',
          }));

        const assetItems: PickerItem[] = (assetsRes.assets || [])
          .filter((a: any) => {
            const mime = a.mime_type || '';
            return mime.startsWith('video/') || mime.startsWith('audio/');
          })
          .map((a: any) => ({
            id: a.id,
            name: a.name,
            type: 'asset',
            kind: 'asset',
            mime_type: a.mime_type,
          }));

        setPickerItems([...artifactItems, ...assetItems]);
      } catch (e) {
        console.error('Failed to load picker items', e);
      } finally {
        setLoadingPicker(false);
      }
    };

    loadItems();
  }, [artifact.id]);

  const handleAddSection = useCallback(() => {
    if (!newSectionId) return;
    setSections((prev) => [...prev, { artifact_id: newSectionId, caption: '' }]);
    setNewSectionId(null);
  }, [newSectionId]);

  const handleRemoveSection = useCallback((index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleMoveSection = useCallback((index: number, direction: 'up' | 'down') => {
    setSections((prev) => {
      const newSections = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSections.length) return prev;
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      return newSections;
    });
  }, []);

  const handleCaptionChange = useCallback((index: number, caption: string) => {
    setSections((prev) => {
      const newSections = [...prev];
      newSections[index] = { ...newSections[index], caption };
      return newSections;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await artifactService.updateArtifact(artifact.id, {
        content: { sections },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save composition');
    } finally {
      setSaving(false);
    }
  }, [artifact.id, sections]);

  const getItemLabel = (id: string) => {
    const item = pickerItems.find((i) => i.id === id);
    return item ? `${item.name} (${item.type}${item.mime_type ? ` - ${item.mime_type}` : ''})` : id;
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <TextField
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={(e) => handleNameChange(e.target.value)}
          variant="standard"
          fullWidth
          sx={{
            '& .MuiInputBase-input': {
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'text.primary',
            },
          }}
          placeholder="Composition name"
        />
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          Save
        </Button>
      </Box>

      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Composition saved successfully
        </Alert>
      )}

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        Sections ({sections.length})
      </Typography>

      {/* Existing sections */}
      {sections.map((section, index) => (
        <Paper
          key={`${section.artifact_id}-${index}`}
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`#${index + 1}`}
              size="small"
              color="primary"
              sx={{ minWidth: 40 }}
            />
            <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 500 }}>
              {getItemLabel(section.artifact_id)}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleMoveSection(index, 'up')}
              disabled={index === 0}
              title="Move up"
            >
              <UpIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleMoveSection(index, 'down')}
              disabled={index === sections.length - 1}
              title="Move down"
            >
              <DownIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleRemoveSection(index)}
              color="error"
              title="Remove section"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>

          <TextField
            size="small"
            label="Caption (optional)"
            value={section.caption || ''}
            onChange={(e) => handleCaptionChange(index, e.target.value)}
            fullWidth
            placeholder="Text displayed under this section"
          />
        </Paper>
      ))}

      {sections.length === 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            mb: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Typography color="text.secondary">
            No sections yet. Add artifacts to build your composition.
          </Typography>
        </Paper>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Add new section */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Add Section
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Autocomplete
            options={pickerItems}
            getOptionLabel={(item) =>
              typeof item === 'string'
                ? item
                : `${item.name} (${item.type}${item.mime_type ? ` - ${item.mime_type}` : ''})`
            }
            renderOption={(props, item) => (
              <li {...props} key={item.id}>
                <Box>
                  <Typography variant="body2">{item.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.kind === 'asset' ? item.mime_type : item.type}
                  </Typography>
                </Box>
              </li>
            )}
            value={pickerItems.find((i) => i.id === newSectionId) || null}
            onChange={(_, value) => {
              if (value && typeof value !== 'string') {
                setNewSectionId(value.id);
              } else {
                setNewSectionId(null);
              }
            }}
            loading={loadingPicker}
            fullWidth
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select artifact or asset"
                placeholder="Search artifacts and media..."
              />
            )}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddSection}
            disabled={!newSectionId}
          >
            Add
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

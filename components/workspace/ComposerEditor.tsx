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
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import { artifactService, Artifact } from '../../services/artifacts';
import { assetService } from '../../services/assets';
import { folderService } from '../../services/folders';

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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newSectionId, setNewSectionId] = useState<string | null>(null);
  const [name, setName] = useState(artifact.name);

  // Debounced search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PickerItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [knownItems, setKnownItems] = useState<PickerItem[]>([]);
  const [selectedPickerItem, setSelectedPickerItem] = useState<PickerItem | null>(null);

  // Load initial content
  useEffect(() => {
    const content = (artifact.content as unknown) as ComposerContent;
    setSections(content?.sections || []);
    setName(artifact.name);
  }, [artifact]);

  // Load metadata for already-referenced sections on mount
  useEffect(() => {
    const content = (artifact.content as unknown) as ComposerContent;
    const sectionIds = (content?.sections || []).map((s) => s.artifact_id);
    if (sectionIds.length === 0) return;

    let cancelled = false;
    const loadKnown = async () => {
      const items: PickerItem[] = [];
      await Promise.all(
        sectionIds.map(async (id) => {
          try {
            const art = await artifactService.getArtifact(id);
            if (art.id !== artifact.id && art.type !== 'composer') {
              items.push({ id: art.id, name: art.name, type: art.type, kind: 'artifact' as const });
            }
          } catch {
            try {
              const asset = await assetService.getAsset(id);
              const mime = asset.mime_type || '';
              if (mime.startsWith('video/') || mime.startsWith('audio/')) {
                items.push({
                  id: asset.id,
                  name: asset.name,
                  type: 'asset',
                  kind: 'asset' as const,
                  mime_type: asset.mime_type,
                });
              }
            } catch {
              // ignore
            }
          }
        })
      );
      if (!cancelled) {
        setKnownItems(items);
      }
    };

    loadKnown();
    return () => { cancelled = true; };
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

  // Debounced search for artifacts and assets
  useEffect(() => {
    if (!searchOpen || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const rootFolderId = '00000000-0000-0000-0000-000000000001';
        const res = await folderService.searchFolderItems(rootFolderId, searchQuery.trim());

        const artifactItems: PickerItem[] = (res.items || [])
          .filter((item: any) => item.kind === 'artifact')
          .filter((item: any) => item.id !== artifact.id && item.type !== 'composer')
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            type: item.type,
            kind: 'artifact' as const,
          }));

        const assetItems: PickerItem[] = (res.items || [])
          .filter((item: any) => item.kind === 'asset')
          .filter((item: any) => {
            const mime = item.mime_type || '';
            return mime.startsWith('video/') || mime.startsWith('audio/');
          })
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            type: 'asset',
            kind: 'asset' as const,
            mime_type: item.mime_type,
          }));

        const results = [...artifactItems, ...assetItems];
        setSearchResults(results);

        // Merge into known items cache so existing sections can resolve labels
        setKnownItems((prev) => {
          const merged = [...prev];
          for (const item of results) {
            if (!merged.find((p) => p.id === item.id)) {
              merged.push(item);
            }
          }
          return merged;
        });
      } catch (e) {
        console.error('Search failed', e);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen, artifact.id]);

  const handleAddSection = useCallback(() => {
    if (!newSectionId || !selectedPickerItem) return;
    setSections((prev) => [...prev, { artifact_id: newSectionId, caption: '' }]);
    setNewSectionId(null);
    setSelectedPickerItem(null);
    setSearchQuery('');
    setSearchResults([]);
  }, [newSectionId, selectedPickerItem]);

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
    const item = knownItems.find((i) => i.id === id);
    return item ? `${item.name} (${item.type}${item.mime_type ? ` - ${item.mime_type}` : ''})` : id;
  };

  const getSectionUrl = (id: string) => {
    const item = knownItems.find((i) => i.id === id);
    if (item?.kind === 'asset') {
      return `/workspace/assets/${id}`;
    }
    return `/workspace/artifacts/${id}`;
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
              onClick={() => window.open(getSectionUrl(section.artifact_id), '_blank')}
              title="Open in workspace"
            >
              <OpenIcon fontSize="small" />
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
            options={searchResults}
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
            value={selectedPickerItem}
            onChange={(_, value) => {
              if (value && typeof value !== 'string') {
                setNewSectionId(value.id);
                setSelectedPickerItem(value);
                setSearchOpen(false);
                setKnownItems((prev) => {
                  if (prev.find((p) => p.id === value.id)) return prev;
                  return [...prev, value];
                });
              } else {
                setNewSectionId(null);
                setSelectedPickerItem(null);
              }
            }}
            onInputChange={(_, value) => {
              setSearchQuery(value);
            }}
            open={searchOpen}
            onOpen={() => setSearchOpen(true)}
            onClose={() => setSearchOpen(false)}
            filterOptions={(x) => x}
            loading={searchLoading}
            noOptionsText={searchQuery.trim().length < 2 ? 'Type at least 2 characters' : 'No results'}
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

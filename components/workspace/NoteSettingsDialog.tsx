'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Divider,
} from '@mui/material';
import { artifactService } from '../../services/artifacts';
import CoverImagePicker from './CoverImagePicker';

interface NoteSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  artifact: {
    id: string;
    name: string;
    description?: string | null;
    meta?: Record<string, unknown> | null;
    folder_id?: string;
  };
}

/**
 * Note settings: description (used for OG cards / search results) and featured
 * image (meta.cover_asset_id, shared with composer + feed).
 */
export default function NoteSettingsDialog({
  open,
  onClose,
  artifact,
}: NoteSettingsDialogProps) {
  const [description, setDescription] = useState(artifact.description || '');
  const [descriptionSaving, setDescriptionSaving] = useState(false);

  const handleDescriptionSave = useCallback(async () => {
    const trimmed = description.trim();
    if (trimmed === (artifact.description || '')) return;
    setDescriptionSaving(true);
    try {
      await artifactService.updateArtifact(artifact.id, {
        description: trimmed || undefined,
      });
    } catch (err) {
      console.error('Failed to save description', err);
    } finally {
      setDescriptionSaving(false);
    }
  }, [artifact.id, artifact.description, description]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Note Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Description
          </Typography>
          <TextField
            multiline
            rows={3}
            size="small"
            fullWidth
            placeholder="Short summary of this note..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionSave}
            disabled={descriptionSaving}
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {descriptionSaving ? 'Saving...' : 'Used in social sharing cards and search results.'}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <CoverImagePicker artifact={artifact} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

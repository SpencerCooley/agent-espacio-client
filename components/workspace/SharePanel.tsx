'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Switch,
  Paper,
  TextField,
  Button,
  Chip,
  Alert,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import { ContentCopy as CopyIcon, Public as PublicIcon, Lock as LockIcon } from '@mui/icons-material';

interface SharePanelProps {
  itemId: string;
  itemType: 'folder' | 'asset' | 'artifact';
  isPublic: boolean;
  publicMagicId: string | null;
  isInherited?: boolean;
  onToggle: () => void;
}

export default function SharePanel({
  itemId,
  itemType,
  isPublic,
  publicMagicId,
  isInherited = false,
  onToggle,
}: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  const publicUrl = publicMagicId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/public/view/${publicMagicId}`
    : '';

  const handleCopy = useCallback(() => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [publicUrl]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        {isPublic ? <PublicIcon color="primary" /> : <LockIcon />}
        Share
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {isInherited && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This item is public because its parent folder is shared.
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Public access</Typography>
          <Switch
            checked={isPublic}
            onChange={onToggle}
            disabled={isInherited}
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {isPublic
            ? 'Anyone with the link can view this item'
            : 'Only logged-in users can access this item'}
        </Typography>
      </Box>

      {isPublic && publicUrl && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Public link
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              value={publicUrl}
              size="small"
              fullWidth
              InputProps={{
                readOnly: true,
              }}
            />
            <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
              <IconButton onClick={handleCopy} size="small" color={copied ? 'success' : 'default'}>
                <CopyIcon />
              </IconButton>
            </Tooltip>
          </Box>
          {copied && (
            <Chip
              size="small"
              color="success"
              label="Copied to clipboard"
              sx={{ mt: 1 }}
            />
          )}
        </Paper>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Item ID: {itemId}
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          Type: {itemType}
        </Typography>
      </Box>
    </Box>
  );
}

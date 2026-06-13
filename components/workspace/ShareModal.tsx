'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Switch,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import { ContentCopy as CopyIcon, Public as PublicIcon, Lock as LockIcon } from '@mui/icons-material';
import { useShareContext } from '../../context/ShareContext';

export default function ShareModal() {
  const { shareTarget, modalOpen, setModalOpen } = useShareContext();
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setModalOpen(false);
  };

  const handleCopy = useCallback(() => {
    if (shareTarget?.publicMagicId) {
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/public/view/${shareTarget.publicMagicId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareTarget]);

  if (!shareTarget) return null;

  const publicUrl = shareTarget.publicMagicId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/public/view/${shareTarget.publicMagicId}`
    : '';

  return (
    <Dialog open={modalOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {shareTarget.isPublic ? <PublicIcon color="primary" /> : <LockIcon />}
        Share
      </DialogTitle>
      <DialogContent>
        <Box>
          {shareTarget.isInherited && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This item is public because its parent folder is shared.
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Public access</Typography>
              <Switch
                checked={shareTarget.isPublic}
                onChange={shareTarget.onToggle}
                disabled={shareTarget.isInherited || shareTarget.isLoading}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {shareTarget.isPublic
                ? 'Anyone with the link can view this item'
                : 'Only logged-in users can access this item'}
            </Typography>
          </Box>

          {shareTarget.isPublic && publicUrl && (
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

          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Item ID: {shareTarget.id}
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              Type: {shareTarget.type}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

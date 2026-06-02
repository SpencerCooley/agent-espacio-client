'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemKind: 'folder' | 'asset' | 'artifact';
}

export default function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  itemName,
  itemKind,
}: DeleteConfirmDialogProps) {
  const getMessage = () => {
    if (itemKind === 'folder') {
      return `Are you sure you want to delete "${itemName}"? This will permanently delete all contents inside.`;
    }
    return `Are you sure you want to delete "${itemName}"? This action cannot be undone.`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete {itemKind === 'folder' ? 'Folder' : itemKind === 'asset' ? 'File' : 'Artifact'}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          {getMessage()}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

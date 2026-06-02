'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { folderService } from '../../services/folders';

interface CreateFolderFormData {
  name: string;
}

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  parentFolderId: string;
  onSuccess: () => void;
}

export default function CreateFolderDialog({ open, onClose, parentFolderId, onSuccess }: CreateFolderDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFolderFormData>();

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const onSubmit = async (data: CreateFolderFormData) => {
    try {
      setError(null);
      await folderService.createFolder(data.name, parentFolderId);
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create folder';
      setError(message);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Folder</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Folder name"
          fullWidth
          {...register('name', {
            required: 'Folder name is required',
            maxLength: {
              value: 255,
              message: 'Folder name must be less than 255 characters',
            },
          })}
          error={!!errors.name}
          helperText={errors.name?.message}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isSubmitting}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

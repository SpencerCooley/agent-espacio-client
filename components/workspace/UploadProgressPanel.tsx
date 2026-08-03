'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircle,
  Close,
  Error as ErrorIcon,
  InsertDriveFile,
  CloudUpload,
} from '@mui/icons-material';

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number; // 0-100
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const SUCCESS_FLASH_MS = 900;

interface UploadRowProps {
  upload: UploadItem;
  onRemove: (id: string) => void;
}

function UploadRow({ upload, onRemove }: UploadRowProps) {
  const [show, setShow] = useState(true);

  // Successful uploads flash a checkmark briefly, then collapse away
  useEffect(() => {
    if (upload.status === 'success') {
      const timer = setTimeout(() => setShow(false), SUCCESS_FLASH_MS);
      return () => clearTimeout(timer);
    }
  }, [upload.status]);

  return (
    <Collapse in={show} onExited={() => onRemove(upload.id)}>
      <Box sx={{ px: 2, py: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {upload.status === 'success' ? (
            <CheckCircle color="success" fontSize="small" />
          ) : upload.status === 'error' ? (
            <ErrorIcon color="error" fontSize="small" />
          ) : (
            <InsertDriveFile color="action" fontSize="small" />
          )}
          <Typography
            variant="body2"
            noWrap
            title={upload.name}
            sx={{ flex: 1, minWidth: 0, fontWeight: 500 }}
          >
            {upload.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {upload.status === 'error' ? (
              'Failed'
            ) : upload.status === 'success' ? (
              'Done'
            ) : (
              `${upload.progress}%`
            )}
          </Typography>
          {upload.status === 'error' && (
            <Tooltip title="Dismiss">
              <IconButton size="small" onClick={() => setShow(false)} aria-label="Dismiss failed upload">
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <LinearProgress
            variant="determinate"
            value={upload.status === 'uploading' ? upload.progress : 100}
            color={upload.status === 'error' ? 'error' : upload.status === 'success' ? 'success' : 'primary'}
            sx={{ flex: 1, height: 4, borderRadius: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {formatSize(upload.size)}
          </Typography>
        </Box>
        {upload.status === 'error' && upload.error && (
          <Typography variant="caption" color="error" noWrap title={upload.error}>
            {upload.error}
          </Typography>
        )}
      </Box>
    </Collapse>
  );
}

interface UploadProgressPanelProps {
  uploads: UploadItem[];
  onRemove: (id: string) => void;
}

/**
 * Floating bottom-right list of in-flight uploads.
 * Finished uploads flash a checkmark and disappear; failures persist until dismissed.
 */
export default function UploadProgressPanel({ uploads, onRemove }: UploadProgressPanelProps) {
  const activeCount = uploads.filter((u) => u.status === 'uploading').length;

  if (uploads.length === 0) return null;

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 320,
        maxWidth: 'calc(100vw - 48px)',
        zIndex: (theme) => theme.zIndex.snackbar,
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <CloudUpload fontSize="small" color={activeCount > 0 ? 'primary' : 'action'} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {activeCount > 0
            ? `Uploading ${activeCount} file${activeCount > 1 ? 's' : ''}…`
            : 'Uploads'}
        </Typography>
      </Box>
      <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
        {uploads.map((upload) => (
          <UploadRow key={upload.id} upload={upload} onRemove={onRemove} />
        ))}
      </Box>
    </Paper>
  );
}

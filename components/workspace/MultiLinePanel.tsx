'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface DrawingLine {
  id: string;
  coords: [number, number][];
}

interface MultiLinePanelProps {
  lines: DrawingLine[];
  currentLineId: string | null;
  onAddLine: () => void;
  onRemoveLine: (id: string) => void;
  onFinish: () => void;
  onCancel: () => void;
}

export default function MultiLinePanel({
  lines,
  currentLineId,
  onAddLine,
  onRemoveLine,
  onFinish,
  onCancel,
}: MultiLinePanelProps) {
  const currentLine = lines.find((l) => l.id === currentLineId);
  const currentIndex = lines.findIndex((l) => l.id === currentLineId);
  const pointCount = currentLine?.coords.length || 0;

  return (
    <Paper
      elevation={2}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: 220,
        py: 1,
        px: 1.5,
        borderRadius: 1,
        overflow: 'hidden',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" fontWeight={600} fontSize="0.875rem">
          MultiLine
        </Typography>
        <Tooltip title="Cancel">
          <IconButton size="small" onClick={onCancel} sx={{ p: 0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="caption" color="text.secondary">
        Drawing Line {currentIndex + 1}
      </Typography>

      <Typography variant="caption" color="primary.main" fontWeight={500}>
        {pointCount} points placed
      </Typography>

      <Divider sx={{ my: 0.5 }} />

      <Button
        size="small"
        variant="outlined"
        startIcon={<AddIcon fontSize="small" />}
        onClick={onAddLine}
        disabled={pointCount < 2}
        sx={{ fontSize: '0.75rem', py: 0.5 }}
      >
        Next Line
      </Button>

      <Divider sx={{ my: 0.5 }} />

      <Typography variant="caption" fontWeight={500} color="text.secondary">
        Lines ({lines.length})
      </Typography>

      <List dense disablePadding sx={{ maxHeight: 120, overflow: 'auto' }}>
        {lines.map((line, index) => (
          <ListItem
            key={line.id}
            disablePadding
            sx={{
              py: 0.25,
              bgcolor: line.id === currentLineId ? 'action.selected' : 'transparent',
              borderRadius: 0.5,
            }}
          >
            <ListItemText
              primary={
                <Typography variant="caption" noWrap>
                  Line {index + 1}
                  {' '}
                  <Typography variant="caption" color="text.secondary">
                    ({line.coords.length} pts)
                  </Typography>
                </Typography>
              }
            />
            <ListItemSecondaryAction>
              <Tooltip title="Remove">
                <IconButton
                  size="small"
                  edge="end"
                  onClick={() => onRemoveLine(line.id)}
                  sx={{ p: 0.5 }}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 0.5 }} />

      <Button
        size="small"
        variant="contained"
        color="success"
        startIcon={<CheckIcon fontSize="small" />}
        onClick={onFinish}
        disabled={lines.length === 0 || (lines.length === 1 && lines[0].coords.length < 2)}
        sx={{ fontSize: '0.75rem', py: 0.5 }}
      >
        Finish MultiLine
      </Button>
    </Paper>
  );
}

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
import UndoIcon from '@mui/icons-material/Undo';

interface DrawingPolygon {
  id: string;
  coords: [number, number][];
  isHole: boolean;
}

interface MultiPolygonPanelProps {
  polygons: DrawingPolygon[];
  currentPolygonId: string | null;
  onAddPolygon: () => void;
  onAddHole: () => void;
  onRemovePolygon: (id: string) => void;
  onFinish: () => void;
  onCancel: () => void;
}

export default function MultiPolygonPanel({
  polygons,
  currentPolygonId,
  onAddPolygon,
  onAddHole,
  onRemovePolygon,
  onFinish,
  onCancel,
}: MultiPolygonPanelProps) {
  const currentPolygon = polygons.find((p) => p.id === currentPolygonId);
  const currentIndex = polygons.findIndex((p) => p.id === currentPolygonId);
  const pointCount = currentPolygon?.coords.length || 0;

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
          MultiPolygon
        </Typography>
        <Tooltip title="Cancel">
          <IconButton size="small" onClick={onCancel} sx={{ p: 0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="caption" color="text.secondary">
        {currentPolygon?.isHole
          ? `Drawing hole (part of Polygon ${currentIndex + 1})`
          : `Drawing Polygon ${currentIndex + 1}`}
      </Typography>

      <Typography variant="caption" color="primary.main" fontWeight={500}>
        {pointCount} points placed
      </Typography>

      <Divider sx={{ my: 0.5 }} />

      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon fontSize="small" />}
          onClick={onAddPolygon}
          disabled={pointCount < 3}
          sx={{ flex: 1, fontSize: '0.75rem', py: 0.5 }}
        >
          Next Polygon
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<UndoIcon fontSize="small" />}
          onClick={onAddHole}
          disabled={pointCount < 3}
          sx={{ flex: 1, fontSize: '0.75rem', py: 0.5 }}
        >
          Hole
        </Button>
      </Box>

      <Divider sx={{ my: 0.5 }} />

      <Typography variant="caption" fontWeight={500} color="text.secondary">
        Polygons ({polygons.length})
      </Typography>

      <List dense disablePadding sx={{ maxHeight: 120, overflow: 'auto' }}>
        {polygons.map((polygon, index) => (
          <ListItem
            key={polygon.id}
            disablePadding
            sx={{
              py: 0.25,
              bgcolor: polygon.id === currentPolygonId ? 'action.selected' : 'transparent',
              borderRadius: 0.5,
            }}
          >
            <ListItemText
              primary={
                <Typography variant="caption" noWrap>
                  {polygon.isHole ? `Hole ${index + 1}` : `Polygon ${index + 1}`}
                  {' '}
                  <Typography variant="caption" color="text.secondary">
                    ({polygon.coords.length} pts)
                  </Typography>
                </Typography>
              }
            />
            <ListItemSecondaryAction>
              <Tooltip title="Remove">
                <IconButton
                  size="small"
                  edge="end"
                  onClick={() => onRemovePolygon(polygon.id)}
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
        disabled={polygons.length === 0 || (polygons.length === 1 && polygons[0].coords.length < 3)}
        sx={{ fontSize: '0.75rem', py: 0.5 }}
      >
        Finish MultiPolygon
      </Button>
    </Paper>
  );
}

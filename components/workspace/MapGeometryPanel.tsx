'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tabs,
  Tab,
  TextField,
  Button,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Slider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import TimelineIcon from '@mui/icons-material/Timeline';
import PentagonIcon from '@mui/icons-material/Pentagon';
import DeleteIcon from '@mui/icons-material/Delete';
import AddLinkIcon from '@mui/icons-material/AddLink';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { FolderItem } from '../../services/folders';
import {
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Movie as MovieIcon,
  Article as ArticleIcon,
  Map as MapIcon,
  Description as MarkdownIcon,
  DataObject as JsonIcon,
} from '@mui/icons-material';
import InlineThumbnail from './InlineThumbnail';

interface Feature {
  id: string;
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiLineString' | 'MultiPolygon';
    coordinates: any;
  };
  properties: {
    name?: string;
    description?: string;
    style?: {
      color?: string;
      fillOpacity?: number;
      strokeWidth?: number;
    };
    associations?: Array<{
      type: 'artifact' | 'asset';
      id: string;
      name: string;
      kind?: string;
      mime_type?: string;
      is_image?: boolean;
      public_magic_id?: string | null;
    }>;
    metadata?: Record<string, unknown>;
  };
}

interface MapGeometryPanelProps {
  features: Feature[];
  selectedFeatureId: string | null;
  onSelectFeature: (id: string | null) => void;
  onHoverFeature: (id: string | null) => void;
  onUpdateFeature: (feature: Feature) => void;
  onDeleteFeature: (id: string) => void;
  onAddAssociation: () => void;
  onRemoveAssociation: (featureId: string, associationId: string) => void;
}

const getGeometryIcon = (type: string) => {
  switch (type) {
    case 'Point': return <MyLocationIcon fontSize="small" />;
    case 'LineString': return <TimelineIcon fontSize="small" />;
    case 'MultiLineString': return <TimelineIcon fontSize="small" />;
    case 'Polygon': return <PentagonIcon fontSize="small" />;
    case 'MultiPolygon': return <PentagonIcon fontSize="small" />;
    default: return <MyLocationIcon fontSize="small" />;
  }
};

const getGeometryLabel = (type: string) => {
  switch (type) {
    case 'Point': return 'Point';
    case 'LineString': return 'Line';
    case 'MultiLineString': return 'MultiLine';
    case 'Polygon': return 'Polygon';
    case 'MultiPolygon': return 'MultiPolygon';
    default: return type;
  }
};

const getDefaultName = (type: string, index: number) => {
  switch (type) {
    case 'Point': return `Point ${index + 1}`;
    case 'LineString': return `Line ${index + 1}`;
    case 'Polygon': return `Polygon ${index + 1}`;
    default: return `Feature ${index + 1}`;
  }
};

export default function MapGeometryPanel({
  features,
  selectedFeatureId,
  onSelectFeature,
  onHoverFeature,
  onUpdateFeature,
  onDeleteFeature,
  onAddAssociation,
  onRemoveAssociation,
}: MapGeometryPanelProps) {
  const [tabIndex, setTabIndex] = useState(0);

  const selectedFeature = features.find((f) => f.id === selectedFeatureId);

  // Reset tab when selection changes
  useEffect(() => {
    setTabIndex(0);
  }, [selectedFeatureId]);

  // List view (no feature selected)
  if (!selectedFeature) {
    return (
      <Paper
        elevation={2}
        sx={{
          width: 320,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            Geometries ({features.length})
          </Typography>
        </Box>

        {/* Feature List */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {features.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">No geometries yet</Typography>
              <Typography variant="caption">Use the toolbar to draw shapes</Typography>
            </Box>
          ) : (
              <List dense disablePadding>
              {features.map((feature, index) => {
                const name = feature.properties?.name || getDefaultName(feature.geometry.type, index);
                const isSelected = selectedFeatureId === feature.id;

                return (
                  <ListItem
                    key={feature.id}
                    disablePadding
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFeature(feature.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    }
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => onSelectFeature(feature.id)}
                      onMouseEnter={() => onHoverFeature(feature.id)}
                      onMouseLeave={() => onHoverFeature(null)}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {getGeometryIcon(feature.geometry.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                            {name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {getGeometryLabel(feature.geometry.type)}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>

      </Paper>
    );
  }

  // Detail view (feature selected)
  const name = selectedFeature.properties?.name || getDefaultName(selectedFeature.geometry.type, 0);
  const description = selectedFeature.properties?.description || '';
  const style = selectedFeature.properties?.style || {};
  const associations = selectedFeature.properties?.associations || [];
  const metadata = selectedFeature.properties?.metadata || {};

  return (
    <Paper
      elevation={2}
      sx={{
        width: 320,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid',
        borderColor: 'divider',
        borderRadius: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header with breadcrumb */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <IconButton size="small" onClick={() => onSelectFeature(null)}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ flex: 1 }}>
          {name}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onDeleteFeature(selectedFeature.id)}
        >
          <DeleteIcon fontSize="small" color="error" />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        variant="fullWidth"
        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="Settings" />
        <Tab label="Associations" />
      </Tabs>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {tabIndex === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Name */}
            <TextField
              label="Name"
              value={name}
              onChange={(e) => {
                const updated = {
                  ...selectedFeature,
                  properties: {
                    ...selectedFeature.properties,
                    name: e.target.value,
                  },
                };
                onUpdateFeature(updated);
              }}
              size="small"
              fullWidth
            />

            {/* Description */}
            <TextField
              label="Description"
              value={description}
              onChange={(e) => {
                const updated = {
                  ...selectedFeature,
                  properties: {
                    ...selectedFeature.properties,
                    description: e.target.value,
                  },
                };
                onUpdateFeature(updated);
              }}
              size="small"
              multiline
              rows={3}
              fullWidth
            />

            {/* Color */}
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  '#1976d2', '#1565c0', '#0d47a1',
                  '#f44336', '#e53935', '#c62828',
                  '#4caf50', '#43a047', '#2e7d32',
                  '#ff9800', '#f57c00', '#e65100',
                  '#9c27b0', '#7b1fa2', '#4a148c',
                  '#00bcd4', '#0097a7', '#006064',
                  '#ffeb3b', '#fbc02d', '#f57f17',
                  '#e91e63', '#c2185b', '#880e4f',
                  '#795548', '#5d4037', '#3e2723',
                  '#607d8b', '#455a64', '#263238',
                  '#ffffff', '#bdbdbd', '#616161',
                ].map((c) => (
                  <Box
                    key={c}
                    onClick={() => {
                      const updated = {
                        ...selectedFeature,
                        properties: {
                          ...selectedFeature.properties,
                          style: { ...style, color: c },
                        },
                      };
                      onUpdateFeature(updated);
                    }}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: c,
                      cursor: 'pointer',
                      border: style?.color === c ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: style?.color === c ? '0 0 0 2px #000' : 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Fill Opacity */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Fill Opacity: {((style?.fillOpacity ?? 0.3) * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={style?.fillOpacity ?? 0.3}
                onChange={(_, v) => {
                  const updated = {
                    ...selectedFeature,
                    properties: {
                      ...selectedFeature.properties,
                      style: { ...style, fillOpacity: v as number },
                    },
                  };
                  onUpdateFeature(updated);
                }}
                min={0}
                max={1}
                step={0.05}
                size="small"
              />
            </Box>

            {/* Stroke Width */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Stroke Width: {style?.strokeWidth ?? 2}px
              </Typography>
              <Slider
                value={style?.strokeWidth ?? 2}
                onChange={(_, v) => {
                  const updated = {
                    ...selectedFeature,
                    properties: {
                      ...selectedFeature.properties,
                      style: { ...style, strokeWidth: v as number },
                    },
                  };
                  onUpdateFeature(updated);
                }}
                min={1}
                max={10}
                step={1}
                size="small"
              />
            </Box>

            {/* Metadata JSON */}
            <Divider />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Metadata
            </Typography>
            <TextField
              label="JSON Metadata"
              value={JSON.stringify(metadata, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  const updated = {
                    ...selectedFeature,
                    properties: {
                      ...selectedFeature.properties,
                      metadata: parsed,
                    },
                  };
                  onUpdateFeature(updated);
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              size="small"
              multiline
              rows={4}
              fullWidth
              helperText="Edit as JSON"
            />
          </Box>
        )}

        {tabIndex === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddLinkIcon />}
              onClick={onAddAssociation}
              fullWidth
            >
              Add Association
            </Button>

            {associations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                <Typography variant="body2">No associations yet</Typography>
                <Typography variant="caption">Link notes, assets, or other items</Typography>
              </Box>
            ) : (
              <List dense disablePadding>
                {associations.map((assoc) => (
                  <ListItem
                    key={assoc.id}
                    disablePadding
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => onRemoveAssociation(selectedFeature.id, assoc.id)}
                      >
                        <LinkOffIcon fontSize="small" color="error" />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      onClick={() => {
                        const url = assoc.type === 'asset'
                          ? `/workspace/assets/${assoc.id}`
                          : `/workspace/artifacts/${assoc.id}`;
                        window.open(url, '_blank');
                      }}
                      sx={{ gap: 1.5 }}
                    >
                      <Box sx={{ minWidth: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <InlineThumbnail
                          type={assoc.type}
                          id={assoc.id}
                          kind={assoc.kind}
                          is_image={assoc.is_image}
                          variant="editor"
                          size={40}
                        />
                        {(assoc.type === 'artifact' || (!assoc.is_image && !assoc.kind?.includes('image') && !assoc.kind?.includes('video'))) && (
                          <Box sx={{ color: 'text.secondary' }}>
                            {assoc.type === 'artifact' ? (
                              assoc.kind === 'note' ? <ArticleIcon fontSize="small" /> :
                              assoc.kind === 'map' ? <MapIcon fontSize="small" /> :
                              <ArticleIcon fontSize="small" />
                            ) : (
                              assoc.kind?.includes('video') ? <MovieIcon fontSize="small" /> :
                              assoc.kind?.includes('markdown') ? <MarkdownIcon fontSize="small" /> :
                              assoc.kind?.includes('json') ? <JsonIcon fontSize="small" /> :
                              <FileIcon fontSize="small" />
                            )}
                          </Box>
                        )}
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                            {assoc.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            <Chip label={assoc.type} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                            {assoc.kind && (
                              <Chip label={assoc.kind} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                            )}
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
}

'use client';

import {
  Box,
  Typography,
  IconButton,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PublicIcon from '@mui/icons-material/Public';
import MapIcon from '@mui/icons-material/Map';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SatelliteIcon from '@mui/icons-material/Satellite';

export interface MapSettings {
  style: string;
}

interface MapSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: MapSettings;
  onChange: (settings: MapSettings) => void;
  viewport?: {
    latitude: number;
    longitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
}

const STYLE_OPTIONS = [
  {
    value: 'carto-voyager',
    label: 'Street',
    description: 'CARTO Voyager — clean, detailed street map',
    icon: <MapIcon fontSize="small" />,
  },
  {
    value: 'osm',
    label: 'OpenStreetMap',
    description: 'Classic OSM standard tiles',
    icon: <PublicIcon fontSize="small" />,
  },
  {
    value: 'dark-matter',
    label: 'Dark',
    description: 'CARTO Dark Matter — dark theme',
    icon: <DarkModeIcon fontSize="small" />,
  },
  {
    value: 'google-satellite',
    label: 'Satellite',
    description: 'Google Satellite — high-resolution aerial imagery',
    icon: <SatelliteIcon fontSize="small" />,
  },
];

export default function MapSettingsPanel({
  open,
  onClose,
  settings,
  onChange,
  viewport,
}: MapSettingsPanelProps) {
  if (!open) return null;

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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          Map Settings
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {/* Base Map Style */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Base Map Style
          </Typography>
          <RadioGroup
            value={settings.style}
            onChange={(e) => onChange({ ...settings, style: e.target.value })}
            sx={{ mt: 1 }}
          >
            {STYLE_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 0.5 }}>
                    {option.icon}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                        {option.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                        {option.description}
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{
                  alignItems: 'flex-start',
                  mb: 0.5,
                  '& .MuiRadio-root': { mt: 0.5 },
                }}
              />
            ))}
          </RadioGroup>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Viewport Info */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Viewport
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Latitude</Typography>
              <Typography variant="caption" fontFamily="monospace">
                {viewport?.latitude?.toFixed(4) ?? '--'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Longitude</Typography>
              <Typography variant="caption" fontFamily="monospace">
                {viewport?.longitude?.toFixed(4) ?? '--'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Zoom</Typography>
              <Typography variant="caption" fontFamily="monospace">
                {viewport?.zoom?.toFixed(2) ?? '--'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Pitch</Typography>
              <Typography variant="caption" fontFamily="monospace">
                {viewport?.pitch?.toFixed(1) ?? '--'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Bearing</Typography>
              <Typography variant="caption" fontFamily="monospace">
                {viewport?.bearing?.toFixed(1) ?? '--'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

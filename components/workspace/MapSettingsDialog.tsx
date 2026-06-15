'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Divider,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import MapIcon from '@mui/icons-material/Map';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SatelliteIcon from '@mui/icons-material/Satellite';

interface MapSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  style: string;
  onStyleChange: (style: string) => void;
  viewport?: {
    latitude: number;
    longitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
}

const STYLE_OPTIONS = [
  { value: 'carto-voyager', label: 'Street', icon: <MapIcon fontSize="small" /> },
  { value: 'osm', label: 'OpenStreetMap', icon: <PublicIcon fontSize="small" /> },
  { value: 'dark-matter', label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
  { value: 'google-satellite', label: 'Satellite', icon: <SatelliteIcon fontSize="small" /> },
];

export default function MapSettingsDialog({
  open,
  onClose,
  style,
  onStyleChange,
  viewport,
}: MapSettingsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Map Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Base Map Style
          </Typography>
          <RadioGroup
            value={style}
            onChange={(e) => onStyleChange(e.target.value)}
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
                    <Typography variant="body2">{option.label}</Typography>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Viewport
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Latitude</Typography>
              <Typography variant="caption" fontFamily="monospace">{viewport?.latitude?.toFixed(4) ?? '--'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Longitude</Typography>
              <Typography variant="caption" fontFamily="monospace">{viewport?.longitude?.toFixed(4) ?? '--'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Zoom</Typography>
              <Typography variant="caption" fontFamily="monospace">{viewport?.zoom?.toFixed(2) ?? '--'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Pitch</Typography>
              <Typography variant="caption" fontFamily="monospace">{viewport?.pitch?.toFixed(1) ?? '--'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Bearing</Typography>
              <Typography variant="caption" fontFamily="monospace">{viewport?.bearing?.toFixed(1) ?? '--'}</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

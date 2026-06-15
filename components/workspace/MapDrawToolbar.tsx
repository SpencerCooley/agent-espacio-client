'use client';

import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import PanToolIcon from '@mui/icons-material/PanTool';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import TimelineIcon from '@mui/icons-material/Timeline';
import PentagonIcon from '@mui/icons-material/Pentagon';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CheckIcon from '@mui/icons-material/Check';

export type DrawMode = 'simple_select' | 'draw_point' | 'draw_line_string' | 'draw_polygon' | 'draw_multi_polygon' | 'draw_multi_line';

interface MapDrawToolbarProps {
  activeMode: DrawMode;
  isDrawing: boolean;
  onChangeMode: (mode: DrawMode) => void;
  onFinish: () => void;
}

const TOOLS = [
  { mode: 'simple_select' as DrawMode, label: 'Select / Pan', icon: <PanToolIcon fontSize="small" /> },
  { mode: 'draw_point' as DrawMode, label: 'Draw Point', icon: <AddLocationIcon fontSize="small" /> },
  { mode: 'draw_line_string' as DrawMode, label: 'Draw Line', icon: <TimelineIcon fontSize="small" /> },
  { mode: 'draw_multi_line' as DrawMode, label: 'Draw MultiLine', icon: <TimelineIcon fontSize="small" /> },
  { mode: 'draw_polygon' as DrawMode, label: 'Draw Polygon', icon: <PentagonIcon fontSize="small" /> },
  { mode: 'draw_multi_polygon' as DrawMode, label: 'Draw MultiPolygon', icon: <ViewModuleIcon fontSize="small" /> },
];

export default function MapDrawToolbar({
  activeMode,
  isDrawing,
  onChangeMode,
  onFinish,
}: MapDrawToolbarProps) {
  return (
    <Paper
      elevation={2}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 0.5,
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {TOOLS.map((tool) => (
        <Tooltip key={tool.mode} title={tool.label} placement="right">
          <IconButton
            size="small"
            onClick={() => onChangeMode(tool.mode)}
            color={activeMode === tool.mode ? 'primary' : 'default'}
            sx={{
              borderRadius: 0.5,
              m: 0.25,
              ...(activeMode === tool.mode && {
                bgcolor: 'action.selected',
              }),
            }}
          >
            {tool.icon}
          </IconButton>
        </Tooltip>
      ))}

      {isDrawing && (
        <>
          <Divider sx={{ width: '60%', my: 0.5 }} />
          <Tooltip title="Finish drawing" placement="right">
            <IconButton
              size="small"
              onClick={onFinish}
              color="success"
              sx={{ borderRadius: 0.5, m: 0.25 }}
            >
              <CheckIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}

    </Paper>
  );
}

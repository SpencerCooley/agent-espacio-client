'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Paper, Typography } from '@mui/material';
import {
  SmartToy,
  Person,
  AccountTree,
  Code,
  Link,
  PlayArrow,
  CallSplit,
  Book,
} from '@mui/icons-material';

export interface WorkflowNodeData {
  title: string;
  description?: string;
  prompt?: string;
  code?: string;
  linked_item_id?: string;
  linked_item_type?: string;
  parameters?: Record<string, unknown>;
  onTitleChange?: (newTitle: string) => void;
}

const NODE_TYPE_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  action: {
    color: '#1976d2',
    icon: <PlayArrow fontSize="small" />,
    label: 'Action',
  },
  ai_action: {
    color: '#7b1fa2',
    icon: <SmartToy fontSize="small" />,
    label: 'AI Action',
  },
  human_in_loop: {
    color: '#ed6c02',
    icon: <Person fontSize="small" />,
    label: 'Human Review',
  },
  espacio_action: {
    color: '#2e7d32',
    icon: <AccountTree fontSize="small" />,
    label: 'Espacio Action',
  },
  decision: {
    color: '#f9a825',
    icon: <CallSplit fontSize="small" />,
    label: 'Decision',
  },
  code: {
    color: '#424242',
    icon: <Code fontSize="small" />,
    label: 'Code',
  },
  data_reference: {
    color: '#757575',
    icon: <Link fontSize="small" />,
    label: 'Data Ref',
  },
  workflow_reference: {
    color: '#0288d1',
    icon: <AccountTree fontSize="small" />,
    label: 'Workflow',
  },
  readme: {
    color: '#607d8b',
    icon: <Book fontSize="small" />,
    label: 'Readme',
  },
};

function WorkflowNode({ data, selected, type }: { data: WorkflowNodeData; selected?: boolean; type: string }) {
  const config = NODE_TYPE_CONFIG[type] || NODE_TYPE_CONFIG.action;

  const isReadme = type === 'readme';

  return (
    <Paper
      elevation={selected ? 4 : 1}
      sx={{
        minWidth: isReadme ? 280 : 160,
        maxWidth: isReadme ? 420 : 280,
        borderLeft: 4,
        borderColor: config.color,
        borderRadius: 1,
        bgcolor: isReadme ? 'rgba(96, 125, 139, 0.08)' : 'background.paper',
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.75,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ color: config.color, display: 'flex', alignItems: 'center' }}>
          {config.icon}
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: config.color,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.65rem',
          }}
        >
          {config.label}
        </Typography>
      </Box>

      {/* Body */}
      <Box sx={{ px: 1.5, py: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            fontSize: '0.85rem',
            lineHeight: 1.3,
            wordBreak: 'break-word',
          }}
        >
          {data.title || 'Untitled'}
        </Typography>
        {data.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.5,
              display: 'block',
              lineHeight: 1.3,
              wordBreak: 'break-word',
            }}
          >
            {data.description}
          </Typography>
        )}
      </Box>

      {/* Connection handles — readme nodes have no handles */}
      {!isReadme && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            style={{
              width: 8,
              height: 8,
              background: config.color,
              border: '2px solid white',
            }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            style={{
              width: 8,
              height: 8,
              background: config.color,
              border: '2px solid white',
            }}
          />
        </>
      )}
    </Paper>
  );
}

export default memo(WorkflowNode);

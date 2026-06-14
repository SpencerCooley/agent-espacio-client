'use client';

import { useCallback } from 'react';
import { Box, Typography, Paper, Chip, Divider, TextField, Select, MenuItem, FormControl } from '@mui/material';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';

export interface WorkflowNodeData {
  title: string;
  description?: string;
  prompt?: string;
  code?: string;
  linked_item_id?: string;
  linked_item_type?: string;
  parameters?: Record<string, unknown>;
}

export interface WorkflowNodePanelProps {
  node: {
    id: string;
    type: string;
    data: WorkflowNodeData;
    position: { x: number; y: number };
  } | null;
  onUpdate: (updates: Partial<WorkflowNodeData> & { type?: string }) => void;
}

const TYPE_CHIP_COLORS: Record<string, string> = {
  action: '#1976d2',
  ai_action: '#7c4dff',
  human_in_loop: '#ff9800',
  espacio_action: '#4caf50',
  decision: '#f44336',
  code: '#607d8b',
  data_reference: '#795548',
  workflow_reference: '#009688',
  readme: '#607d8b',
};

const TYPE_LABELS: Record<string, string> = {
  action: 'Action',
  ai_action: 'AI Action',
  human_in_loop: 'Human Review',
  espacio_action: 'Espacio Action',
  decision: 'Decision',
  code: 'Code',
  data_reference: 'Data Reference',
  workflow_reference: 'Workflow Reference',
  readme: 'Readme',
};

const NODE_TYPES = [
  { value: 'action', label: 'Action' },
  { value: 'ai_action', label: 'AI Action' },
  { value: 'human_in_loop', label: 'Human Review' },
  { value: 'espacio_action', label: 'Espacio Action' },
  { value: 'decision', label: 'Decision' },
  { value: 'code', label: 'Code' },
  { value: 'data_reference', label: 'Data Reference' },
  { value: 'workflow_reference', label: 'Workflow Reference' },
  { value: 'readme', label: 'Readme' },
];

export default function WorkflowNodePanel({ node, onUpdate }: WorkflowNodePanelProps) {
  if (!node) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Select a node to edit its details
        </Typography>
      </Box>
    );
  }

  const data = node.data;
  const typeColor = TYPE_CHIP_COLORS[node.type] || '#757575';
  const typeLabel = TYPE_LABELS[node.type] || node.type;
  const parametersJson = data.parameters ? JSON.stringify(data.parameters, null, 2) : '{}';

  const highlightCode = useCallback((code: string) => {
    return Prism.highlight(code, Prism.languages.bash, 'bash');
  }, []);

  const highlightJson = useCallback((code: string) => {
    return Prism.highlight(code, Prism.languages.json, 'json');
  }, []);

  return (
    <Box sx={{ p: 2.5, pb: 4 }}>
      {/* Type Chip */}
      <Box sx={{ mb: 2 }}>
        <Chip
          label={typeLabel}
          size="small"
          sx={{
            bgcolor: typeColor,
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        />
      </Box>

      {/* Type Selector */}
      <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
        <Select
          value={node.type}
          onChange={(e) => onUpdate({ type: e.target.value })}
          variant="outlined"
          sx={{ fontSize: '0.85rem' }}
        >
          {NODE_TYPES.map((t) => (
            <MenuItem key={t.value} value={t.value} sx={{ fontSize: '0.85rem' }}>
              {t.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Title */}
      <EditableCard label="Title" defaultOpen={true}>
        <TextField
          value={data.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          fullWidth
          variant="standard"
          placeholder="Node title"
          sx={{
            '& .MuiInputBase-root': {
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'text.primary',
            },
            '& .MuiInputBase-input': {
              px: 0,
              py: 0.5,
            },
            '& .MuiInput-underline:before': { borderBottom: '1px solid transparent' },
            '& .MuiInput-underline:hover:before': { borderBottom: '1px solid rgba(0,0,0,0.15)' },
            '& .MuiInput-underline:after': { borderBottom: '2px solid', borderColor: typeColor },
          }}
        />
      </EditableCard>

      {/* Description */}
      <EditableCard label="Description">
        <TextField
          value={data.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          fullWidth
          multiline
          minRows={2}
          maxRows={12}
          variant="standard"
          placeholder="Describe what this node does..."
          sx={{
            '& .MuiInputBase-root': {
              fontSize: '0.85rem',
              lineHeight: 1.7,
              color: 'text.primary',
              alignItems: 'flex-start',
            },
            '& .MuiInputBase-input': {
              px: 0,
              py: 0.5,
              whiteSpace: 'pre-wrap',
            },
            '& .MuiInput-underline:before': { borderBottom: '1px solid transparent' },
            '& .MuiInput-underline:hover:before': { borderBottom: '1px solid rgba(0,0,0,0.15)' },
            '& .MuiInput-underline:after': { borderBottom: '2px solid', borderColor: typeColor },
          }}
        />
      </EditableCard>

      {/* Prompt (for AI Action) */}
      {node.type === 'ai_action' && (
        <EditableCard label="AI Prompt">
          <TextField
            value={data.prompt || ''}
            onChange={(e) => onUpdate({ prompt: e.target.value })}
            fullWidth
            multiline
            minRows={3}
            maxRows={20}
            variant="standard"
            placeholder="Enter the AI prompt..."
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '0.85rem',
                lineHeight: 1.7,
                color: 'text.primary',
                fontStyle: 'italic',
                alignItems: 'flex-start',
              },
              '& .MuiInputBase-input': {
                px: 0,
                py: 0.5,
                whiteSpace: 'pre-wrap',
              },
              '& .MuiInput-underline:before': { borderBottom: '1px solid transparent' },
              '& .MuiInput-underline:hover:before': { borderBottom: '1px solid rgba(0,0,0,0.15)' },
              '& .MuiInput-underline:after': { borderBottom: '2px solid', borderColor: typeColor },
            }}
          />
        </EditableCard>
      )}

      {/* Code (shown for all nodes that have code) */}
      {data.code && (
        <EditableCard label="Implementation">
          <Box
            sx={{
              bgcolor: '#1e1e1e',
              borderRadius: 1,
              overflow: 'hidden',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              '& pre': { margin: 0 },
              '& textarea': { outline: 'none' },
              '& .token.comment': { color: '#6a9955' },
              '& .token.string': { color: '#ce9178' },
              '& .token.number': { color: '#b5cea8' },
              '& .token.keyword': { color: '#569cd6' },
              '& .token.function': { color: '#dcdcaa' },
              '& .token.operator': { color: '#d4d4d4' },
              '& .token.variable': { color: '#9cdcfe' },
              '& .token.punctuation': { color: '#d4d4d4' },
              '& .token.parameter': { color: '#9cdcfe' },
              '& .token.builtin': { color: '#dcdcaa' },
              '& .token.property': { color: '#9cdcfe' },
            }}
          >
            <Editor
              value={data.code}
              onValueChange={(code) => onUpdate({ code })}
              highlight={highlightCode}
              padding={12}
              textareaClassName="code-textarea"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                lineHeight: 1.6,
                color: '#d4d4d4',
                minHeight: 80,
              }}
            />
          </Box>
        </EditableCard>
      )}

      {/* Parameters JSON */}
      <EditableCard label="Parameters (JSON)">
        <Box
          sx={{
            bgcolor: '#1e1e1e',
            borderRadius: 1,
            overflow: 'hidden',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            lineHeight: 1.6,
              '& pre': { margin: 0 },
              '& textarea': { outline: 'none' },
              '& .token.string': { color: '#ce9178' },
              '& .token.number': { color: '#b5cea8' },
              '& .token.boolean': { color: '#569cd6' },
              '& .token.null': { color: '#569cd6' },
              '& .token.property': { color: '#9cdcfe' },
              '& .token.punctuation': { color: '#d4d4d4' },
              '& .token.operator': { color: '#d4d4d4' },
          }}
        >
          <Editor
            value={parametersJson}
            onValueChange={(code) => {
              try {
                const parsed = JSON.parse(code);
                onUpdate({ parameters: parsed });
              } catch {
                // Invalid JSON, don't update
              }
            }}
            highlight={highlightJson}
            padding={12}
            textareaClassName="code-textarea"
            style={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              color: '#d4d4d4',
              minHeight: 80,
            }}
          />
        </Box>
      </EditableCard>

      <Divider sx={{ my: 2.5 }} />

      {/* Metadata */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block">
          Node ID: {node.id}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Position: x={node.position.x.toFixed(0)}, y={node.position.y.toFixed(0)}
        </Typography>
      </Paper>
    </Box>
  );
}

function EditableCard({ label, children, defaultOpen }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 2,
        overflow: 'hidden',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'action.hover',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'text.secondary',
            fontSize: '0.7rem',
          }}
        >
          {label}
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1.5 }}>
        {children}
      </Box>
    </Paper>
  );
}

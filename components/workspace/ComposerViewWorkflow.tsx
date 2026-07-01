'use client';

import React, { useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Button, Typography, Paper } from '@mui/material';
import { OpenInNew as OpenInNewIcon, AccountTree as AccountTreeIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import WorkflowNode from './WorkflowNode';

const nodeTypes = {
  action: WorkflowNode,
  ai_action: WorkflowNode,
  human_in_loop: WorkflowNode,
  espacio_action: WorkflowNode,
  decision: WorkflowNode,
  code: WorkflowNode,
  data_reference: WorkflowNode,
  workflow_reference: WorkflowNode,
  readme: WorkflowNode,
};

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

interface ComposerViewWorkflowProps {
  content: any;
  name: string;
  publicMagicId?: string;
  isPreview?: boolean;
  isPublicView?: boolean;
  themeMode?: 'light' | 'dark';
}

function ComposerViewWorkflowInner({
  content,
  name,
  publicMagicId,
  isPreview,
  themeMode,
}: ComposerViewWorkflowProps) {
  const initialNodes = useMemo<Node[]>(() => {
    return (content?.nodes || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
    }));
  }, [content?.nodes]);

  const initialEdges = useMemo<Edge[]>(() => {
    return (content?.edges || []).map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      sourceHandle: e.sourceHandle,
    }));
  }, [content?.edges]);

  const viewUrl = publicMagicId
    ? `/public/view/${publicMagicId}`
    : (isPreview ? window.location.pathname.replace('/preview', '') : undefined);

  const [copied, setCopied] = useState(false);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(content, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore copy errors
    }
  };

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          borderRadius: 1,
        }}
      >
        <AccountTreeIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {name}
          </Typography>
        </Box>
      </Paper>

      {initialNodes.length > 0 && (
        <Box
          sx={{
            width: '100%',
            height: 300,
            borderRadius: 1,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <ReactFlow
            nodes={initialNodes}
            edges={initialEdges}
            nodeTypes={nodeTypes}
            defaultViewport={content?.viewport || { x: 0, y: 0, zoom: 0.8 }}
            colorMode={themeMode === 'dark' ? 'dark' : 'light'}
            // Pan and zoom enabled, but no editing
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={true}
            fitView={true}
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} size={1} />
          </ReactFlow>
        </Box>
      )}

      {viewUrl && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button
            size="small"
            startIcon={<CopyIcon />}
            onClick={handleCopyJson}
            variant="outlined"
          >
            {copied ? 'Copied!' : 'Copy JSON'}
          </Button>
          <Button
            size="small"
            endIcon={<OpenInNewIcon />}
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
          >
            View Full Workflow
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default function ComposerViewWorkflow(props: ComposerViewWorkflowProps) {
  return (
    <ReactFlowProvider>
      <ComposerViewWorkflowInner {...props} />
    </ReactFlowProvider>
  );
}

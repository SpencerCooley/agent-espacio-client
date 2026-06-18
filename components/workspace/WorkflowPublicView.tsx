'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Typography, Paper, Button, ToggleButton, ToggleButtonGroup, Chip, Divider } from '@mui/material';
import { Visibility, Code, ContentCopy, CheckCircle, Close } from '@mui/icons-material';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import WorkflowNode from './WorkflowNode';
import { useThemeContext } from '../../context/ThemeContext';

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

interface WorkflowPublicViewProps {
  content: {
    nodes?: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: {
        title: string;
        description?: string;
        prompt?: string;
        code?: string;
        linked_item_id?: string;
        linked_item_type?: string;
        parameters?: Record<string, unknown>;
      };
    }>;
    edges?: Array<{
      id: string;
      source: string;
      target: string;
      label?: string;
      sourceHandle?: string;
    }>;
    viewport?: { x: number; y: number; zoom: number };
  };
  name: string;
  description?: string;
  themeMode?: 'light' | 'dark';
}

function WorkflowPublicViewInner({
  content,
  name,
  description,
  themeMode,
  viewMode,
  setViewMode,
  jsonString,
  highlightedJson,
  handleCopy,
  copied,
  selectedNode,
  setSelectedNode,
}: {
  content: WorkflowPublicViewProps['content'];
  name: string;
  description?: string;
  themeMode: string;
  viewMode: 'visual' | 'json';
  setViewMode: (v: 'visual' | 'json') => void;
  jsonString: string;
  highlightedJson: string;
  handleCopy: () => void;
  copied: boolean;
  selectedNode: any;
  setSelectedNode: (n: any) => void;
}) {
  const initialNodes = useMemo<Node[]>(() => (content?.nodes || []).map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  })), [content?.nodes]);

  const initialEdges = useMemo<Edge[]>(() => (content?.edges || []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    sourceHandle: e.sourceHandle,
  })), [content?.edges]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {name}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, value) => value && setViewMode(value)}
          size="small"
        >
          <ToggleButton value="visual">
            <Visibility sx={{ mr: 0.5, fontSize: 18 }} />
            Visual
          </ToggleButton>
          <ToggleButton value="json">
            <Code sx={{ mr: 0.5, fontSize: 18 }} />
            JSON
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {viewMode === 'visual' ? (
          <>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                defaultViewport={content?.viewport || { x: 0, y: 0, zoom: 1 }}
                colorMode={themeMode === 'dark' ? 'dark' : 'light'}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
              >
                <Background gap={16} size={1} />
                <Controls
                  style={{
                    backgroundColor: themeMode === 'dark' ? '#1e1e1e' : '#fff',
                    borderColor: themeMode === 'dark' ? '#444' : '#e0e0e0',
                  }}
                />
                <MiniMap
                  style={{
                    height: 100,
                    width: 150,
                    bottom: 10,
                    right: 10,
                    backgroundColor: themeMode === 'dark' ? '#1e1e1e' : '#fff',
                    border: `1px solid ${themeMode === 'dark' ? '#444' : '#e0e0e0'}`,
                  }}
                  nodeColor={themeMode === 'dark' ? '#607d8b' : '#1976d2'}
                  nodeStrokeColor={themeMode === 'dark' ? '#fff' : '#333'}
                  maskColor={themeMode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)'}
                />
              </ReactFlow>
            </Box>

            {/* Read-only Node Details Panel */}
            {selectedNode && (
              <Box
                sx={{
                  width: 340,
                  flexShrink: 0,
                  borderLeft: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                <Box sx={{ p: 2.5, pb: 4 }}>
                  {/* Close button */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                    <Button
                      size="small"
                      onClick={() => setSelectedNode(null)}
                      startIcon={<Close />}
                      sx={{ minWidth: 0, px: 1 }}
                    >
                      Close
                    </Button>
                  </Box>

                  {/* Type Chip */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={TYPE_LABELS[selectedNode.type] || selectedNode.type}
                      size="small"
                      sx={{
                        bgcolor: TYPE_CHIP_COLORS[selectedNode.type] || '#757575',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    />
                  </Box>

                  {/* Title */}
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, lineHeight: 1.3, wordBreak: 'break-word', mb: 2 }}
                  >
                    {selectedNode.data?.title || 'Untitled'}
                  </Typography>

                  {/* Description */}
                  {selectedNode.data?.description && (
                    <ContentCard label="Description">
                      <Typography
                        variant="body2"
                        sx={{
                          lineHeight: 1.7,
                          color: 'text.primary',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {selectedNode.data.description}
                      </Typography>
                    </ContentCard>
                  )}

                  {/* Prompt */}
                  {selectedNode.type === 'ai_action' && selectedNode.data?.prompt && (
                    <ContentCard label="AI Prompt">
                      <Typography
                        variant="body2"
                        sx={{
                          lineHeight: 1.7,
                          color: 'text.primary',
                          fontStyle: 'italic',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {selectedNode.data.prompt}
                      </Typography>
                    </ContentCard>
                  )}

                  {/* Code */}
                  {selectedNode.data?.code && (
                    <ContentCard label="Implementation">
                      <Box
                        sx={{
                          bgcolor: '#1e1e1e',
                          borderRadius: 1,
                          p: 1.5,
                          overflow: 'auto',
                        }}
                      >
                        <Box
                          component="pre"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            lineHeight: 1.6,
                            color: '#d4d4d4',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            m: 0,
                          }}
                        >
                          {selectedNode.data.code}
                        </Box>
                      </Box>
                    </ContentCard>
                  )}

                  {/* Parameters */}
                  {selectedNode.data?.parameters && Object.keys(selectedNode.data.parameters).length > 0 && (
                    <ContentCard label="Parameters">
                      <Box
                        sx={{
                          bgcolor: '#1e1e1e',
                          borderRadius: 1,
                          p: 1.5,
                          overflow: 'auto',
                        }}
                      >
                        <Box
                          component="pre"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            lineHeight: 1.6,
                            color: '#d4d4d4',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            m: 0,
                          }}
                        >
                          {JSON.stringify(selectedNode.data.parameters, null, 2)}
                        </Box>
                      </Box>
                    </ContentCard>
                  )}

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
                      Node ID: {selectedNode.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Position: x={selectedNode.position?.x?.toFixed(0) || 0}, y={selectedNode.position?.y?.toFixed(0) || 0}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ p: 3, height: '100%', overflow: 'auto', flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={handleCopy}
                startIcon={copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                color={copied ? 'success' : 'primary'}
              >
                {copied ? 'Copied' : 'Copy JSON'}
              </Button>
            </Box>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: '#1e1e1e',
                color: '#d4d4d4',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                '& .token.string': { color: '#ce9178' },
                '& .token.number': { color: '#b5cea8' },
                '& .token.boolean': { color: '#569cd6' },
                '& .token.null': { color: '#569cd6' },
                '& .token.property': { color: '#9cdcfe' },
                '& .token.punctuation': { color: '#d4d4d4' },
                '& .token.operator': { color: '#d4d4d4' },
              }}
            >
              <Box
                component="pre"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  margin: 0,
                  color: '#d4d4d4',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  overflowWrap: 'break-word',
                }}
                dangerouslySetInnerHTML={{ __html: highlightedJson }}
              />
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function WorkflowPublicView({ content, name, description, themeMode: themeModeProp }: WorkflowPublicViewProps) {
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [copied, setCopied] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const { mode: contextThemeMode } = useThemeContext();
  // Use prop if provided (for public views), otherwise fall back to global context
  const themeMode = themeModeProp || contextThemeMode;

  const jsonString = useMemo(() => JSON.stringify(content, null, 2), [content]);
  const highlightedJson = useMemo(() => {
    return Prism.highlight(jsonString, Prism.languages.json, 'json');
  }, [jsonString]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = jsonString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ReactFlowProvider>
      <WorkflowPublicViewInner
        content={content}
        name={name}
        description={description}
        themeMode={themeMode}
        viewMode={viewMode}
        setViewMode={setViewMode}
        jsonString={jsonString}
        highlightedJson={highlightedJson}
        handleCopy={handleCopy}
        copied={copied}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
      />
    </ReactFlowProvider>
  );
}

function ContentCard({ label, children }: { label: string; children: React.ReactNode }) {
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
      <Box sx={{ p: 2 }}>
        {children}
      </Box>
    </Paper>
  );
}

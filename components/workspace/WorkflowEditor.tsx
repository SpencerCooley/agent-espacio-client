'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Button, Typography, Paper, TextField } from '@mui/material';
import { Add, Delete, Undo, Redo } from '@mui/icons-material';
import WorkflowNode from './WorkflowNode';
import WorkflowNodePanel from './WorkflowNodePanel';
import { artifactService } from '../../services/artifacts';
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

interface WorkflowNodeData {
  title: string;
  description?: string;
  prompt?: string;
  code?: string;
  linked_item_id?: string;
  linked_item_type?: string;
  parameters?: Record<string, unknown>;
}

interface WorkflowEditorProps {
  artifact: {
    id: string;
    name: string;
    content: {
      nodes?: Array<{
        id: string;
        type: string;
        position: { x: number; y: number };
        data: WorkflowNodeData;
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
  };
}

function WorkflowEditorInner({ artifact }: WorkflowEditorProps) {
  const getId = (existingNodes: any[]) => {
    const maxId = existingNodes.reduce((max, n) => {
      const match = n.id?.match(/node-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    return `node-${maxId + 1}`;
  };
  const { screenToFlowPosition } = useReactFlow();
  const { mode: themeMode } = useThemeContext();
  const [saving, setSaving] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef<string>('');

  // Initialize from artifact content
  const initialNodes = artifact.content?.nodes || [];
  const initialEdges = artifact.content?.edges || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as any);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [name, setName] = useState(artifact.name);
  const lastSavedName = useRef(artifact.name);

  const viewportRef = useRef(artifact.content?.viewport || { x: 0, y: 0, zoom: 1 });
  const hasRestoredViewport = useRef(false);

  // Undo history
  const HISTORY_LIMIT = 5; // stores current + last 4 states
  const historyRef = useRef<{ nodes: any[]; edges: any[] }[]>([]);
  const historyIndexRef = useRef(0);
  const isUndoingRef = useRef(false);
  const isFirstRenderRef = useRef(true);
  const isDraggingRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateUndoRedoState = () => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  };

  const pushHistory = useCallback((currentNodes: any[], currentEdges: any[]) => {
    if (isUndoingRef.current) return;

    const currentState = historyRef.current[historyIndexRef.current];
    if (currentState) {
      const sameNodes = currentNodes.length === currentState.nodes.length &&
        currentNodes.every((n, i) => {
          const prev = currentState.nodes[i];
          return (
            n.id === prev.id &&
            n.type === prev.type &&
            Math.abs(n.position.x - prev.position.x) < 1 &&
            Math.abs(n.position.y - prev.position.y) < 1 &&
            JSON.stringify(n.data) === JSON.stringify(prev.data)
          );
        });
      const sameEdges = currentEdges.length === currentState.edges.length &&
        currentEdges.every((e, i) => {
          const prev = currentState.edges[i];
          return (
            e.id === prev.id &&
            e.source === prev.source &&
            e.target === prev.target &&
            e.label === prev.label &&
            e.sourceHandle === prev.sourceHandle
          );
        });
      if (sameNodes && sameEdges) return;
    }

    // Truncate future history if we're not at the end
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }

    historyRef.current.push({
      nodes: currentNodes.map((n) => ({ ...n })),
      edges: currentEdges.map((e) => ({ ...e })),
    });

    historyIndexRef.current++;
    if (historyRef.current.length > HISTORY_LIMIT) {
      historyRef.current.shift();
      historyIndexRef.current = Math.max(0, historyIndexRef.current - 1);
    }

    updateUndoRedoState();
  }, []);

  const handleSave = useCallback(
    async (currentNodes: any[], currentEdges: any[], currentViewport?: { x: number; y: number; zoom: number }) => {
      const content = {
        nodes: currentNodes.map((n: any) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
        edges: currentEdges.map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          sourceHandle: e.sourceHandle,
        })),
        viewport: currentViewport || viewportRef.current,
      };

      const jsonStr = JSON.stringify(content);
      if (jsonStr === lastSavedContent.current) return;

      setSaving(true);
      try {
        await artifactService.updateArtifact(artifact.id, { content });
        lastSavedContent.current = jsonStr;
      } catch (err: any) {
        console.error('Failed to save workflow:', err);
      } finally {
        setSaving(false);
      }
    },
    [artifact.id]
  );

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (nameSaveTimer.current) clearTimeout(nameSaveTimer.current);
    nameSaveTimer.current = setTimeout(() => {
      if (newName !== lastSavedName.current) {
        artifactService.updateArtifact(artifact.id, { name: newName })
          .then(() => { lastSavedName.current = newName; })
          .catch((err: any) => console.error('Failed to save name:', err));
      }
    }, 1500);
  };

  const handleNameBlur = () => {
    if (nameSaveTimer.current) clearTimeout(nameSaveTimer.current);
    if (name !== lastSavedName.current) {
      artifactService.updateArtifact(artifact.id, { name })
        .then(() => { lastSavedName.current = name; })
        .catch((err: any) => console.error('Failed to save name:', err));
    }
  };

  useEffect(() => {
    return () => {
      if (nameSaveTimer.current) clearTimeout(nameSaveTimer.current);
    };
  }, []);

  const triggerSave = useCallback(
    (currentNodes: any[], currentEdges: any[], currentViewport?: { x: number; y: number; zoom: number }) => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = setTimeout(() => {
        handleSave(currentNodes, currentEdges, currentViewport);
      }, 1500);
    },
    [handleSave]
  );

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    isUndoingRef.current = true;
    historyIndexRef.current--;
    const state = historyRef.current[historyIndexRef.current];
    setNodes(state.nodes);
    setEdges(state.edges);
    setSelectedNode(null);
    triggerSave(state.nodes, state.edges);
    updateUndoRedoState();
  }, [setNodes, setEdges, triggerSave]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    isUndoingRef.current = true;
    historyIndexRef.current++;
    const state = historyRef.current[historyIndexRef.current];
    setNodes(state.nodes);
    setEdges(state.edges);
    setSelectedNode(null);
    triggerSave(state.nodes, state.edges);
    updateUndoRedoState();
  }, [setNodes, setEdges, triggerSave]);

  // Initialize history with initial state
  useEffect(() => {
    historyRef.current = [{
      nodes: initialNodes.map((n) => ({ ...n })),
      edges: initialEdges.map((e) => ({ ...e })),
    }];
    historyIndexRef.current = 0;
    isFirstRenderRef.current = false;
    updateUndoRedoState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch for structural changes (node/edge add/remove) and push to history
  useEffect(() => {
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      return;
    }
    if (isDraggingRef.current) return;
    pushHistory(nodes, edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  const onViewportChange = useCallback(
    (viewport: { x: number; y: number; zoom: number }) => {
      viewportRef.current = viewport;
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        handleSave(nodes, edges, viewport);
      }, 1500);
    },
    [nodes, edges, handleSave]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds: any[]) => {
        const newEdges = addEdge(connection, eds);
        triggerSave(nodes, newEdges);
        return newEdges;
      });
    },
    [nodes, setEdges, triggerSave]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      setSelectedNode(node);
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onAddNode = useCallback(
    (type: string) => {
      setNodes((nds: any[]) => {
        const id = getId(nds);
        const newNode = {
          id,
          type,
          position: screenToFlowPosition({
            x: window.innerWidth / 2 - 200,
            y: window.innerHeight / 2 - 100,
          }),
          data: {
            title: type === 'readme' ? 'Readme' : 'New Node',
            description: '',
            parameters: {},
          },
        };
        const newNodes = [...nds, newNode];
        triggerSave(newNodes, edges);
        return newNodes;
      });
    },
    [screenToFlowPosition, setNodes, edges, triggerSave]
  );

  const onDeleteNode = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nds: any[]) => {
      const newNodes = nds.filter((n: any) => n.id !== selectedNode.id);
      // Also remove connected edges
      setEdges((eds: any[]) => {
        const newEdges = eds.filter(
          (e: any) => e.source !== selectedNode.id && e.target !== selectedNode.id
        );
        triggerSave(newNodes, newEdges);
        return newEdges;
      });
      return newNodes;
    });
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges, triggerSave]);

  const onUpdateNode = useCallback(
    (updates: Record<string, unknown>) => {
      if (!selectedNode) return;

      setNodes((nds: any[]) => {
        const newNodes = nds.map((n: any) => {
          if (n.id === selectedNode.id) {
            const updated = {
              ...n,
              data: { ...n.data, ...updates },
            };
            // Update selectedNode reference
            setSelectedNode(updated);
            return updated;
          }
          return n;
        });
        triggerSave(newNodes, edges);
        return newNodes;
      });
    },
    [selectedNode, setNodes, edges, triggerSave]
  );

  const onNodesChangeWrapped = useCallback(
    (changes: any[]) => {
      onNodesChange(changes);
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        handleSave(nodes, edges, viewportRef.current);
      }, 1500);
    },
    [onNodesChange, nodes, edges, handleSave]
  );

  const onEdgesChangeWrapped = useCallback(
    (changes: any[]) => {
      onEdgesChange(changes);
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        handleSave(nodes, edges, viewportRef.current);
      }, 1500);
    },
    [onEdgesChange, nodes, edges, handleSave]
  );

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box sx={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWrapped}
          onEdgesChange={onEdgesChangeWrapped}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onViewportChange={onViewportChange}
          onNodeDragStart={() => { isDraggingRef.current = true; }}
          onNodeDragStop={(_, node) => {
            isDraggingRef.current = false;
            pushHistory(nodes, edges);
          }}
          nodeTypes={nodeTypes}
          defaultViewport={viewportRef.current}
          colorMode={themeMode === 'dark' ? 'dark' : 'light'}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Shift', 'Control']}
        >
          <Background
            gap={16}
            size={1}
            style={{
              backgroundColor: themeMode === 'dark' ? 'transparent' : undefined,
            }}
          />
          <Controls
            style={{
              backgroundColor: themeMode === 'dark' ? '#1e1e1e' : '#fff',
              borderColor: themeMode === 'dark' ? '#444' : '#e0e0e0',
            }}
            buttonStyle={{
              backgroundColor: themeMode === 'dark' ? '#1e1e1e' : '#fff',
              color: themeMode === 'dark' ? '#fff' : '#333',
              borderColor: themeMode === 'dark' ? '#444' : '#e0e0e0',
            }}
            buttonHoverStyle={{
              backgroundColor: themeMode === 'dark' ? '#333' : '#f5f5f5',
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
          <Panel position="top-left">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 400 }}>
              {/* Name editor */}
              <TextField
                variant="outlined"
                size="small"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Untitled Workflow"
                sx={{
                  bgcolor: 'background.paper',
                  '& .MuiInputBase-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
              {/* Toolbar */}
              <Paper
                elevation={2}
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  p: 0.5,
                  flexWrap: 'wrap',
                }}
              >
              <Button
                size="small"
                variant="outlined"
                startIcon={<Add />}
                onClick={() => onAddNode('action')}
                sx={{ fontSize: '0.75rem' }}
              >
                Action
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Add />}
                onClick={() => onAddNode('ai_action')}
                sx={{ fontSize: '0.75rem' }}
              >
                AI
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Add />}
                onClick={() => onAddNode('human_in_loop')}
                sx={{ fontSize: '0.75rem' }}
              >
                Human
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Add />}
                onClick={() => onAddNode('decision')}
                sx={{ fontSize: '0.75rem' }}
              >
                Decision
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Add />}
                onClick={() => onAddNode('espacio_action')}
                sx={{ fontSize: '0.75rem' }}
              >
                Espacio
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Add />}
                onClick={() => onAddNode('readme')}
                sx={{ fontSize: '0.75rem' }}
              >
                Readme
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Undo />}
                onClick={handleUndo}
                disabled={!canUndo}
                sx={{ fontSize: '0.75rem' }}
              >
                Undo
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Redo />}
                onClick={handleRedo}
                disabled={!canRedo}
                sx={{ fontSize: '0.75rem' }}
              >
                Redo
              </Button>
              {selectedNode && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={onDeleteNode}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Delete
                </Button>
              )}
            </Paper>
            </Box>
          </Panel>
          <Panel position="top-right">
            <Typography variant="caption" color="text.secondary">
              {saving ? 'Saving...' : 'Saved'}
            </Typography>
          </Panel>
        </ReactFlow>
      </Box>

      {/* Right Panel */}
      <Box
        sx={{
          width: 320,
          flexShrink: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          borderLeft: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        <WorkflowNodePanel
          node={
            selectedNode
              ? {
                  id: selectedNode.id,
                  type: selectedNode.type || 'action',
                  data: selectedNode.data,
                  position: selectedNode.position,
                }
              : null
          }
          onUpdate={onUpdateNode}
        />
      </Box>
    </Box>
  );
}

export default function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner {...props} />
    </ReactFlowProvider>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Button,
  TextField,
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  ContentCopy as CopyIcon,
  ArrowBack as BackIcon,
  Terminal as TerminalIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { Artifact, artifactService } from '../../services/artifacts';
import { repoService, RepoMetadata, RepoTreeItem, RepoCommit, RepoCommitDetail } from '../../services/repos';
import CodeBlock from './CodeBlock';
import DiffViewer from './DiffViewer';

interface RepoViewerProps {
  artifact: Artifact;
}

export default function RepoViewer({ artifact }: RepoViewerProps) {
  const [name, setName] = useState(artifact.name);
  const lastSavedName = useRef(artifact.name);
  const nameSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [description, setDescription] = useState(artifact.description || '');
  const lastSavedDescription = useRef(artifact.description || '');
  const descriptionSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [metadata, setMetadata] = useState<RepoMetadata | null>(null);
  const [treeItems, setTreeItems] = useState<RepoTreeItem[]>([]);
  const [currentPath, setCurrentPath] = useState(
    decodeURIComponent(window.location.hash.slice(1) || '')
  );
  const navigatingFromPopState = useRef(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [commits, setCommits] = useState<RepoCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'files' | 'history' | 'commit'>('files');
  const [selectedCommit, setSelectedCommit] = useState<RepoCommitDetail | null>(null);
  const [commitLoading, setCommitLoading] = useState(false);

  const artifactId = artifact.id;

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (nameSaveTimer.current) clearTimeout(nameSaveTimer.current);
    nameSaveTimer.current = setTimeout(() => {
      if (newName !== lastSavedName.current) {
        artifactService.updateArtifact(artifact.id, { name: newName })
          .then(() => { lastSavedName.current = newName; })
          .catch((err) => console.error('Failed to save name:', err));
      }
    }, 1500);
  };

  const handleNameBlur = () => {
    if (nameSaveTimer.current) clearTimeout(nameSaveTimer.current);
    if (name !== lastSavedName.current) {
      artifactService.updateArtifact(artifact.id, { name })
        .then(() => { lastSavedName.current = name; })
        .catch((err) => console.error('Failed to save name:', err));
    }
  };

  const handleDescriptionChange = (newDesc: string) => {
    setDescription(newDesc);
    if (descriptionSaveTimer.current) clearTimeout(descriptionSaveTimer.current);
    descriptionSaveTimer.current = setTimeout(() => {
      if (newDesc !== lastSavedDescription.current) {
        artifactService.updateArtifact(artifact.id, { description: newDesc })
          .then(() => { lastSavedDescription.current = newDesc; })
          .catch((err) => console.error('Failed to save description:', err));
      }
    }, 1500);
  };

  const handleDescriptionBlur = () => {
    if (descriptionSaveTimer.current) clearTimeout(descriptionSaveTimer.current);
    if (description !== lastSavedDescription.current) {
      artifactService.updateArtifact(artifact.id, { description })
        .then(() => { lastSavedDescription.current = description; })
        .catch((err) => console.error('Failed to save description:', err));
    }
  };

  // Load metadata on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    const hashPath = decodeURIComponent(window.location.hash.slice(1) || '');

    repoService.getMetadata(artifactId)
      .then((data) => {
        setMetadata(data);
        return repoService.getTree(artifactId, 'HEAD', hashPath || undefined);
      })
      .then((tree) => {
        setTreeItems(tree.items);
        setCurrentPath(hashPath);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load repository');
        setLoading(false);
      });
  }, [artifactId]);

  // Load commits
  useEffect(() => {
    repoService.getCommits(artifactId)
      .then((data) => setCommits(data.commits))
      .catch(() => {}); // Non-critical
  }, [artifactId]);

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      navigatingFromPopState.current = true;
      const state = history.state as { path?: string; file?: string } | null;
      const hashPath = decodeURIComponent(window.location.hash.slice(1) || '');
      const targetPath = state?.path || hashPath;

      if (state?.file) {
        setCurrentPath(targetPath);
        setFileContent(null);
        setLoading(true);
        Promise.all([
          repoService.getTree(artifactId, 'HEAD', targetPath || undefined),
          repoService.getFile(artifactId, state.file),
        ])
          .then(([tree, file]) => {
            setTreeItems(tree.items);
            setFileContent(file.content);
            setFileName(file.path);
            setLoading(false);
            navigatingFromPopState.current = false;
          })
          .catch((err) => {
            setError(err.message || 'Failed to load');
            setLoading(false);
            navigatingFromPopState.current = false;
          });
      } else {
        setCurrentPath(targetPath);
        setFileContent(null);
        setLoading(true);
        repoService.getTree(artifactId, 'HEAD', targetPath || undefined)
          .then((tree) => {
            setTreeItems(tree.items);
            setLoading(false);
            navigatingFromPopState.current = false;
          })
          .catch((err) => {
            setError(err.message || 'Failed to load directory');
            setLoading(false);
            navigatingFromPopState.current = false;
          });
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [artifactId]);

  const handleNavigate = (item: RepoTreeItem) => {
    if (item.type === 'tree') {
      setFileContent(null);
      setLoading(true);
      if (!navigatingFromPopState.current) {
        window.history.pushState({ path: item.path }, '', `#${item.path}`);
      }
      repoService.getTree(artifactId, 'HEAD', item.path)
        .then((tree) => {
          setTreeItems(tree.items);
          setCurrentPath(item.path);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load directory');
          setLoading(false);
        });
    } else {
      if (viewMode !== 'files') setViewMode('files');
      setLoading(true);
      if (!navigatingFromPopState.current) {
        window.history.pushState({ path: currentPath, file: item.path }, '', `#${currentPath}`);
      }
      repoService.getFile(artifactId, item.path)
        .then((file) => {
          setFileContent(file.content);
          setFileName(file.path);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load file');
          setLoading(false);
        });
    }
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const parentPath = currentPath.includes('/')
      ? currentPath.substring(0, currentPath.lastIndexOf('/'))
      : '';
    setFileContent(null);
    setLoading(true);
    if (!navigatingFromPopState.current) {
      window.history.pushState({ path: parentPath }, '', `#${parentPath}`);
    }
    repoService.getTree(artifactId, 'HEAD', parentPath || undefined)
      .then((tree) => {
        setTreeItems(tree.items);
        setCurrentPath(parentPath);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load directory');
        setLoading(false);
      });
  };

  if (loading && !metadata) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !metadata) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <TextField
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={handleNameBlur}
            variant="standard"
            placeholder="Repository name"
            fullWidth
            sx={{
              '& .MuiInput-root': { fontSize: '1.25rem', fontWeight: 600 },
              '& .MuiInput-root::before': { border: 'none' },
              '& .MuiInput-root::after': { border: 'none' },
              '& .MuiInput-root:hover::before': { border: 'none' },
              mr: 2,
            }}
          />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              icon={<TerminalIcon />}
              label="Repository"
              size="small"
              color="primary"
              variant="outlined"
            />
            {metadata?.git_remote_url && (
              <Tooltip title={copied ? 'Copied!' : 'Copy SSH URL'}>
                <IconButton
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(metadata.git_remote_url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        <TextField
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          onBlur={handleDescriptionBlur}
          variant="standard"
          placeholder="Add a description..."
          fullWidth
          multiline
          maxRows={3}
          sx={{
            '& .MuiInput-root': { fontSize: '0.875rem' },
            '& .MuiInput-root::before': { border: 'none' },
            '& .MuiInput-root::after': { border: 'none' },
            '& .MuiInput-root:hover::before': { border: 'none' },
          }}
        />

        {metadata && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {metadata.commit_count} commits · {metadata.file_count} files · {(metadata.repo_size_bytes / 1024).toFixed(1)} KB
            </Typography>
            {metadata.last_commit && (
              <Typography variant="body2" color="text.secondary">
                Last commit: <strong>{metadata.last_commit.hash}</strong> — {metadata.last_commit.message}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar: File tree + commits */}
        <Box
          sx={{
            width: 320,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Breadcrumb / navigation */}
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ fontSize: '0.875rem' }}>
              <Link
                component="button"
                underline="hover"
                color="inherit"
                onClick={handleNavigateUp}
                sx={{ fontSize: '0.875rem', cursor: currentPath ? 'pointer' : 'default' }}
              >
                root
              </Link>
              {currentPath && (
                <Typography color="text.primary" fontSize="0.875rem">
                  {currentPath.split('/').pop()}
                </Typography>
              )}
            </Breadcrumbs>
            {currentPath && (
              <Button
                startIcon={<BackIcon />}
                size="small"
                onClick={handleNavigateUp}
                sx={{ mt: 0.5 }}
              >
                Back
              </Button>
            )}
          </Box>

          {/* File tree */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {treeItems.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  {metadata?.commit_count === 0
                    ? 'Repository is empty. Push code to see files here.'
                    : 'No files in this directory.'}
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding>
                {treeItems.map((item) => (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton onClick={() => handleNavigate(item)} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {item.type === 'tree' ? (
                          <FolderIcon fontSize="small" color="primary" />
                        ) : (
                          <FileIcon fontSize="small" color="action" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.name}
                        secondary={item.size ? `${(item.size / 1024).toFixed(1)} KB` : null}
                        primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          <Divider />

          {/* Commits toolbar + preview */}
          <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ px: 1, py: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, px: 1 }}>
                Recent Commits
              </Typography>
              <Tooltip title={viewMode === 'history' ? 'Show files' : 'Full history'}>
                <IconButton
                  size="small"
                  onClick={() => {
                    if (viewMode === 'history') {
                      setViewMode('files');
                    } else {
                      setViewMode('history');
                      setSelectedCommit(null);
                      setFileContent(null);
                    }
                  }}
                  sx={{ color: viewMode === 'history' ? 'primary.main' : 'text.secondary' }}
                >
                  <HistoryIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
              <Box sx={{ px: 2, pb: 2, maxHeight: 200, overflowY: 'auto' }}>
                {commits.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    No commits yet
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {commits.slice(0, 5).map((commit) => (
                      <Box key={commit.hash}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                          {commit.hash}
                        </Typography>
                        <Typography variant="caption" display="block" noWrap>
                          {commit.message}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

        {/* Main panel: File content, commit history, or commit detail */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {viewMode === 'commit' && selectedCommit ? (
            <DiffViewer commit={selectedCommit} />
          ) : viewMode === 'history' ? (
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {commits.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No commits yet
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {commits.map((commit) => {
                    const date = new Date(commit.date);
                    return (
                      <ListItem key={commit.hash} disablePadding>
                        <ListItemButton
                          onClick={async () => {
                            setCommitLoading(true);
                            try {
                              const detail = await repoService.getCommitDetail(artifactId, commit.hash);
                              setSelectedCommit(detail);
                              setViewMode('commit');
                            } catch (err: any) {
                              console.error('Failed to load commit:', err?.message || err);
                            }
                            setCommitLoading(false);
                          }}
                          sx={{ py: 1.25, px: 2, flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.7rem',
                                color: 'primary.main',
                                bgcolor: 'action.hover',
                                px: 0.75,
                                py: 0.25,
                                borderRadius: 0.5,
                                lineHeight: 1.3,
                              }}
                            >
                              {commit.hash}
                            </Typography>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 500, flex: 1, minWidth: 0 }}>
                              {commit.message}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {commit.author} · {date.toLocaleDateString()} {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>
          ) : fileContent !== null ? (
            <>
              <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="small" onClick={() => setFileContent(null)}>
                  Close
                </Button>
              </Box>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <CodeBlock code={fileContent} filename={fileName} />
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {metadata?.commit_count === 0 ? (
                <>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Repository Setup
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      1. Add your SSH key
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Register your SSH key in Settings, then push code from your machine.
                    </Typography>
                    <Button variant="outlined" size="small" href="/workspace/settings">
                      Go to Settings
                    </Button>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      2. Push code
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        p: 2,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.8125rem',
                        overflow: 'auto',
                      }}
                    >
                      <code>
                        {`git remote add origin ${metadata?.git_remote_url || 'ssh://git@<host>:2222/repos/<id>.git'}\n`}
                        {`git push -u origin master`}
                      </code>
                    </Box>
                  </Paper>
                </>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    Select a file to view its contents
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

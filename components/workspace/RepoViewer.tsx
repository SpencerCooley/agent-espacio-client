'use client';

import { useState, useEffect, useCallback } from 'react';
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
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  ContentCopy as CopyIcon,
  ArrowBack as BackIcon,
  Terminal as TerminalIcon,
  Key as KeyIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Artifact } from '../../services/artifacts';
import { repoService, RepoMetadata, RepoTreeItem, RepoCommit, SshKey } from '../../services/repos';

interface RepoViewerProps {
  artifact: Artifact;
}

export default function RepoViewer({ artifact }: RepoViewerProps) {
  const [metadata, setMetadata] = useState<RepoMetadata | null>(null);
  const [treeItems, setTreeItems] = useState<RepoTreeItem[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [commits, setCommits] = useState<RepoCommit[]>([]);
  const [sshKeys, setSshKeys] = useState<SshKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sshDialogOpen, setSshDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [addingKey, setAddingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const artifactId = artifact.id;

  // Load metadata on mount
  useEffect(() => {
    setLoading(true);
    setError(null);

    repoService.getMetadata(artifactId)
      .then((data) => {
        setMetadata(data);
        // Load root tree
        return repoService.getTree(artifactId);
      })
      .then((tree) => {
        setTreeItems(tree.items);
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

  // Load SSH keys
  const loadSshKeys = useCallback(() => {
    repoService.listSshKeys()
      .then((data) => setSshKeys(data.keys))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadSshKeys();
  }, [loadSshKeys]);

  const handleNavigate = (item: RepoTreeItem) => {
    if (item.type === 'tree') {
      setFileContent(null);
      setLoading(true);
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
      setLoading(true);
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

  const handleAddSshKey = () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) return;
    setAddingKey(true);
    setKeyError(null);
    repoService.addSshKey({ name: newKeyName.trim(), public_key: newKeyValue.trim() })
      .then(() => {
        setNewKeyName('');
        setNewKeyValue('');
        setSshDialogOpen(false);
        loadSshKeys();
      })
      .catch((err) => {
        setKeyError(err.message || 'Failed to add SSH key');
      })
      .finally(() => setAddingKey(false));
  };

  const handleDeleteKey = (keyId: number) => {
    repoService.deleteSshKey(keyId)
      .then(() => loadSshKeys())
      .catch((err) => setError(err.message || 'Failed to delete key'));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {artifact.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={<TerminalIcon />}
              label="Repository"
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>

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

        {/* Git Remote URL */}
        {metadata?.git_remote_url && (
          <Paper
            variant="outlined"
            sx={{
              mt: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'action.hover',
            }}
          >
            <TerminalIcon fontSize="small" color="action" />
            <Typography
              variant="body2"
              component="code"
              sx={{
                flex: 1,
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {metadata.git_remote_url}
            </Typography>
            <Tooltip title="Copy">
              <IconButton size="small" onClick={() => copyToClipboard(metadata.git_remote_url)}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
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

          {/* Commits preview */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', maxHeight: 200, overflowY: 'auto' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Recent Commits
            </Typography>
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

        {/* Main panel: File content or readme */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {fileContent !== null ? (
            <>
              <Box
                sx={{
                  p: 1.5,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                  {fileName}
                </Typography>
                <Button size="small" onClick={() => setFileContent(null)}>
                  Close
                </Button>
              </Box>
              <Box
                component="pre"
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  m: 0,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  bgcolor: 'background.paper',
                }}
              >
                <code>{fileContent}</code>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {/* Setup instructions */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Repository Setup
              </Typography>

              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  1. Add your SSH key
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Register your SSH public key to push code to this repository.
                </Typography>

                {sshKeys.length > 0 ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="success.main" sx={{ mb: 1, display: 'block' }}>
                      {sshKeys.length} SSH key{sshKeys.length !== 1 ? 's' : ''} registered
                    </Typography>
                    {sshKeys.map((key) => (
                      <Paper
                        key={key.id}
                        variant="outlined"
                        sx={{
                          p: 1,
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {key.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {key.fingerprint}
                          </Typography>
                        </Box>
                        <IconButton size="small" color="error" onClick={() => handleDeleteKey(key.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No SSH keys registered. You must add a key before pushing.
                  </Alert>
                )}

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<KeyIcon />}
                  onClick={() => { setKeyError(null); setSshDialogOpen(true); }}
                >
                  {sshKeys.length > 0 ? 'Add Another Key' : 'Add SSH Key'}
                </Button>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  2. Push code
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configure your local git repository to push to Espacio:
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
                    {`# Add remote\n`}
                    {metadata?.git_remote_url ? `git remote add origin ${metadata.git_remote_url}\n` : '# Git remote URL will appear here after loading\n'}
                    {`\n# Push your code\n`}
                    {`git push -u origin master`}
                  </code>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      </Box>

      {/* SSH Key Dialog */}
      <Dialog open={sshDialogOpen} onClose={() => setSshDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add SSH Key</DialogTitle>
        <DialogContent>
          {keyError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {keyError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Key Name"
            placeholder="e.g., MacBook Pro"
            fullWidth
            variant="outlined"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Public Key"
            placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI..."
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={newKeyValue}
            onChange={(e) => setNewKeyValue(e.target.value)}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Paste your public key (usually in ~/.ssh/id_ed25519.pub or ~/.ssh/id_rsa.pub)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSshDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddSshKey}
            variant="contained"
            disabled={!newKeyName.trim() || !newKeyValue.trim() || addingKey}
          >
            {addingKey ? 'Adding...' : 'Add Key'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

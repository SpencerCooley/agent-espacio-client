'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Switch,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  ContentCopy as CopyIcon,
  ArrowBack as BackIcon,
  Terminal as TerminalIcon,
  History as HistoryIcon,
  RocketLaunch as DeployIcon,
  OpenInNew as OpenInNewIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { Artifact, artifactService } from '../../services/artifacts';
import {
  repoService,
  RepoMetadata,
  RepoTreeItem,
  RepoCommit,
  RepoCommitDetail,
  PublishSettings,
  DeployHistoryEntry,
  isImageFile,
} from '../../services/repos';
import { useAuthBlob } from '../../hooks/useAuthBlob';
import { useWebSocket } from '../../context/WebSocketContext';
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
  const [imagePath, setImagePath] = useState<string | null>(null);
  const imageRawUrl = imagePath ? repoService.getRawFileUrl(artifact.id, imagePath) : null;
  const imageBlobUrl = useAuthBlob(imageRawUrl);
  const [commits, setCommits] = useState<RepoCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'files' | 'history' | 'commit'>('files');
  const [selectedCommit, setSelectedCommit] = useState<RepoCommitDetail | null>(null);
  const [commitLoading, setCommitLoading] = useState(false);

  // Publish state
  const [publishSettings, setPublishSettings] = useState<PublishSettings | null>(null);
  const [deployStatus, setDeployStatus] = useState<string>('');
  const [publishSnackbar, setPublishSnackbar] = useState('');
  const [showDeployHistory, setShowDeployHistory] = useState(false);
  const [deployHistory, setDeployHistory] = useState<DeployHistoryEntry[]>([]);
  const [expandedDeployLog, setExpandedDeployLog] = useState<number | null>(null);
  const { subscribe, unsubscribe } = useWebSocket();

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsArtifactMode, setSettingsArtifactMode] = useState<'repo' | 'static'>('repo');
  const [settingsRenderMode, setSettingsRenderMode] = useState<string>('embedded');
  const [settingsSlug, setSettingsSlug] = useState('');
  const [settingsBuildCommand, setSettingsBuildCommand] = useState('');
  const [settingsOutputDir, setSettingsOutputDir] = useState('');
  const [settingsAutoDeploy, setSettingsAutoDeploy] = useState(true);
  const [settingsAllowPublicCodeView, setSettingsAllowPublicCodeView] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const slugSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const loadPublishSettings = async () => {
    try {
      const settings = await repoService.getPublishSettings(artifactId);
      setPublishSettings(settings);
      if (settings.status) setDeployStatus(settings.status);
      return settings;
    } catch {
      setPublishSettings(null);
      return null;
    }
  };

  const loadDeployStatus = useCallback(async () => {
    try {
      const status = await repoService.getDeployStatus(artifactId);
      setDeployStatus(status.status);
      setDeployHistory(status.deploy_history || []);
      setPublishSettings((prev) =>
        prev
          ? {
              ...prev,
              status: status.status,
              last_deploy_at: status.last_deploy_at,
              last_deploy_commit: status.last_deploy_commit,
            }
          : prev
      );
      return status;
    } catch {
      return null;
    }
  }, [artifactId]);

  const handleDeploy = async () => {
    try {
      await repoService.triggerDeploy(artifactId);
      setDeployStatus('building');
      setPublishSettings((prev) => (prev ? { ...prev, status: 'building' } : prev));
      setShowDeployHistory(true);
      setFileContent(null);
      setImagePath(null);
      setPublishSnackbar('Deploy started');
    } catch (err: any) {
      setPublishSnackbar(err?.message || 'Deploy failed');
    }
  };

  const openDeployHistory = async () => {
    setFileContent(null);
    setImagePath(null);
    setShowDeployHistory(true);
    await loadDeployStatus();
  };

  // Real-time deploy status via WebSocket
  useEffect(() => {
    const channel = `artifact:${artifactId}`;
    const handleEvent = (event: any) => {
      const type = event?.event_type || '';
      if (!type.startsWith('artifact.deploy')) return;
      if (event.resource_id && event.resource_id !== artifactId) return;

      const payload = event.payload || {};
      if (type === 'artifact.deploy_started') {
        setDeployStatus('building');
        setPublishSettings((prev) => (prev ? { ...prev, status: 'building' } : prev));
        setShowDeployHistory(true);
        setFileContent(null);
        setImagePath(null);
      } else if (type === 'artifact.deployed') {
        setDeployStatus('deployed');
        setPublishSettings((prev) =>
          prev
            ? {
                ...prev,
                status: 'deployed',
                last_deploy_at: payload.finished_at || prev.last_deploy_at,
                last_deploy_commit: payload.commit || prev.last_deploy_commit,
              }
            : prev
        );
        setPublishSnackbar('Deploy succeeded');
        loadDeployStatus();
      } else if (type === 'artifact.deploy_failed') {
        setDeployStatus('failed');
        setPublishSettings((prev) => (prev ? { ...prev, status: 'failed' } : prev));
        setPublishSnackbar('Deploy failed — check history for logs');
        setShowDeployHistory(true);
        loadDeployStatus();
      }
    };

    subscribe(channel, handleEvent);
    return () => unsubscribe(channel, handleEvent);
  }, [artifactId, subscribe, unsubscribe, loadDeployStatus]);

  // Load deploy history when publish is enabled
  useEffect(() => {
    if (publishSettings?.enabled) {
      loadDeployStatus();
    }
  }, [publishSettings?.enabled, loadDeployStatus]);

  const openSettings = async () => {
    const settings = await loadPublishSettings();
    if (settings?.enabled) {
      setSettingsArtifactMode('static');
      setSettingsRenderMode(settings.render_mode);
      setSettingsSlug(settings.slug);
      setSettingsBuildCommand(settings.build_command || '');
      setSettingsOutputDir(settings.output_dir || '');
      setSettingsAutoDeploy(settings.auto_deploy);
      setSettingsAllowPublicCodeView(settings.allow_public_code_view);
    } else {
      setSettingsArtifactMode('repo');
      setSettingsRenderMode('embedded');
      setSettingsSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
      setSettingsBuildCommand('');
      setSettingsOutputDir('');
      setSettingsAutoDeploy(true);
      setSettingsAllowPublicCodeView(false);
    }
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      if (settingsArtifactMode === 'repo') {
        const saved = await repoService.updatePublishSettings(artifactId, {
          enabled: false,
        });
        setPublishSettings(saved.enabled ? saved : null);
      } else {
        const updates: Partial<PublishSettings> = {
          enabled: true,
          render_mode: settingsRenderMode,
          slug: settingsSlug,
          build_command: settingsBuildCommand || '',
          output_dir: settingsBuildCommand ? settingsOutputDir || '' : '',
          auto_deploy: settingsAutoDeploy,
          allow_public_code_view: settingsAllowPublicCodeView,
        };
        const saved = await repoService.updatePublishSettings(artifactId, updates);
        setPublishSettings(saved);
      }
      setPublishSnackbar('Settings saved');
      setSettingsOpen(false);
    } catch (err: any) {
      setPublishSnackbar(err?.message || 'Failed to save');
    }
    setSettingsSaving(false);
  };

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
    setSettingsSlug(sanitized);
  };

  // Load publish settings on mount
  useEffect(() => {
    if (metadata) {
      loadPublishSettings();
    }
  }, [metadata?.artifact_id]);

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
      .catch(() => {});
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
        setImagePath(null);
        setLoading(true);
        if (isImageFile(state.file)) {
          repoService.getTree(artifactId, 'HEAD', targetPath || undefined)
            .then((tree) => {
              setTreeItems(tree.items);
              setFileName(state.file!);
              setImagePath(state.file!);
              setLoading(false);
              navigatingFromPopState.current = false;
            })
            .catch((err) => {
              setError(err.message || 'Failed to load');
              setLoading(false);
              navigatingFromPopState.current = false;
            });
        } else {
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
        }
      } else {
        setCurrentPath(targetPath);
        setFileContent(null);
        setImagePath(null);
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
      setImagePath(null);
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
      if (isImageFile(item.path)) {
        setFileContent(null);
        setFileName(item.path);
        setImagePath(item.path);
        setLoading(false);
      } else {
        setImagePath(null);
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
    }
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const parentPath = currentPath.includes('/')
      ? currentPath.substring(0, currentPath.lastIndexOf('/'))
      : '';
    setFileContent(null);
    setImagePath(null);
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

  const isStaticSite = publishSettings?.enabled;
  const isBuilding = (deployStatus || publishSettings?.status) === 'building';

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
            {isStaticSite && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={isBuilding ? <CircularProgress size={14} color="inherit" /> : <DeployIcon />}
                  onClick={handleDeploy}
                  disabled={isBuilding}
                >
                  {isBuilding ? 'Deploying...' : 'Deploy Site'}
                </Button>
                <Button
                  size="small"
                  variant={showDeployHistory ? 'outlined' : 'text'}
                  startIcon={<HistoryIcon />}
                  onClick={openDeployHistory}
                >
                  History
                </Button>
              </>
            )}
            <Chip
              icon={<TerminalIcon />}
              label={isStaticSite ? 'Static Site' : 'Repository'}
              size="small"
              color={isStaticSite ? 'success' : 'primary'}
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
            {isStaticSite && publishSettings?.site_url && (
              <Tooltip title="Open published site">
                <IconButton
                  size="small"
                  href={publishSettings.site_url}
                  target="_blank"
                  component="a"
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Settings">
              <IconButton size="small" onClick={openSettings}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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
                      setImagePath(null);
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
          ) : showDeployHistory ? (
            <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Deploy History
                </Typography>
                <Button
                  size="small"
                  onClick={() => {
                    setShowDeployHistory(false);
                    setExpandedDeployLog(null);
                  }}
                >
                  Back to files
                </Button>
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {isBuilding && (
                  <Alert severity="info" sx={{ mb: 2 }} icon={<CircularProgress size={16} />}>
                    Deploy in progress…
                  </Alert>
                )}
                {deployHistory.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No deploys yet. Click Deploy Site to publish.
                  </Typography>
                ) : (
                  <List disablePadding>
                    {deployHistory.map((entry, idx) => {
                      const finished = entry.finished_at ? new Date(entry.finished_at) : null;
                      const open = expandedDeployLog === idx;
                      const ok = entry.status === 'deployed';
                      return (
                        <Paper key={`${entry.finished_at}-${idx}`} variant="outlined" sx={{ mb: 1.5, overflow: 'hidden' }}>
                          <ListItemButton
                            onClick={() => setExpandedDeployLog(open ? null : idx)}
                            sx={{ py: 1.25 }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Chip
                                    size="small"
                                    label={entry.status}
                                    color={ok ? 'success' : 'error'}
                                    sx={{ height: 22, fontSize: '0.7rem' }}
                                  />
                                  {entry.commit && (
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                                      {entry.commit}
                                    </Typography>
                                  )}
                                  {finished && (
                                    <Typography variant="caption" color="text.secondary">
                                      {finished.toLocaleString()}
                                    </Typography>
                                  )}
                                </Box>
                              }
                              secondary={entry.log ? entry.log.split('\n').slice(-1)[0] : undefined}
                              secondaryTypographyProps={{ noWrap: true, sx: { fontFamily: 'monospace', fontSize: '0.7rem' } }}
                            />
                            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </ListItemButton>
                          <Collapse in={open}>
                            <Box
                              component="pre"
                              sx={{
                                m: 0,
                                px: 2,
                                py: 1.5,
                                maxHeight: 280,
                                overflow: 'auto',
                                bgcolor: 'action.hover',
                                borderTop: 1,
                                borderColor: 'divider',
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}
                            >
                              {entry.log || '(no log)'}
                            </Box>
                          </Collapse>
                        </Paper>
                      );
                    })}
                  </List>
                )}
              </Box>
            </Box>
          ) : imagePath ? (
            <>
              <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {fileName}
                </Typography>
                <Button size="small" onClick={() => { setImagePath(null); setFileName(''); }}>
                  Close
                </Button>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.default',
                }}
              >
                {imageBlobUrl ? (
                  <Box
                    component="img"
                    src={imageBlobUrl}
                    alt={fileName}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: 1,
                    }}
                  />
                ) : (
                  <CircularProgress size={32} />
                )}
              </Box>
            </>
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

      {/* Settings Modal */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Repository Settings</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ width: '100%', mt: 1 }}>
            <FormLabel component="legend" sx={{ mb: 1 }}>Artifact Type</FormLabel>
            <RadioGroup
              value={settingsArtifactMode}
              onChange={(e) => setSettingsArtifactMode(e.target.value as 'repo' | 'static')}
              row
            >
              <FormControlLabel value="repo" control={<Radio />} label="Repository" />
              <FormControlLabel value="static" control={<Radio />} label="Static Site" />
            </RadioGroup>
          </FormControl>

          {settingsArtifactMode === 'static' && (
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <FormControl size="small">
                <FormLabel sx={{ fontSize: '0.875rem', mb: 1 }}>Display Mode</FormLabel>
                <RadioGroup
                  value={settingsRenderMode}
                  onChange={(e) => {
                    const newMode = e.target.value;
                    setSettingsRenderMode(newMode);
                    if (newMode === 'repo_link') {
                      setSettingsAllowPublicCodeView(true);
                    } else if (settingsRenderMode === 'repo_link') {
                      // Switching from repo_link to embedded/direct: reset to false
                      setSettingsAllowPublicCodeView(false);
                    }
                  }}
                >
                  <FormControlLabel value="embedded" control={<Radio size="small" />} label="Embedded (iframe with branded nav)" />
                  <FormControlLabel value="direct" control={<Radio size="small" />} label="Direct URL (redirect to site)" />
                  <FormControlLabel value="repo_link" control={<Radio size="small" />} label="Repository + site link (code public)" />
                </RadioGroup>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={settingsAllowPublicCodeView}
                    onChange={(e) => setSettingsAllowPublicCodeView(e.target.checked)}
                    disabled={settingsRenderMode === 'repo_link'}
                  />
                }
                label={
                  <Typography variant="body2" color={settingsRenderMode === 'repo_link' ? 'text.secondary' : 'text.primary'}>
                    {settingsRenderMode === 'repo_link'
                      ? 'Allow public code view — auto-enabled (repo link mode shows code by default)'
                      : 'Allow public code view (clone access)'}
                  </Typography>
                }
              />

              <TextField
                size="small"
                label="Site slug"
                value={settingsSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-cool-site"
                helperText={settingsSlug ? `/${settingsSlug}` : 'Letters, numbers, and dashes only'}
                fullWidth
              />

              <TextField
                size="small"
                label="Build command (optional)"
                value={settingsBuildCommand}
                onChange={(e) => setSettingsBuildCommand(e.target.value)}
                placeholder="npm run build"
                helperText="Leave empty to serve files directly as-is (e.g. plain index.html)"
                fullWidth
              />

              {settingsBuildCommand && (
                <TextField
                  size="small"
                  label="Output directory"
                  value={settingsOutputDir}
                  onChange={(e) => setSettingsOutputDir(e.target.value)}
                  placeholder="dist"
                  fullWidth
                />
              )}

              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={settingsAutoDeploy}
                    onChange={(e) => setSettingsAutoDeploy(e.target.checked)}
                  />
                }
                label="Auto-deploy on push"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveSettings}
            disabled={settingsSaving}
          >
            {settingsSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!publishSnackbar}
        autoHideDuration={3000}
        onClose={() => setPublishSnackbar('')}
        message={publishSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

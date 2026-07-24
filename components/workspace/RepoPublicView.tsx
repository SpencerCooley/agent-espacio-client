'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  ArrowBack as BackIcon,
  Terminal as TerminalIcon,
  History as HistoryIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import CodeBlock from './CodeBlock';
import DiffViewer from './DiffViewer';
import { isImageFile } from '../../services/repos';
import { useAuthBlob } from '../../hooks/useAuthBlob';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function encodeRepoPath(filePath: string): string {
  return encodeURIComponent(filePath).replace(/%2F/g, '/');
}

interface RepoTreeItem {
  name: string;
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

interface RepoCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

interface RepoDiffFile {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string | null;
}

interface RepoCommitDetail {
  hash: string;
  short_hash: string;
  message: string;
  author: string;
  date: string;
  parent_hash: string | null;
  files: RepoDiffFile[];
  total_additions: number;
  total_deletions: number;
}

interface RepoPublicViewProps {
  artifactId: string;
  publicMagicId?: string;
  isPreview?: boolean;
  themeMode?: 'light' | 'dark';
}

export default function RepoPublicView({
  artifactId,
  publicMagicId,
  isPreview = false,
}: RepoPublicViewProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [treeItems, setTreeItems] = useState<RepoTreeItem[]>([]);
  const [currentPath, setCurrentPath] = useState(
    decodeURIComponent(window.location.hash.slice(1) || '')
  );
  const navigatingFromPopState = useRef(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [commits, setCommits] = useState<RepoCommit[]>([]);
  const [commitCount, setCommitCount] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'files' | 'history' | 'commit'>('files');
  const [selectedCommit, setSelectedCommit] = useState<RepoCommitDetail | null>(null);
  const [commitLoading, setCommitLoading] = useState(false);
  const [cloneUrl, setCloneUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const searchParams = useSearchParams();
  const isRepoView = searchParams?.get('repo_view') === 'true';

  const baseUrl = isPreview
    ? `${API_BASE_URL}/artifacts/${artifactId}/repo`
    : `${API_BASE_URL}/public/repo/${publicMagicId || artifactId}`;

  const imageRawUrl = imagePath ? `${baseUrl}/raw/${encodeRepoPath(imagePath)}` : null;
  // Preview uses authenticated raw endpoint; public magic_id path needs no auth headers
  const imageBlobUrl = useAuthBlob(isPreview ? imageRawUrl : null);
  const publicImageSrc = !isPreview ? imageRawUrl : null;
  const displayImageSrc = isPreview ? imageBlobUrl : publicImageSrc;

  const authHeaders: Record<string, string> = isPreview
    ? { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` }
    : {};

  const fetchJson = useCallback(async (url: string) => {
    const res = await fetch(url, { headers: authHeaders });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }, [isPreview]);

  // Load metadata + tree + commits
  useEffect(() => {
    setLoading(true);
    setError(null);
    const hashPath = decodeURIComponent(window.location.hash.slice(1) || '');
    const treeUrl = hashPath
      ? `${baseUrl}/tree?path=${encodeURIComponent(hashPath)}`
      : `${baseUrl}/tree`;

    Promise.all([
      fetchJson(baseUrl),
      fetchJson(treeUrl),
      fetchJson(`${baseUrl}/commits?limit=10`),
    ])
      .then(([meta, tree, commitData]) => {
        setName(meta.name || '');
        setDescription(meta.description || '');
        setCommitCount(meta.commit_count || 0);
        setFileCount(meta.file_count || 0);
        setCloneUrl(meta.clone_url || '');
        // Get site URL from publish config
        const pub = meta.publish;
        if (pub?.slug) {
          setSiteUrl(`${API_BASE_URL}/published/${pub.slug}/`);
        }
        setTreeItems(tree.items || []);
        setCurrentPath(hashPath);
        setCommits(commitData.commits || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load repository');
        setLoading(false);
      });
  }, [baseUrl, fetchJson]);

  const handleNavigate = (item: RepoTreeItem) => {
    if (item.type === 'tree') {
      setFileContent(null);
      setImagePath(null);
      setLoading(true);
      if (!navigatingFromPopState.current) {
        window.history.pushState({ path: item.path }, '', `#${item.path}`);
      }
      fetchJson(`${baseUrl}/tree?path=${encodeURIComponent(item.path)}`)
        .then((tree) => {
          setTreeItems(tree.items || []);
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
        fetchJson(`${baseUrl}/files/${encodeRepoPath(item.path)}`)
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
    const url = parentPath
      ? `${baseUrl}/tree?path=${encodeURIComponent(parentPath)}`
      : `${baseUrl}/tree`;
    fetchJson(url)
      .then((tree) => {
        setTreeItems(tree.items || []);
        setCurrentPath(parentPath);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load directory');
        setLoading(false);
      });
  };

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => {
      navigatingFromPopState.current = true;
      const state = history.state as { path?: string; file?: string } | null;
      const hashPath = decodeURIComponent(window.location.hash.slice(1) || '');
      const targetPath = state?.path || hashPath;
      const treeUrl = targetPath
        ? `${baseUrl}/tree?path=${encodeURIComponent(targetPath)}`
        : `${baseUrl}/tree`;

      if (state?.file) {
        setCurrentPath(targetPath);
        setFileContent(null);
        setImagePath(null);
        setLoading(true);
        if (isImageFile(state.file)) {
          fetchJson(treeUrl)
            .then((tree) => {
              setTreeItems(tree.items || []);
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
            fetchJson(treeUrl),
            fetchJson(`${baseUrl}/files/${encodeRepoPath(state.file)}`),
          ])
            .then(([tree, file]) => {
              setTreeItems(tree.items || []);
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
        fetchJson(treeUrl)
          .then((tree) => {
            setTreeItems(tree.items || []);
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
  }, [baseUrl, fetchJson]);

  if (loading && !name) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !name) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <TerminalIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
            {name}
          </Typography>
        </Box>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {commitCount} commits · {fileCount} files
          </Typography>
          {siteUrl && !isRepoView && (
            <Link
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem', color: 'primary.main' }}
            >
              <OpenInNewIcon sx={{ fontSize: 12 }} />
              View Live Site
            </Link>
          )}
          {publicMagicId && siteUrl && isRepoView && (
            <Button
              size="small"
              variant="outlined"
              href={`/public/view/${publicMagicId}`}
              sx={{ fontSize: '0.75rem', py: 0.25, minHeight: 24, textTransform: 'none' }}
            >
              View Site
            </Button>
          )}
          {cloneUrl && (
            <Tooltip title={copied ? 'Copied!' : 'Copy clone command'}>
              <IconButton
                size="small"
                onClick={() => {
                  navigator.clipboard.writeText(`git clone ${cloneUrl}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                sx={{ fontSize: '0.75rem', gap: 0.25 }}
              >
                <CopyIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" sx={{ lineHeight: 1 }}>clone</Typography>
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar: File tree + commits */}
        <Box
          sx={{
            width: 300,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Breadcrumbs separator="›" sx={{ fontSize: '0.875rem' }}>
              <Link
                component="button"
                underline="hover"
                color="inherit"
                onClick={handleNavigateUp}
                sx={{ fontSize: '0.875rem', cursor: currentPath ? 'pointer' : 'default', background: 'none', border: 'none', p: 0 }}
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
              <ListItemButton dense onClick={handleNavigateUp} sx={{ mt: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <BackIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Back" primaryTypographyProps={{ variant: 'body2' }} />
              </ListItemButton>
            )}
          </Box>

          {/* File tree */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {treeItems.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Empty directory
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
                              const commitUrl = isPreview
                                ? `${API_BASE_URL}/artifacts/${artifactId}/repo/commits/${commit.hash}`
                                : `${API_BASE_URL}/public/repo/${publicMagicId || artifactId}/commits/${commit.hash}`;
                              const res = await fetch(commitUrl, { headers: authHeaders });
                              if (res.ok) {
                                const detail = await res.json();
                                setSelectedCommit(detail);
                                setViewMode('commit');
                              }
                            } catch (err) {
                              console.error('Failed to load commit', err);
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
          ) : imagePath ? (
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', mb: 1 }}>
                {fileName}
              </Typography>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {displayImageSrc ? (
                  <Box
                    component="img"
                    src={displayImageSrc}
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
            </Box>
          ) : fileContent !== null ? (
            <CodeBlock code={fileContent} filename={fileName} />
          ) : (
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {commitCount === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <TerminalIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    This repository is empty
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No commits have been pushed yet.
                  </Typography>
                </Box>
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

'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Breadcrumbs,
  Link as MuiLink,
  TextField,
  Paper,
  ClickAwayListener,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  AccountCircle,
  Settings as SettingsIcon,
  Logout,
  Dashboard,
  ChevronRight,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Article as ArticleIcon,
  Notes as NotesIcon,
  Map as MapIcon,
  PhotoLibrary as GalleryIcon,
  AccountTree as WorkflowIcon,
  Dashboard as ComposerIcon,
  Movie as MovieIcon,
  MusicNote as AudioIcon,
  Image as ImageIcon,
  Description as MarkdownIcon,
  DataObject as JsonIcon,
} from '@mui/icons-material';
import Logo from '../Logo';
import { useApp } from '../../context/AppContext';
import { useShareContext } from '../../context/ShareContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { folderService, FolderItem } from '../../services/folders';

interface BreadcrumbItem {
  label: string;
  href?: string;
  folderId?: string;
}

interface WorkspaceHeaderProps {
  showAdminToggle?: boolean;
  breadcrumb?: BreadcrumbItem[];
  onDropOnBreadcrumb?: (folderId: string, event: React.DragEvent) => void;
}

export default function WorkspaceHeader({
  showAdminToggle = false,
  breadcrumb,
  onDropOnBreadcrumb,
}: WorkspaceHeaderProps) {
  const { user, logout } = useApp();
  const { shareTarget, setModalOpen } = useShareContext();
  const pathname = usePathname();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // Track which breadcrumb item is being dragged over
  const [activeBreadcrumbDrop, setActiveBreadcrumbDrop] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FolderItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract current folder ID from breadcrumb for search scoping
  const currentFolderId = React.useMemo(() => {
    if (!breadcrumb) return null;
    // Last breadcrumb item is the current folder
    const last = breadcrumb[breadcrumb.length - 1];
    if (last?.folderId) return last.folderId;
    // If no folderId in last item, try to find one in the path
    if (pathname?.startsWith('/workspace/folders/')) {
      const parts = pathname.split('/');
      return parts[3] || null;
    }
    return null;
  }, [breadcrumb, pathname]);

  // Only show share/preview icons on artifact routes
  const isArtifactRoute = pathname?.startsWith('/workspace/artifacts/');
  const isPreviewRoute = pathname?.includes('/preview');
  
  // Extract artifact ID from path for preview navigation
  const artifactIdForPreview = React.useMemo(() => {
    if (!isArtifactRoute || isPreviewRoute) return null;
    // Path format: /workspace/artifacts/[artifactId] or /workspace/artifacts/[artifactId]/...
    const parts = pathname?.split('/');
    if (parts && parts.length >= 4) {
      return parts[3];
    }
    return null;
  }, [pathname, isArtifactRoute, isPreviewRoute]);

  const handlePreviewClick = () => {
    if (artifactIdForPreview) {
      window.open(`/workspace/artifacts/${artifactIdForPreview}/preview`, '_blank');
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    window.location.href = '/login';
  };

  const handleShareClick = () => {
    setModalOpen(true);
  };

  // Search handlers
  const performSearch = async (query: string) => {
    if (!query.trim() || !currentFolderId) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await folderService.searchFolderItems(currentFolderId, query.trim());
      setSearchResults(response.items.slice(0, 20));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSearchOpen(true);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
    if (searchQuery.trim()) {
      setSearchOpen(true);
      performSearch(searchQuery);
    }
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
  };

  const handleClickAway = () => {
    setSearchOpen(false);
  };

  const handleResultClick = (item: FolderItem) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    if (item.kind === 'folder') {
      router.push(`/workspace/folders/${item.id}`);
    } else if (item.kind === 'artifact') {
      router.push(`/workspace/artifacts/${item.id}`);
    } else if (item.kind === 'asset') {
      router.push(`/workspace/assets/${item.id}`);
    }
  };

  const getSearchResultIcon = (item: FolderItem) => {
    if (item.kind === 'folder') return <FolderIcon sx={{ fontSize: 20, color: 'primary.main' }} />;
    if (item.kind === 'asset') {
      if (item.is_image || item.mime_type?.startsWith('image/')) return <ImageIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
      if (item.mime_type?.startsWith('video/')) return <MovieIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
      if (item.mime_type?.startsWith('audio/')) return <AudioIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
      if (item.is_markdown || item.mime_type?.startsWith('text/markdown')) return <MarkdownIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
      if (item.mime_type?.startsWith('application/json')) return <JsonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
      return <FileIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
    }
    if (item.kind === 'artifact') {
      switch (item.type) {
        case 'note': return <NotesIcon sx={{ fontSize: 20, color: 'secondary.main' }} />;
        case 'map': return <MapIcon sx={{ fontSize: 20, color: 'secondary.main' }} />;
        case 'gallery': return <GalleryIcon sx={{ fontSize: 20, color: 'secondary.main' }} />;
        case 'workflow': return <WorkflowIcon sx={{ fontSize: 20, color: 'secondary.main' }} />;
        case 'composer': return <ComposerIcon sx={{ fontSize: 20, color: 'secondary.main' }} />;
        default: return <ArticleIcon sx={{ fontSize: 20, color: 'secondary.main' }} />;
      }
    }
    return <FileIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
  };

  const getKindLabel = (item: FolderItem) => {
    if (item.kind === 'folder') return 'Folder';
    if (item.kind === 'asset') {
      if (item.is_image || item.mime_type?.startsWith('image/')) return 'Image';
      if (item.mime_type?.startsWith('video/')) return 'Video';
      if (item.mime_type?.startsWith('audio/')) return 'Audio';
      if (item.is_markdown || item.mime_type?.startsWith('text/markdown')) return 'Markdown';
      if (item.mime_type?.startsWith('application/json')) return 'JSON';
      return 'File';
    }
    if (item.kind === 'artifact') {
      return item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Artifact';
    }
    return '';
  };

  const handleBreadcrumbDragEnter = (folderId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveBreadcrumbDrop(folderId);
  };

  const handleBreadcrumbDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleBreadcrumbDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear highlight if we're actually leaving this breadcrumb item,
    // not just moving between child elements inside it (e.g., the link text)
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const currentTarget = e.currentTarget as HTMLElement;
    if (relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    setActiveBreadcrumbDrop(null);
  };

  const handleBreadcrumbDrop = (folderId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveBreadcrumbDrop(null);
    if (onDropOnBreadcrumb) {
      onDropOnBreadcrumb(folderId, e);
    }
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left section: Logo + Breadcrumb */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
          <Link href="/workspace" style={{ textDecoration: 'none', display: 'inline-block', flexShrink: 0 }}>
            <Logo />
          </Link>

          {breadcrumb && breadcrumb.length > 0 && (
            <Breadcrumbs
              separator={<ChevronRight sx={{ fontSize: { xs: 12, md: 16 }, color: 'text.secondary' }} />}
              sx={{
                ml: { xs: 1, md: 2 },
                minWidth: 0,
                '& .MuiBreadcrumbs-ol': {
                  flexWrap: 'nowrap',
                  overflow: 'hidden',
                },
                '& .MuiBreadcrumbs-li': {
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                },
              }}
            >
              {breadcrumb.map((item, index) => {
                const isLast = index === breadcrumb.length - 1;
                const isActiveDrop = activeBreadcrumbDrop === item.folderId;

                // Drop target wrapper for breadcrumb items with folderId
                if (item.folderId && onDropOnBreadcrumb && !isLast) {
                  return (
                    <Box
                      key={index}
                      component="span"
                      onDragEnter={handleBreadcrumbDragEnter(item.folderId)}
                      onDragOver={handleBreadcrumbDragOver}
                      onDragLeave={handleBreadcrumbDragLeave}
                      onDrop={handleBreadcrumbDrop(item.folderId)}
                      sx={{
                        display: 'inline-block',
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 0.75,
                        mx: -0.75,
                        my: -0.5,
                        transition: 'all 0.15s ease',
                        bgcolor: isActiveDrop ? 'primary.main' : 'transparent',
                        color: isActiveDrop ? 'primary.contrastText' : 'inherit',
                        boxShadow: isActiveDrop
                          ? (theme) => `0 0 0 3px ${theme.palette.primary.main}40`
                          : 'none',
                        '&:hover': {
                          bgcolor: isActiveDrop ? 'primary.main' : 'action.hover',
                        },
                      }}
                    >
                      <MuiLink
                        component={Link}
                        href={item.href || `/workspace/folders/${item.folderId}`}
                        color="inherit"
                        sx={{
                          textDecoration: 'none',
                          color: isActiveDrop ? 'primary.contrastText' : 'inherit',
                          '&:hover': { textDecoration: 'underline' },
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'block',
                          maxWidth: { xs: 100, sm: 150, md: 'none' },
                        }}
                      >
                        {item.label}
                      </MuiLink>
                    </Box>
                  );
                }

                if (item.href && !isLast) {
                  return (
                    <MuiLink
                      key={index}
                      component={Link}
                      href={item.href}
                      color="inherit"
                      sx={{
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                        maxWidth: { xs: 100, sm: 150, md: 'none' },
                      }}
                    >
                      {item.label}
                    </MuiLink>
                  );
                }
                return (
                  <Typography key={index} color={isLast ? 'text.primary' : 'text.secondary'}
                    sx={{
                      fontSize: { xs: '0.75rem', md: '0.875rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: { xs: 100, sm: 150, md: 'none' },
                    }}
                  >
                    {item.label}
                  </Typography>
                );
              })}
            </Breadcrumbs>
          )}
        </Box>

        {/* Center section: Search */}
        {currentFolderId && (
          <ClickAwayListener onClickAway={handleClickAway}>
            <Box sx={{ position: 'relative', mx: 2, flex: 1, maxWidth: 420, minWidth: 200 }}>
              <TextField
                size="small"
                placeholder="Search this folder..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {searchLoading ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      )}
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: '100%',
                  '& .MuiInputBase-root': {
                    borderRadius: 2,
                    bgcolor: searchFocused ? 'background.paper' : 'action.hover',
                    transition: 'background-color 0.2s ease',
                  },
                }}
              />
              {searchOpen && (
                <Paper
                  elevation={3}
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    mt: 0.5,
                    maxHeight: 360,
                    overflowY: 'auto',
                    zIndex: 1300,
                    borderRadius: 2,
                  }}
                >
                  {searchResults.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchQuery.trim() ? 'No results found' : 'Type to search'}
                      </Typography>
                    </Box>
                  ) : (
                    searchResults.map((item) => (
                      <Box
                        key={`${item.kind}-${item.id}`}
                        onClick={() => handleResultClick(item)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          px: 2,
                          py: 1.25,
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' },
                        }}
                      >
                        {getSearchResultIcon(item)}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getKindLabel(item)}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </Paper>
              )}
            </Box>
          </ClickAwayListener>
        )}

        {/* Right section: Actions + User */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {/* Admin Toggle */}
          {showAdminToggle && user?.role === 'admin' && (
            <IconButton
              component={Link}
              href="/admin"
              sx={{ color: 'text.primary' }}
              title="Switch to Admin Panel"
            >
              <Dashboard />
            </IconButton>
          )}

          {/* Share icon for artifact routes */}
          {isArtifactRoute && shareTarget && !isPreviewRoute && (
            <IconButton
              onClick={handleShareClick}
              sx={{ color: shareTarget.isPublic ? 'success.main' : 'text.primary' }}
              title={shareTarget.isPublic ? 'Publicly shared' : 'Share this artifact'}
            >
              <ShareIcon />
            </IconButton>
          )}

          {/* Preview icon for artifact routes (not on preview route itself) */}
          {isArtifactRoute && !isPreviewRoute && artifactIdForPreview && (
            <IconButton
              onClick={handlePreviewClick}
              sx={{ color: 'text.primary' }}
              title="Preview public view"
            >
              <VisibilityIcon />
            </IconButton>
          )}

          {/* User Menu */}
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            sx={{ color: 'text.primary' }}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="textSecondary">
                {user?.email}
              </Typography>
            </MenuItem>
            <MenuItem component={Link} href="/workspace/settings">
              <SettingsIcon sx={{ mr: 1, fontSize: 20 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1, fontSize: 20 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

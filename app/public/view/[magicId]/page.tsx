'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import { Box, Typography, Grid, Paper, Breadcrumbs, Link, Chip, TextField, InputAdornment, CircularProgress, ClickAwayListener, Menu, MenuItem } from '@mui/material';
import { Folder as FolderIcon, InsertDriveFile as FileIcon, Image as ImageIcon, Article as ArticleIcon, Map as MapIcon, Movie as MovieIcon, Audiotrack as AudiotrackIcon, PhotoLibrary as PhotoLibraryIcon, AutoAwesomeMosaic as ComposerIcon, Search as SearchIcon, Terminal as TerminalIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import InlineThumbnail from '../../../../components/workspace/InlineThumbnail';
import WorkflowPublicView from '../../../../components/workspace/WorkflowPublicView';
import GalleryPublicView from '../../../../components/workspace/GalleryPublicView';
import ComposerPublicView from '../../../../components/workspace/ComposerPublicView';
import RepoPublicView from '../../../../components/workspace/RepoPublicView';
import { PublicAssetView, NotePublicView, MapPublicView } from '../../../../components/public/PublicViews';
import PublicShell from '../../../../components/public/PublicShell';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PublicItem {
  kind: string;
  id: string;
  name: string;
  type?: string;
  mime_type?: string;
  is_image?: boolean;
  is_public?: boolean;
  public_magic_id?: string;
  created_at: string;
  updated_at: string;
}

interface AncestorItem {
  id: string;
  name: string;
  is_public: boolean;
  public_magic_id: string | null;
}

interface PublicViewData {
  kind: string;
  folder?: {
    id: string;
    name: string;
    path: string;
    parent_id: string | null;
    is_public: boolean;
    public_magic_id: string;
  };
  asset?: {
    id: string;
    name: string;
    mime_type: string;
    size_bytes: number;
    human_readable_size: string;
    is_image: boolean;
    public_magic_id: string;
  };
  artifact?: {
    id: string;
    name: string;
    type: string;
    description?: string;
    content: any;
    public_magic_id: string;
    publish?: {
      render_mode: string;
      slug: string;
      allow_public_code_view?: boolean;
    } | null;
  };
  ancestors?: AncestorItem[];
  items?: PublicItem[];
  total_items?: number;
  public_theme?: {
    theme_id: string;
    mode: 'light' | 'dark';
    definition: any;
  };
}

export default function PublicViewPage() {
  const params = useParams();
  const magicId = params.magicId as string;
  const searchParams = useSearchParams();
  const repoViewParam = searchParams.get('repo_view') === 'true';
  const [data, setData] = useState<PublicViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Type filter state
  type ActiveFilter =
    | 'all'
    | { kind: 'folder' }
    | { kind: 'artifact'; subtype?: string }
    | { kind: 'asset'; subtype?: string };
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  // Dropdown anchors for filter pills
  const [artifactFilterAnchor, setArtifactFilterAnchor] = useState<HTMLElement | null>(null);
  const [assetFilterAnchor, setAssetFilterAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!magicId) return;

    fetch(`${API_BASE_URL}/public/view/${magicId}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to load public view');
        }
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [magicId]);

  // Search handler
  const performSearch = async (query: string) => {
    if (!query.trim() || !magicId) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/public/search/${magicId}?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error('Search failed');
      const result = await res.json();
      setSearchResults(result.items?.slice(0, 20) || []);
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
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => performSearch(value), 300);
  };

  const handleClickAway = () => {
    setSearchOpen(false);
  };

  const getAssetSubtype = (item: PublicItem): string => {
    if (item.is_image || item.mime_type?.startsWith('image/')) return 'image';
    if (item.mime_type?.startsWith('video/')) return 'video';
    if (item.mime_type?.startsWith('audio/')) return 'audio';
    return 'other';
  };

  const currentItems = searchQuery.trim() && searchResults.length > 0 ? searchResults : (data?.items || []);

  const typeCounts = (() => {
    const baseItems = data?.items || [];
    const counts = { all: baseItems.length, folder: 0, artifact: {} as Record<string, number>, asset: {} as Record<string, number> };
    for (const item of baseItems) {
      if (item.kind === 'folder') counts.folder++;
      else if (item.kind === 'artifact') {
        const subtype = item.type || 'artifact';
        counts.artifact[subtype] = (counts.artifact[subtype] || 0) + 1;
      } else if (item.kind === 'asset') {
        const subtype = getAssetSubtype(item);
        counts.asset[subtype] = (counts.asset[subtype] || 0) + 1;
      }
    }
    return counts;
  })();

  const filteredItems = currentItems.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter.kind === 'folder') return item.kind === 'folder';
    if (activeFilter.kind === 'artifact') {
      if (!activeFilter.subtype) return item.kind === 'artifact';
      return item.kind === 'artifact' && item.type === activeFilter.subtype;
    }
    if (activeFilter.kind === 'asset') {
      if (!activeFilter.subtype) return item.kind === 'asset';
      return item.kind === 'asset' && getAssetSubtype(item) === activeFilter.subtype;
    }
    return true;
  });

  const getFilterLabel = (): string => {
    if (activeFilter === 'all') return '';
    if (activeFilter.kind === 'folder') return 'Folders';
    if (activeFilter.kind === 'artifact') {
      const s = activeFilter.subtype;
      return !s ? 'Artifacts' : s.charAt(0).toUpperCase() + s.slice(1) + 's';
    }
    if (activeFilter.kind === 'asset') {
      const s = activeFilter.subtype;
      return !s ? 'Assets' : s.charAt(0).toUpperCase() + s.slice(1) + 's';
    }
    return '';
  };

  const getItemIcon = (item: PublicItem) => {
    if (item.kind === 'folder') return <FolderIcon fontSize="large" />;
    if (item.kind === 'asset') {
      if (item.is_image) return <ImageIcon fontSize="large" />;
      if (item.mime_type?.startsWith('audio/')) return <AudiotrackIcon fontSize="large" />;
      return <FileIcon fontSize="large" />;
    }
    if (item.kind === 'artifact') {
      if (item.type === 'note') return <ArticleIcon fontSize="large" />;
      if (item.type === 'map') return <MapIcon fontSize="large" />;
      if (item.type === 'gallery') return <PhotoLibraryIcon fontSize="large" />;
      if (item.type === 'composer') return <ComposerIcon fontSize="large" />;
      return <ArticleIcon fontSize="large" />;
    }
    return <FileIcon fontSize="large" />;
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>No data found</Typography>
      </Box>
    );
  }

  const content = () => {
    // Render folder view (breadcrumb + grid)
    if (data.kind === 'folder' && data.folder) {
      return (
        <Box sx={{ p: 3 }}>
          {/* Breadcrumb navigation */}
          {data.ancestors && data.ancestors.length > 0 && (
            <Breadcrumbs separator=" / " sx={{ mb: 3 }}>
              {data.ancestors.map((ancestor) => (
                <Link
                  key={ancestor.id}
                  component={NextLink}
                  href={ancestor.public_magic_id ? `/public/view/${ancestor.public_magic_id}` : '#'}
                  underline="hover"
                  color="inherit"
                >
                  {ancestor.name}
                </Link>
              ))}
              <Typography color="text.primary">{data.folder.name}</Typography>
            </Breadcrumbs>
          )}

          {/* Search + Type filter bar */}
          {data.kind === 'folder' && data.items && data.items.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <ClickAwayListener onClickAway={handleClickAway}>
                <Box sx={{ position: 'relative', maxWidth: 420, mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Search this folder..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    fullWidth
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
                      '& .MuiInputBase-root': {
                        borderRadius: 2,
                        bgcolor: 'background.paper',
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
                            component={NextLink}
                            href={item.public_magic_id || item.id ? `/public/view/${item.public_magic_id || item.id}` : '#'}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              px: 2,
                              py: 1.25,
                              cursor: 'pointer',
                              textDecoration: 'none',
                              color: 'inherit',
                              transition: 'background-color 0.15s ease',
                              '&:hover': { bgcolor: 'action.hover' },
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              '&:last-child': { borderBottom: 'none' },
                            }}
                          >
                            <Box sx={{ color: 'text.secondary' }}>{getItemIcon(item)}</Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              >
                                {item.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.kind === 'artifact' ? (item.type || 'artifact') : item.kind}
                              </Typography>
                            </Box>
                          </Box>
                        ))
                      )}
                    </Paper>
                  )}
                </Box>
              </ClickAwayListener>

              {/* Type filter pills */}
              {typeCounts.all > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip
                    label={`All (${typeCounts.all})`}
                    color={activeFilter === 'all' ? 'primary' : 'default'}
                    variant={activeFilter === 'all' ? 'filled' : 'outlined'}
                    onClick={() => setActiveFilter('all')}
                    sx={{ fontWeight: 600 }}
                  />
                  {Object.keys(typeCounts.artifact).length > 0 && (
                    <>
                      <Chip
                        label={`Artifacts (${Object.values(typeCounts.artifact).reduce((a, b) => a + b, 0)})`}
                        color={typeof activeFilter === 'object' && activeFilter.kind === 'artifact' ? 'primary' : 'default'}
                        variant={typeof activeFilter === 'object' && activeFilter.kind === 'artifact' ? 'filled' : 'outlined'}
                        onClick={(e) => setArtifactFilterAnchor(e.currentTarget)}
                        onDelete={typeof activeFilter === 'object' && activeFilter.kind === 'artifact' ? () => setActiveFilter('all') : undefined}
                        sx={{ fontWeight: 600 }}
                      />
                      <Menu
                        anchorEl={artifactFilterAnchor}
                        open={Boolean(artifactFilterAnchor)}
                        onClose={() => setArtifactFilterAnchor(null)}
                      >
                        <MenuItem
                          onClick={() => { setActiveFilter({ kind: 'artifact' }); setArtifactFilterAnchor(null); }}
                          selected={typeof activeFilter === 'object' && activeFilter.kind === 'artifact' && !activeFilter.subtype}
                        >
                          All Artifacts ({Object.values(typeCounts.artifact).reduce((a, b) => a + b, 0)})
                        </MenuItem>
                        {Object.entries(typeCounts.artifact)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([subtype, count]) => (
                            <MenuItem
                              key={subtype}
                              onClick={() => { setActiveFilter({ kind: 'artifact', subtype }); setArtifactFilterAnchor(null); }}
                              selected={typeof activeFilter === 'object' && activeFilter.kind === 'artifact' && activeFilter.subtype === subtype}
                            >
                              {subtype.charAt(0).toUpperCase() + subtype.slice(1)}s ({count})
                            </MenuItem>
                          ))}
                      </Menu>
                    </>
                  )}
                  {Object.keys(typeCounts.asset).length > 0 && (
                    <>
                      <Chip
                        label={`Assets (${Object.values(typeCounts.asset).reduce((a, b) => a + b, 0)})`}
                        color={typeof activeFilter === 'object' && activeFilter.kind === 'asset' ? 'primary' : 'default'}
                        variant={typeof activeFilter === 'object' && activeFilter.kind === 'asset' ? 'filled' : 'outlined'}
                        onClick={(e) => setAssetFilterAnchor(e.currentTarget)}
                        onDelete={typeof activeFilter === 'object' && activeFilter.kind === 'asset' ? () => setActiveFilter('all') : undefined}
                        sx={{ fontWeight: 600 }}
                      />
                      <Menu
                        anchorEl={assetFilterAnchor}
                        open={Boolean(assetFilterAnchor)}
                        onClose={() => setAssetFilterAnchor(null)}
                      >
                        <MenuItem
                          onClick={() => { setActiveFilter({ kind: 'asset' }); setAssetFilterAnchor(null); }}
                          selected={typeof activeFilter === 'object' && activeFilter.kind === 'asset' && !activeFilter.subtype}
                        >
                          All Assets ({Object.values(typeCounts.asset).reduce((a, b) => a + b, 0)})
                        </MenuItem>
                        {Object.entries(typeCounts.asset)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([subtype, count]) => (
                            <MenuItem
                              key={subtype}
                              onClick={() => { setActiveFilter({ kind: 'asset', subtype }); setAssetFilterAnchor(null); }}
                              selected={typeof activeFilter === 'object' && activeFilter.kind === 'asset' && activeFilter.subtype === subtype}
                            >
                              {subtype.charAt(0).toUpperCase() + subtype.slice(1)}s ({count})
                            </MenuItem>
                          ))}
                      </Menu>
                    </>
                  )}
                  {typeCounts.folder > 0 && (
                    <Chip
                      label={`Folders (${typeCounts.folder})`}
                      color={typeof activeFilter === 'object' && activeFilter.kind === 'folder' ? 'primary' : 'default'}
                      variant={typeof activeFilter === 'object' && activeFilter.kind === 'folder' ? 'filled' : 'outlined'}
                      onClick={() => setActiveFilter({ kind: 'folder' })}
                      onDelete={typeof activeFilter === 'object' && activeFilter.kind === 'folder' ? () => setActiveFilter('all') : undefined}
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* Items grid */}
          <Grid container spacing={2}>
            {filteredItems.map((item) => {
              // All items in a public folder are publicly accessible
              // Use magic_id if available, otherwise use regular id (for inherited public items)
              const itemUrl = item.public_magic_id || item.id
                ? `/public/view/${item.public_magic_id || item.id}`
                : '#';
              const isClickable = !!(item.public_magic_id || item.id);

              const isImage = item.kind === 'asset' && item.is_image;
              const isVideo = item.kind === 'asset' && item.mime_type?.startsWith('video/');
              const isMedia = isImage || isVideo;

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={`${item.kind}-${item.id}`}>
                  <Link
                    component={NextLink}
                    href={itemUrl}
                    underline="none"
                    color="inherit"
                  >
                    <Paper
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        overflow: 'hidden',
                        cursor: isClickable ? 'pointer' : 'default',
                        opacity: isClickable ? 1 : 0.6,
                        '&:hover': isClickable ? { bgcolor: 'action.hover' } : {},
                      }}
                    >
                      {isMedia ? (
                        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
                          <Box
                            component="img"
                            src={`${API_BASE_URL}/public/assets/${item.public_magic_id || item.id}/download?size=256`}
                            alt={item.name}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {isVideo && (
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: '50%',
                                  bgcolor: 'rgba(0,0,0,0.5)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <MovieIcon sx={{ color: '#fff', fontSize: 24 }} />
                              </Box>
                            </Box>
                          )}
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              zIndex: 1,
                              background: (theme) =>
                                `linear-gradient(to top, ${theme.palette.common.black} 0%, transparent 100%)`,
                              px: 1.5,
                              pb: 1.5,
                              pt: 4,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: '#fff',
                                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.name}
                            </Typography>
                            <Chip
                              label={item.kind === 'artifact' ? item.type : item.kind}
                              size="small"
                              variant="outlined"
                              sx={{
                                mt: 0.5,
                                color: 'rgba(255,255,255,0.85)',
                                borderColor: 'rgba(255,255,255,0.4)',
                                fontSize: '0.65rem',
                                height: 20,
                                '& .MuiChip-label': { px: 1 },
                              }}
                            />
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            aspectRatio: '4/3',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 2,
                          }}
                        >
                          <Box sx={{ mb: 1, color: 'text.secondary' }}>{getItemIcon(item)}</Box>
                          <Typography variant="subtitle2" align="center" noWrap sx={{ width: '100%' }}>
                            {item.name}
                          </Typography>
                          <Chip
                            label={item.kind === 'artifact' ? item.type : item.kind}
                            size="small"
                            sx={{ mt: 1 }}
                            color={item.kind === 'folder' ? 'primary' : 'default'}
                          />
                        </Box>
                      )}
                    </Paper>
                  </Link>
                </Grid>
              );
            })}
          </Grid>
          {filteredItems.length === 0 && data.items && data.items.length > 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {searchQuery.trim() ? 'No search results' : 'No items match this filter'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery.trim() ? 'Try a different search term' : 'Try selecting a different filter'}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    // Render asset view
    if (data.kind === 'asset' && data.asset) {
      return (
        <PublicAssetView
          id={data.asset.id}
          name={data.asset.name}
          mime_type={data.asset.mime_type}
          size_bytes={data.asset.size_bytes}
          human_readable_size={data.asset.human_readable_size}
          is_image={data.asset.is_image}
          public_magic_id={data.asset.public_magic_id}
        />
      );
    }

    // Render artifact view
    if (data.kind === 'artifact' && data.artifact) {
      const artifact = data.artifact;

      // Workflow artifacts render full page (no container)
      if (artifact.type === 'workflow' && artifact.content) {
        return (
          <WorkflowPublicView
            content={artifact.content}
            name={artifact.name}
            description={artifact.description}
            themeMode={data?.public_theme?.mode}
          />
        );
      }

      // Map artifacts render full page (no container)
      if (artifact.type === 'map' && artifact.content) {
        return (
          <MapPublicView
            content={artifact.content}
            name={artifact.name}
            description={artifact.description}
            themeMode={data?.public_theme?.mode}
          />
        );
      }

      // Gallery artifacts render full page (no container)
      if (artifact.type === 'gallery' && artifact.content) {
        return (
          <GalleryPublicView
            content={artifact.content}
            name={artifact.name}
            description={artifact.description}
          />
        );
      }

      // Composer artifacts
      if (artifact.type === 'composer') {
        return (
          <ComposerPublicView
            artifactId={artifact.id}
            publicMagicId={artifact.public_magic_id}
            themeMode={data?.public_theme?.mode}
          />
        );
      }

      // Repo artifacts
      if (artifact.type === 'repo') {
        // Check publish config for render mode
        const publish = artifact.publish;
        const slug = publish?.slug || '';
        const allowRepoView = publish?.allow_public_code_view ?? false;

        // If repo_view=true param and allow_public_code_view is enabled, show repo view
        if (repoViewParam && allowRepoView) {
          return (
            <RepoPublicView
              artifactId={artifact.id}
              publicMagicId={artifact.public_magic_id}
              themeMode={data?.public_theme?.mode}
            />
          );
        }

        if (publish?.render_mode === 'direct' && slug) {
          // Direct mode: redirect to the published site
          if (typeof window !== 'undefined') {
            window.location.replace(`${API_BASE_URL}/published/${slug}/`);
          }
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Redirecting to site...</Typography>
            </Box>
          );
        }

        if (publish?.render_mode === 'embedded' && slug) {
          // Embedded mode: iframe with nav bar
          return (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Navigation bar */}
              <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper' }}>
                <TerminalIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                  {artifact.name}
                </Typography>
                <Chip label="Static Site" size="small" color="primary" variant="outlined" />
                {allowRepoView && (
                  <Link
                    href={`/public/view/${artifact.public_magic_id}?repo_view=true`}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem', color: 'text.secondary' }}
                  >
                    View Code
                  </Link>
                )}
              </Box>
              {/* Iframe */}
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <iframe
                  src={`${API_BASE_URL}/published/${slug}/`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title={artifact.name}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </Box>
            </Box>
          );
        }

        // Default or repo_link mode: show repo view (with site link if published)
        return (
          <RepoPublicView
            artifactId={artifact.id}
            publicMagicId={artifact.public_magic_id}
            themeMode={data?.public_theme?.mode}
          />
        );
      }

      return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {artifact.name}
          </Typography>

          {artifact.type !== 'note' && artifact.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {artifact.description}
            </Typography>
          )}

          <Paper sx={{ p: 3 }}>
            {artifact.type === 'note' && artifact.content ? (
              <NotePublicView content={artifact.content} />
            ) : (
              <Typography color="text.secondary">
                Public view for artifact type &quot;{artifact.type}&quot; is not yet implemented.
              </Typography>
            )}
          </Paper>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Unknown item type</Typography>
      </Box>
    );
  };

  const isFullBleed =
    data?.kind === 'artifact' &&
    data.artifact != null &&
    (data.artifact.type === 'workflow' || data.artifact.type === 'map' || data.artifact.type === 'repo');

  return (
    <PublicShell fullBleed={isFullBleed}>
      {content()}
    </PublicShell>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import { Box, Typography, Grid, Paper, Breadcrumbs, Link, Chip } from '@mui/material';
import { Folder as FolderIcon, InsertDriveFile as FileIcon, Image as ImageIcon, Article as ArticleIcon, Map as MapIcon } from '@mui/icons-material';
import InlineThumbnail from '../../../../components/workspace/InlineThumbnail';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import { themeMap } from '../../../../themes';
import WorkflowPublicView from '../../../../components/workspace/WorkflowPublicView';
import { PublicAssetView, NotePublicView, MapPublicView } from '../../../../components/public/PublicViews';

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
  };
  ancestors?: AncestorItem[];
  items?: PublicItem[];
  total_items?: number;
  public_theme?: {
    name: string;
    mode: 'light' | 'dark';
  };
}

export default function PublicViewPage() {
  const params = useParams();
  const magicId = params.magicId as string;
  const [data, setData] = useState<PublicViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const publicTheme = React.useMemo(() => {
    const themeName = data?.public_theme?.name || 'mintCream';
    const themeMode = data?.public_theme?.mode || 'light';
    const themeVariant = themeMap[themeName];
    if (!themeVariant) {
      return createTheme(themeMap.mintCream.light);
    }
    return createTheme(themeVariant[themeMode] || themeVariant.light);
  }, [data?.public_theme]);

  const getItemIcon = (item: PublicItem) => {
    if (item.kind === 'folder') return <FolderIcon fontSize="large" />;
    if (item.kind === 'asset') {
      if (item.is_image) return <ImageIcon fontSize="large" />;
      return <FileIcon fontSize="large" />;
    }
    if (item.kind === 'artifact') {
      if (item.type === 'note') return <ArticleIcon fontSize="large" />;
      if (item.type === 'map') return <MapIcon fontSize="large" />;
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

          {/* Items grid */}
          <Grid container spacing={2}>
            {data.items?.map((item) => {
              // All items in a public folder are publicly accessible
              // Use magic_id if available, otherwise use regular id (for inherited public items)
              const itemUrl = item.public_magic_id || item.id 
                ? `/public/view/${item.public_magic_id || item.id}`
                : '#';
              const isClickable = !!(item.public_magic_id || item.id);
              
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
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: isClickable ? 'pointer' : 'default',
                        opacity: isClickable ? 1 : 0.6,
                        '&:hover': isClickable ? { bgcolor: 'action.hover' } : {},
                      }}
                    >
                      <Box sx={{ mb: 1, color: 'text.secondary' }}>{getItemIcon(item)}</Box>
                      <Typography variant="subtitle2" align="center" noWrap sx={{ width: '100%' }}>
                        {item.name}
                      </Typography>
                      <Chip
                        label={item.kind}
                        size="small"
                        sx={{ mt: 1 }}
                        color={item.kind === 'folder' ? 'primary' : 'default'}
                      />
                    </Paper>
                  </Link>
                </Grid>
              );
            })}
          </Grid>
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
          />
        );
      }

      return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {artifact.name}
          </Typography>

          {artifact.description && (
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

  return (
    <MUIThemeProvider theme={publicTheme}>
      <Box
        sx={{
          bgcolor: 'background.default',
          color: 'text.primary',
          minHeight: '100vh',
        }}
      >
        {content()}
      </Box>
    </MUIThemeProvider>
  );
}

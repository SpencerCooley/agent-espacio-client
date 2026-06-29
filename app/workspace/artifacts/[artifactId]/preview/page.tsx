'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, Paper } from '@mui/material';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import WorkflowPublicView from '../../../../../components/workspace/WorkflowPublicView';
import GalleryPublicView from '../../../../../components/workspace/GalleryPublicView';
import ComposerPublicView from '../../../../../components/workspace/ComposerPublicView';
import { NotePublicView, MapPublicView } from '../../../../../components/public/PublicViews';
import { useApp } from '../../../../../context/AppContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PreviewData {
  kind: string;
  artifact: {
    id: string;
    name: string;
    type: string;
    description?: string;
    content: any;
    public_magic_id: string;
  };
  public_theme: {
    theme_id: string;
    mode: 'light' | 'dark';
    definition: any;
  };
}

export default function ArtifactPreviewPage() {
  const params = useParams();
  const artifactId = params.artifactId as string;
  const { isAuthenticated, loading: authLoading } = useApp();
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artifactId || authLoading) return;
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/artifacts/${artifactId}/preview`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load preview');
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [artifactId, authLoading]);

  const theme = React.useMemo(() => {
    const definition = data?.public_theme?.definition;
    if (definition) {
      return createTheme(definition);
    }
    return createTheme({ palette: { mode: 'light' } });
  }, [data?.public_theme]);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Loading preview...</Typography>
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

  if (!data || !data.artifact) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>No artifact data</Typography>
      </Box>
    );
  }

  const artifact = data.artifact;

  const content = () => {
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
          isPreview
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
          isPreview
        />
      );
    }

    // Composer artifacts
    if (artifact.type === 'composer') {
      return (
        <ComposerPublicView
          artifactId={artifact.id}
          publicMagicId={artifact.public_magic_id}
          isPreview
          themeMode={data?.public_theme?.mode}
        />
      );
    }

    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
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
            <NotePublicView content={artifact.content} isPreview />
          ) : (
            <Typography color="text.secondary">
              Preview for artifact type &quot;{artifact.type}&quot; is not yet implemented.
            </Typography>
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <MUIThemeProvider theme={theme}>
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

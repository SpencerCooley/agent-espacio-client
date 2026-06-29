'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Alert, Divider } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import dynamic from 'next/dynamic';

const ComposerViewNote = dynamic(() => import('./ComposerViewNote'), { ssr: false });
const ComposerViewMap = dynamic(() => import('./ComposerViewMap'), { ssr: false });
const ComposerViewGallery = dynamic(() => import('./ComposerViewGallery'), { ssr: false });
const ComposerViewWorkflow = dynamic(() => import('./ComposerViewWorkflow'), { ssr: false });
const ComposerViewAsset = dynamic(() => import('./ComposerViewAsset'), { ssr: false });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CompositionSection {
  artifact: any;
  caption: string | null;
  artifact_id: string;
}

interface CompositionData {
  composer: any;
  sections: CompositionSection[];
  public_theme?: any;
}

interface ComposerPublicViewProps {
  artifactId: string;
  publicMagicId?: string;
  isPreview?: boolean;
  themeMode?: 'light' | 'dark';
}

function SectionView({
  section,
  isPreview,
  themeMode,
}: {
  section: CompositionSection;
  isPreview?: boolean;
  themeMode?: 'light' | 'dark';
}) {
  const item = section.artifact;

  if (!item) {
    return (
      <Alert severity="warning" icon={<WarningIcon />} sx={{ my: 2 }}>
        <Typography variant="body2">
          This section references an item that is not available or not public.
        </Typography>
      </Alert>
    );
  }

  // Assets have mime_type, artifacts have type
  const isAsset = !!item.mime_type;

  if (isAsset) {
    return (
      <Paper
        elevation={1}
        sx={{
          my: 3,
          p: { xs: 2, md: 3 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <ComposerViewAsset item={item} isPreview={isPreview} />
        {section.caption && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 3,
              fontStyle: 'italic',
              textAlign: 'center',
              px: 2,
            }}
          >
            {section.caption}
          </Typography>
        )}
      </Paper>
    );
  }

  const viewProps = {
    content: item.content,
    name: item.name,
    publicMagicId: item.public_magic_id || item.id,
    isPreview,
    themeMode,
  };

  let Component: React.ComponentType<any> | null = null;
  switch (item.type) {
    case 'note':
      Component = ComposerViewNote;
      break;
    case 'map':
      Component = ComposerViewMap;
      break;
    case 'gallery':
      Component = ComposerViewGallery;
      break;
    case 'workflow':
      Component = ComposerViewWorkflow;
      break;
    default:
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          <Typography variant="body2">
            Composer view for artifact type &quot;{item.type}&quot; is not yet implemented.
          </Typography>
        </Alert>
      );
  }

  if (!Component) return null;

  return (
    <Paper
      elevation={1}
      sx={{
        my: 3,
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Component {...viewProps} />
      {section.caption && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 3,
            fontStyle: 'italic',
            textAlign: 'center',
            px: 2,
          }}
        >
          {section.caption}
        </Typography>
      )}
    </Paper>
  );
}

export default function ComposerPublicView({
  artifactId,
  publicMagicId,
  isPreview,
  themeMode,
}: ComposerPublicViewProps) {
  const [data, setData] = useState<CompositionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        let url: string;
        let headers: Record<string, string> = {};

        if (publicMagicId && !isPreview) {
          // Public view
          url = `${API_BASE_URL}/public/composition/${publicMagicId}`;
        } else if (isPreview) {
          // Preview via auth
          const token = localStorage.getItem('accessToken');
          if (!token) {
            setError('Not authenticated');
            setLoading(false);
            return;
          }
          url = `${API_BASE_URL}/artifacts/${artifactId}/composition`;
          headers = { Authorization: `Bearer ${token}` };
        } else {
          // Workspace authenticated view
          const token = localStorage.getItem('accessToken');
          if (!token) {
            setError('Not authenticated');
            setLoading(false);
            return;
          }
          url = `${API_BASE_URL}/artifacts/${artifactId}/composition`;
          headers = { Authorization: `Bearer ${token}` };
        }

        const res = await fetch(url, { headers });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to load composition');
        }

        const result = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to load composition');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [artifactId, publicMagicId, isPreview]);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Loading composition...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data || !data.composer) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Composition not found</Alert>
      </Box>
    );
  }

  const composer = data.composer;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 6 }, py: 4 }}>
      <Typography variant="h1" sx={{ fontWeight: 700, mb: 1 }}>
        {composer.name}
      </Typography>
      {composer.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {composer.description}
        </Typography>
      )}

      <Divider sx={{ mb: 4 }} />

      {data.sections.map((section, index) => (
        <SectionView
          key={`${section.artifact_id}-${index}`}
          section={section}
          isPreview={isPreview}
          themeMode={themeMode}
        />
      ))}
    </Box>
  );
}

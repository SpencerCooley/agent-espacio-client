'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import WorkspaceLayout from '../../../../components/layout/WorkspaceLayout';
import { artifactService, Artifact } from '../../../../services/artifacts';

function ArtifactViewerContent() {
  const params = useParams();
  const artifactId = params.artifactId as string;

  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artifactId) return;

    setLoading(true);
    setError(null);

    artifactService.getArtifact(artifactId)
      .then((response) => {
        setArtifact(response);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load artifact');
        setLoading(false);
      });
  }, [artifactId]);

  const breadcrumb = artifact
    ? [
        { label: 'My Drive', href: '/workspace' },
        { label: artifact.name },
      ]
    : [{ label: 'My Drive', href: '/workspace' }];

  if (loading) {
    return (
      <WorkspaceLayout breadcrumb={breadcrumb}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      </WorkspaceLayout>
    );
  }

  if (error || !artifact) {
    return (
      <WorkspaceLayout breadcrumb={breadcrumb}>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Artifact not found'}
        </Alert>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout breadcrumb={breadcrumb}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          {artifact.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Type: {artifact.type}
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">
            Artifact viewer coming soon for &quot;{artifact.type}&quot; artifacts
          </Typography>
        </Paper>
      </Box>
    </WorkspaceLayout>
  );
}

export default function ArtifactViewerPage() {
  return (
    <ProtectedRoute>
      <ArtifactViewerContent />
    </ProtectedRoute>
  );
}

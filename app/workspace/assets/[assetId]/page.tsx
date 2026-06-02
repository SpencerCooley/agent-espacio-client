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
import { assetService, Asset } from '../../../../services/assets';

function AssetViewerContent() {
  const params = useParams();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) return;

    setLoading(true);
    setError(null);

    assetService.getAsset(assetId)
      .then((response) => {
        setAsset(response);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load asset');
        setLoading(false);
      });
  }, [assetId]);

  const breadcrumb = asset
    ? [
        { label: 'My Drive', href: '/workspace' },
        { label: asset.name },
      ]
    : [{ label: 'My Drive', href: '/workspace' }];

  // Left panel: file metadata
  const leftPanel = asset ? (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        File Info
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Name
        </Typography>
        <Typography variant="body2">{asset.name}</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Type
        </Typography>
        <Typography variant="body2">{asset.mime_type}</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Size
        </Typography>
        <Typography variant="body2">{asset.human_readable_size}</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Created
        </Typography>
        <Typography variant="body2">
          {new Date(asset.created_at).toLocaleDateString()}
        </Typography>
      </Box>
    </Box>
  ) : null;

  if (loading) {
    return (
      <WorkspaceLayout breadcrumb={breadcrumb}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      </WorkspaceLayout>
    );
  }

  if (error || !asset) {
    return (
      <WorkspaceLayout breadcrumb={breadcrumb}>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Asset not found'}
        </Alert>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout breadcrumb={breadcrumb} leftPanel={leftPanel}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          {asset.name}
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">
            Asset viewer coming soon for {asset.mime_type} files
          </Typography>
        </Paper>
      </Box>
    </WorkspaceLayout>
  );
}

export default function AssetViewerPage() {
  return (
    <ProtectedRoute>
      <AssetViewerContent />
    </ProtectedRoute>
  );
}

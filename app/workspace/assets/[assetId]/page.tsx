'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Button,
  Divider,
  Chip,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import WorkspaceLayout from '../../../../components/layout/WorkspaceLayout';
import { assetService, Asset, getAssetDownloadUrl } from '../../../../services/assets';
import { folderService } from '../../../../services/folders';
import { useAuthImage } from '../../../../hooks/useAuthImage';

function AssetViewerContent() {
  const params = useParams();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [ancestors, setAncestors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) return;

    setLoading(true);
    setError(null);

    assetService.getAsset(assetId)
      .then((response) => {
        setAsset(response);
        if (response.folder_id) {
          folderService.getFolderAncestors(response.folder_id)
            .then((res) => {
              const chain = res.ancestors
                .filter((f) => !f.is_root)
                .map((f) => ({
                  id: f.id,
                  name: f.name,
                }));
              setAncestors(chain);
            })
            .catch(() => {
              setAncestors([]);
            });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load asset');
        setLoading(false);
      });
  }, [assetId]);

  const breadcrumb = asset
    ? [
        { label: 'My Drive', href: '/workspace', folderId: '00000000-0000-0000-0000-000000000001' },
        ...ancestors.map((f) => ({
          label: f.name,
          href: `/workspace/folders/${f.id}`,
          folderId: f.id,
        })),
        { label: asset.name },
      ]
    : [{ label: 'My Drive', href: '/workspace' }];

  const dims = asset?.file_meta
    ? `${asset.file_meta.width} × ${asset.file_meta.height}`
    : null;

  const thumbSizes = asset?.file_meta?.thumbnails
    ? Object.keys(asset.file_meta.thumbnails).map(Number)
    : [];

  const imageUrl = asset?.is_image ? getAssetDownloadUrl(asset.id) : null;
  const imageSrc = useAuthImage(imageUrl);

  const handleDownload = async (url: string, filename: string) => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

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
      {dims && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Dimensions
          </Typography>
          <Typography variant="body2">{dims}</Typography>
        </Box>
      )}
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

      {thumbSizes.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
            Thumbnails
          </Typography>
          {thumbSizes.map((size) => {
            const meta = asset.file_meta!.thumbnails![String(size)];
            const label = meta
              ? `${size}px (${meta.w} × ${meta.h}, ${(meta.size_bytes / 1024).toFixed(0)}KB)`
              : `${size}px`;
            return (
              <Box key={size} sx={{ mb: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  fullWidth
                  startIcon={<Download />}
                  onClick={() => handleDownload(
                    getAssetDownloadUrl(asset.id, size),
                    `${asset.name.replace(/\.[^.]+$/, '')}_${size}px.webp`
                  )}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  {label}
                </Button>
              </Box>
            );
          })}
        </>
      )}
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
        {asset.is_image ? (
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400,
              bgcolor: 'background.default',
              overflow: 'auto',
            }}
          >
            {imageSrc ? (
              <Box
                component="img"
                src={imageSrc}
                alt={asset.name}
                sx={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 200px)',
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
              />
            ) : (
              <Typography color="text.secondary">Loading image...</Typography>
            )}
          </Paper>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              Preview not available for {asset.mime_type} files
            </Typography>
          </Paper>
        )}
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

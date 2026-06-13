'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Button,
  Divider,
  Snackbar,
  Switch,
  TextField,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import { Download, ContentCopy, Public, Lock } from '@mui/icons-material';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import WorkspaceLayout from '../../../../components/layout/WorkspaceLayout';
import MarkdownEditor from '../../../../components/workspace/MarkdownEditor';
import { assetService, Asset, getAssetDownloadUrl } from '../../../../services/assets';
import { folderService } from '../../../../services/folders';
import { useAuthImage } from '../../../../hooks/useAuthImage';
import { useAuthBlob } from '../../../../hooks/useAuthBlob';

function AssetViewerContent() {
  const params = useParams();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [ancestors, setAncestors] = useState<{ id: string; name: string; is_public: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Share state
  const [isPublic, setIsPublic] = useState(false);
  const [publicMagicId, setPublicMagicId] = useState<string | null>(null);
  const [isInherited, setIsInherited] = useState(false);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Markdown state
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) return;

    setLoading(true);
    setError(null);
    setMarkdownContent(null);

    assetService.getAsset(assetId)
      .then((response) => {
        setAsset(response);
        setIsPublic(response.is_public);
        setPublicMagicId(response.public_magic_id);

        if (response.folder_id) {
          folderService.getFolderAncestors(response.folder_id)
            .then((res) => {
              const chain = res.ancestors
                .filter((f) => !f.is_root)
                .map((f) => ({
                  id: f.id,
                  name: f.name,
                  is_public: f.is_public,
                }));
              setAncestors(chain);

              // Check if any ancestor is public (inherited)
              const hasPublicParent = chain.some((f) => f.is_public);
              setIsInherited(hasPublicParent);
              if (hasPublicParent) {
                setIsPublic(true);
              }
            })
            .catch(() => {
              setAncestors([]);
            });
        }

        // Fetch content if markdown
        if (response.is_markdown) {
          setLoadingContent(true);
          assetService.getContent(assetId)
            .then((content) => {
              setMarkdownContent(content);
              setLoadingContent(false);
            })
            .catch(() => {
              setLoadingContent(false);
            });
        }

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load asset');
        setLoading(false);
      });
  }, [assetId]);

  const handleSaveMarkdown = useCallback(async (content: string) => {
    if (!assetId) return;
    await assetService.updateContent(assetId, content);
    setSuccessMessage('File saved');
  }, [assetId]);

  const handleToggleShare = useCallback(async () => {
    if (!assetId || isShareLoading || isInherited) return;
    setIsShareLoading(true);
    try {
      const response = await assetService.shareAsset(assetId);
      setIsPublic(response.is_public);
      setPublicMagicId(response.public_magic_id);
      setSuccessMessage(
        response.is_public
          ? 'Asset is now publicly shared'
          : 'Asset is now private'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to toggle sharing';
      setError(message);
    } finally {
      setIsShareLoading(false);
    }
  }, [assetId, isShareLoading, isInherited]);

  const handleCopy = useCallback(() => {
    if (publicMagicId) {
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/public/view/${publicMagicId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [publicMagicId]);

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
    ? `${asset.file_meta.width} \u00d7 ${asset.file_meta.height}`
    : null;

  const thumbSizes = asset?.file_meta?.thumbnails
    ? Object.keys(asset.file_meta.thumbnails).map(Number)
    : [];

  const imageUrl = asset?.is_image ? getAssetDownloadUrl(asset.id) : null;
  const imageSrc = useAuthImage(imageUrl);

  const videoUrl = asset?.mime_type?.startsWith('video/') ? getAssetDownloadUrl(asset.id) : null;
  const videoSrc = useAuthBlob(videoUrl);

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

  const publicUrl = publicMagicId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/public/view/${publicMagicId}`
    : '';

  // Left panel: file metadata + share
  const leftPanel = asset ? (
    <Box sx={{ p: 2 }}>
      {/* File Info */}
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
      {dims && asset.is_image && (
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

      {asset.is_image && thumbSizes.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
            Thumbnails
          </Typography>
          {thumbSizes.map((size) => {
            const meta = asset.file_meta!.thumbnails![String(size)];
            const label = meta
              ? `${size}px (${meta.w} \u00d7 ${meta.h}, ${(meta.size_bytes / 1024).toFixed(0)}KB)`
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

      {/* Share Section */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
        {isPublic ? <Public color="primary" fontSize="small" /> : <Lock fontSize="small" />}
        Share
      </Typography>

      {isInherited && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This item is public because its parent folder is shared.
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Public access</Typography>
          <Switch
            checked={isPublic}
            onChange={handleToggleShare}
            disabled={isInherited || isShareLoading}
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {isPublic
            ? 'Anyone with the link can view this item'
            : 'Only logged-in users can access this item'}
        </Typography>
      </Box>

      {isPublic && publicUrl && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Public link
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              value={publicUrl}
              size="small"
              fullWidth
              InputProps={{
                readOnly: true,
              }}
            />
            <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
              <IconButton onClick={handleCopy} size="small" color={copied ? 'success' : 'default'}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
          </Box>
          {copied && (
            <Chip
              size="small"
              color="success"
              label="Copied to clipboard"
              sx={{ mt: 1 }}
            />
          )}
        </Paper>
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

  // Video detection
  const isVideo = asset.mime_type?.startsWith('video/');

  return (
    <WorkspaceLayout breadcrumb={breadcrumb} leftPanel={leftPanel}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, flexShrink: 0 }}>
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
        ) : isVideo ? (
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
            {videoSrc ? (
              <Box
                component="video"
                controls
                preload="metadata"
                src={videoSrc}
                sx={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 200px)',
                  borderRadius: 1,
                }}
              />
            ) : (
              <Typography color="text.secondary">Loading video...</Typography>
            )}
          </Paper>
        ) : asset.is_markdown ? (
          loadingContent ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : markdownContent !== null ? (
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <MarkdownEditor
                content={markdownContent}
                onSave={handleSaveMarkdown}
              />
            </Box>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">Failed to load content</Typography>
            </Paper>
          )
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              Preview not available for {asset.mime_type} files
            </Typography>
          </Paper>
        )}
      </Box>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
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

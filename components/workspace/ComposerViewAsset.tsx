'use client';

import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { ViewInAr as ModelIcon, Download as DownloadIcon } from '@mui/icons-material';
import { SmartVideoPlayer } from '../ui/SmartVideoPlayer';
import { AudioPlayerThemed } from '../ui/AudioPlayer';
import GlbViewer from './GlbViewer';
import { useAuthStreamingUrl } from '../../hooks/useAuthStreamingUrl';
import { useSignedAssetUrl } from '../../hooks/useSignedAssetUrl';
import { useInViewport } from '../../hooks/useInViewport';
import { getAssetSignedUrl } from '../../services/assets';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const GLB_VIEWER_HEIGHT = 400;

interface ComposerViewAssetProps {
  item: any;
  isPreview?: boolean;
  isPublicView?: boolean;
}

function ViewportGatedGlbViewer({
  src,
  name,
  thumbnailSrc,
  downloadUrl,
}: {
  src: string;
  name: string;
  thumbnailSrc: string | null;
  downloadUrl: string | null;
}) {
  const [containerRef, isInViewport] = useInViewport<HTMLDivElement>({
    bufferPx: 200,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!downloadUrl) return;
    setIsDownloading(true);
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: GLB_VIEWER_HEIGHT,
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        position: 'relative',
      }}
    >
      {downloadUrl && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={isDownloading}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 3,
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          {isDownloading ? 'Downloading...' : 'Download'}
        </Button>
      )}

      {isInViewport ? (
        <GlbViewer src={src} height={GLB_VIEWER_HEIGHT} />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            bgcolor: 'background.default',
          }}
        >
          {thumbnailSrc ? (
            <Box
              component="img"
              src={thumbnailSrc}
              alt={name}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.6,
              }}
            />
          ) : (
            <ModelIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
          )}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <ModelIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
              Scroll to view 3D
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default function ComposerViewAsset({ item, isPreview, isPublicView }: ComposerViewAssetProps) {
  if (!item) return null;

  const isVideo = item.mime_type?.startsWith('video/');
  const isAudio = item.mime_type?.startsWith('audio/');
  const isGlb = item.mime_type === 'model/gltf-binary';

  const publicUrl = `${API_BASE_URL}/public/assets/${item.public_magic_id || item.id}/download`;
  // Use signed URL in workspace/preview (non-public view), public URL in public view
  const authUrl = !isPublicView
    ? `${API_BASE_URL}/assets/${item.id}/download`
    : null;

  const streamUrl = useAuthStreamingUrl(authUrl);
  const src = isPublicView ? publicUrl : (streamUrl || '');
  const posterUrl = useSignedAssetUrl(item?.id || null, 512);
  const glbSrc = useSignedAssetUrl(isGlb && !isPublicView ? item.id : null);
  const isLoading = !isPublicView && !streamUrl;

  if (!isVideo && !isAudio && !isGlb) {
    return (
      <Typography color="text.secondary">
        This asset type cannot be previewed in a composition.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
        {item.name}
      </Typography>

      {isLoading && !isGlb && (
        <Box
          sx={{
            width: '100%',
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <CircularProgress size={32} />
        </Box>
      )}

      {isVideo && !isLoading && (
        <SmartVideoPlayer src={src} name={item.name} poster={posterUrl || undefined} />
      )}

      {isAudio && !isLoading && (
        <AudioPlayerThemed src={src} name={item.name} height={200} />
      )}

      {isGlb && (
        <ViewportGatedGlbViewer
          src={isPublicView ? publicUrl : (glbSrc || '')}
          name={item.name}
          thumbnailSrc={posterUrl}
          downloadUrl={isPublicView ? publicUrl : glbSrc}
        />
      )}
    </Box>
  );
}

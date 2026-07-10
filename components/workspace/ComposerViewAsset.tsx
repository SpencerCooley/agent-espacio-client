'use client';

import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { SmartVideoPlayer } from '../ui/SmartVideoPlayer';
import { AudioPlayerThemed } from '../ui/AudioPlayer';
import { useAuthStreamingUrl } from '../../hooks/useAuthStreamingUrl';
import { useSignedAssetUrl } from '../../hooks/useSignedAssetUrl';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ComposerViewAssetProps {
  item: any;
  isPreview?: boolean;
  isPublicView?: boolean;
}

export default function ComposerViewAsset({ item, isPreview, isPublicView }: ComposerViewAssetProps) {
  if (!item) return null;

  const isVideo = item.mime_type?.startsWith('video/');
  const isAudio = item.mime_type?.startsWith('audio/');

  const publicUrl = `${API_BASE_URL}/public/assets/${item.public_magic_id || item.id}/download`;
  // Use signed URL in workspace/preview (non-public view), public URL in public view
  const authUrl = !isPublicView
    ? `${API_BASE_URL}/assets/${item.id}/download`
    : null;

  const streamUrl = useAuthStreamingUrl(authUrl);
  const src = isPublicView ? publicUrl : (streamUrl || '');
  const posterUrl = useSignedAssetUrl(item?.id || null, 512);
  const isLoading = !isPublicView && !streamUrl;

  if (!isVideo && !isAudio) {
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

      {isLoading && (
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
    </Box>
  );
}

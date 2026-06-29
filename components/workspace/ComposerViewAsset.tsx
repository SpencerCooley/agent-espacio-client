'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { SmartVideoPlayer } from '../ui/SmartVideoPlayer';
import { AudioPlayerThemed } from '../ui/AudioPlayer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Fetches a protected asset URL with auth and returns a blob URL.
 * Works for video, audio, and any other binary asset.
 */
function useAuthBlob(url: string | null): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setBlobUrl(null);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setBlobUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setBlobUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url]);

  return blobUrl;
}

interface ComposerViewAssetProps {
  item: any;
  isPreview?: boolean;
}

export default function ComposerViewAsset({ item, isPreview }: ComposerViewAssetProps) {
  if (!item) return null;

  const isVideo = item.mime_type?.startsWith('video/');
  const isAudio = item.mime_type?.startsWith('audio/');

  const publicUrl = `${API_BASE_URL}/public/assets/${item.public_magic_id || item.id}/download`;
  const authUrl = isPreview
    ? `${API_BASE_URL}/assets/${item.id}/download`
    : null;

  const blobUrl = useAuthBlob(authUrl);
  const src = isPreview ? (blobUrl || '') : publicUrl;
  const isLoading = isPreview && !blobUrl;

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
        <SmartVideoPlayer src={src} name={item.name} />
      )}

      {isAudio && !isLoading && (
        <AudioPlayerThemed src={src} name={item.name} height={200} />
      )}
    </Box>
  );
}

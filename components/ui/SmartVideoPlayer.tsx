'use client';

import React from 'react';
import { Box } from '@mui/material';

interface SmartVideoPlayerProps {
  src: string;
  name?: string;
  maxHeight?: string;
  showLoadingText?: boolean;
  poster?: string;
}

/**
 * Simple video player that uses the browser's native controls.
 *
 * Uses preload="metadata" so the browser only loads enough to determine
 * duration and basic info, then streams on demand via HTTP Range requests.
 * No autoplay, no muted, no custom buffer logic — the browser handles it.
 *
 * `crossOrigin="anonymous"` is set so the browser properly handles CORS
 * headers for cross-origin video streaming.
 */
export function SmartVideoPlayer({
  src,
  name,
  maxHeight = '80vh',
  poster,
}: SmartVideoPlayerProps) {
  const [hasError, setHasError] = React.useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    setHasError(true);
    console.error('[SmartVideoPlayer] video error:', {
      src: video.src,
      errorCode: video.error?.code,
      errorMessage: video.error?.message,
      networkState: video.networkState,
      readyState: video.readyState,
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
      }}
    >
      <Box
        component="video"
        controls
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
        src={src}
        poster={poster}
        onError={handleError}
        sx={{
          maxWidth: '100%',
          maxHeight,
          borderRadius: 1,
          display: 'block',
        }}
      />
      {hasError && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(0,0,0,0.75)',
            color: '#fff',
            px: 2,
            py: 1,
            borderRadius: 1,
            fontSize: 14,
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          <div>Failed to load video</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Check browser console for details
          </div>
        </Box>
      )}
    </Box>
  );
}

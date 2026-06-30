'use client';

import { Box } from '@mui/material';

interface SmartVideoPlayerProps {
  src: string;
  name?: string;
  maxHeight?: string;
  showLoadingText?: boolean;
}

/**
 * Simple video player that uses the browser's native controls.
 *
 * Uses preload="metadata" so the browser only loads enough to determine
 * duration and basic info, then streams on demand via HTTP Range requests.
 * No autoplay, no muted, no custom buffer logic — the browser handles it.
 */
export function SmartVideoPlayer({
  src,
  name,
  maxHeight = '80vh',
}: SmartVideoPlayerProps) {
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
        src={src}
        sx={{
          maxWidth: '100%',
          maxHeight,
          borderRadius: 1,
          display: 'block',
        }}
      />
    </Box>
  );
}

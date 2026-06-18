'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// Minimum buffer duration in seconds before auto-playing
const MIN_BUFFER_SECONDS = 3;

interface SmartVideoPlayerProps {
  src: string;
  name?: string;
  maxHeight?: string;
  showLoadingText?: boolean;
}

/**
 * Smart Video Player with intelligent buffering
 * 
 * This component ensures smooth video playback by:
 * 1. Waiting for a minimum buffer (3 seconds) before auto-playing
 * 2. Showing a loading overlay with progress indicator
 * 3. Gracefully handling buffer underruns during playback
 * 4. Re-buffering and resuming if playback catches up to buffer
 */
export function SmartVideoPlayer({ 
  src, 
  name,
  maxHeight = '80vh',
  showLoadingText = true,
}: SmartVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [hasEnoughBuffer, setHasEnoughBuffer] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Calculate how many seconds are currently buffered ahead of current time
  const getBufferedSeconds = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.buffered.length === 0) return 0;
    
    const currentTime = video.currentTime;
    for (let i = 0; i < video.buffered.length; i++) {
      const start = video.buffered.start(i);
      const end = video.buffered.end(i);
      if (currentTime >= start && currentTime <= end) {
        return end - currentTime;
      }
    }
    return 0;
  }, []);

  // Check if we have enough buffer to start playing
  const checkBufferAndPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const bufferedSeconds = getBufferedSeconds();
    const duration = video.duration || 0;
    
    // Start playing if:
    // - We have our minimum buffer seconds, OR
    // - The remaining video is less than our minimum (almost done buffering)
    const remainingVideo = duration - video.currentTime;
    const targetBuffer = Math.min(MIN_BUFFER_SECONDS, remainingVideo);
    
    if (bufferedSeconds >= targetBuffer) {
      if (!hasEnoughBuffer) {
        setHasEnoughBuffer(true);
        setIsBuffering(false);
        // Small delay to ensure smooth start
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {
              // Auto-play blocked, show controls for manual play
              setShowControls(true);
            });
          }
        }, 100);
      }
    } else {
      // Update progress indicator
      const progress = Math.min((bufferedSeconds / MIN_BUFFER_SECONDS) * 100, 95);
      setBufferProgress(progress);
    }
  }, [getBufferedSeconds, hasEnoughBuffer]);

  // Handle progress updates (more data loaded)
  const handleProgress = useCallback(() => {
    checkBufferAndPlay();
  }, [checkBufferAndPlay]);

  // Handle metadata loaded (we know the duration now)
  const handleLoadedMetadata = useCallback(() => {
    checkBufferAndPlay();
  }, [checkBufferAndPlay]);

  // Handle waiting (buffer ran out during playback)
  const handleWaiting = useCallback(() => {
    setIsBuffering(true);
    setHasEnoughBuffer(false);
  }, []);

  // Handle playing (buffer recovered)
  const handlePlaying = useCallback(() => {
    setIsBuffering(false);
  }, []);

  // Handle can play (can start playing from current buffer)
  const handleCanPlay = useCallback(() => {
    if (!hasEnoughBuffer) {
      checkBufferAndPlay();
    }
  }, [checkBufferAndPlay, hasEnoughBuffer]);

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
        ref={videoRef}
        controls={showControls || !isBuffering}
        loop
        muted
        preload="auto"
        playsInline
        src={src}
        onLoadedMetadata={handleLoadedMetadata}
        onProgress={handleProgress}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onCanPlay={handleCanPlay}
        sx={{ 
          maxWidth: '100%', 
          maxHeight,
          borderRadius: 1, 
          display: 'block'
        }}
      />
      
      {/* Loading Overlay */}
      {isBuffering && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 1,
            zIndex: 10,
          }}
        >
          <CircularProgress 
            variant={bufferProgress > 0 ? "determinate" : "indeterminate"}
            value={bufferProgress}
            size={60}
            thickness={4}
            sx={{ color: 'white', mb: 2 }}
          />
          {showLoadingText && (
            <>
              <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                Loading video...
              </Typography>
              {bufferProgress > 0 && (
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5 }}>
                  {Math.round(bufferProgress)}%
                </Typography>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

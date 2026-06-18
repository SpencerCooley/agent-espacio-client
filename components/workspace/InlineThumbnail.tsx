'use client';

import { Box } from '@mui/material';
import { useAuthImage } from '../../hooks/useAuthImage';
import { getAssetDownloadUrl } from '../../services/assets';
import {
  Movie as MovieIcon,
} from '@mui/icons-material';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface InlineThumbnailProps {
  type: 'artifact' | 'asset';
  id: string;
  kind?: string;
  mime_type?: string;
  is_image?: boolean;
  public_magic_id?: string | null;
  size?: number;
  variant: 'editor' | 'public' | 'workspace';
}

export default function InlineThumbnail({
  type,
  id,
  kind,
  is_image,
  public_magic_id,
  size = 40,
  variant,
}: InlineThumbnailProps) {
  const isImage = type === 'asset' && (is_image || kind?.includes('image'));
  const isVideo = type === 'asset' && kind?.includes('video');

  // Use generated thumbnails for both images and videos (backend ffmpeg)
  const needsThumbnail = isImage || isVideo;
  const thumbnailSize = size > 100 ? 256 : size;

  if (variant === 'editor' || variant === 'workspace') {
    const thumbUrl = needsThumbnail ? getAssetDownloadUrl(id, thumbnailSize) : null;
    const thumbSrc = useAuthImage(thumbUrl);

    if (needsThumbnail && thumbSrc) {
      return (
        <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <Box
            component="img"
            src={thumbSrc}
            alt=""
            sx={{
              width: size,
              height: size,
              borderRadius: 0.5,
              objectFit: 'cover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
          {isVideo && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.3)',
                borderRadius: 0.5,
              }}
            >
              <MovieIcon sx={{ color: '#fff', fontSize: size * 0.4 }} />
            </Box>
          )}
        </Box>
      );
    }

    // Fallback icon for videos without a thumbnail
    if (isVideo) {
      return (
        <Box sx={{ width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MovieIcon sx={{ color: 'text.secondary', fontSize: size * 0.5 }} />
        </Box>
      );
    }
  } else {
    // public variant
    const publicUrl = `${API_BASE_URL}/public/assets/${public_magic_id || id}/download${needsThumbnail ? `?size=${thumbnailSize}` : ''}`;

    if (needsThumbnail) {
      return (
        <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <Box
            component="img"
            src={publicUrl}
            alt=""
            sx={{
              width: size,
              height: size,
              borderRadius: 0.5,
              objectFit: 'cover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
          {isVideo && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.3)',
                borderRadius: 0.5,
              }}
            >
              <MovieIcon sx={{ color: '#fff', fontSize: size * 0.4 }} />
            </Box>
          )}
        </Box>
      );
    }
  }

  return null;
}

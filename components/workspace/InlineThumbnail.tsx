'use client';

import { Box } from '@mui/material';
import { useAuthImage } from '../../hooks/useAuthImage';
import { useVideoThumbnail } from '../../hooks/useVideoThumbnail';
import { getAssetDownloadUrl } from '../../services/assets';
import {
  Image as ImageIcon,
  Movie as MovieIcon,
} from '@mui/icons-material';

interface InlineThumbnailProps {
  type: 'artifact' | 'asset';
  id: string;
  kind?: string;
  mime_type?: string;
  is_image?: boolean;
  public_magic_id?: string | null;
  size?: number;
  variant: 'editor' | 'public';
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

  if (variant === 'editor') {
    const imageUrl = isImage ? getAssetDownloadUrl(id, 128) : null;
    const thumbSrc = useAuthImage(imageUrl);
    const videoUrl = isVideo ? getAssetDownloadUrl(id) : null;
    const videoThumbSrc = useVideoThumbnail(videoUrl);

    if (isImage && thumbSrc) {
      return (
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
            flexShrink: 0,
          }}
        />
      );
    }
    if (isVideo && videoThumbSrc) {
      return (
        <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <Box
            component="video"
            src={videoThumbSrc}
            muted
            preload="metadata"
            sx={{
              width: size,
              height: size,
              borderRadius: 0.5,
              objectFit: 'cover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
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
        </Box>
      );
    }
  } else {
    // public variant
    const publicUrl = `http://localhost:8000/public/assets/${public_magic_id || id}/download`;

    if (isImage) {
      return (
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
            flexShrink: 0,
          }}
        />
      );
    }
    if (isVideo) {
      return (
        <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <Box
            component="video"
            src={publicUrl}
            muted
            preload="metadata"
            sx={{
              width: size,
              height: size,
              borderRadius: 0.5,
              objectFit: 'cover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
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
        </Box>
      );
    }
  }

  return null;
}

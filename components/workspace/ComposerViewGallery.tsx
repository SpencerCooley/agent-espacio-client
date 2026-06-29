'use client';

import React from 'react';
import { Box, Button, Typography, Chip } from '@mui/material';
import { OpenInNew as OpenInNewIcon, PhotoLibrary as PhotoLibraryIcon } from '@mui/icons-material';
import { useAuthImage } from '../../hooks/useAuthImage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface GalleryItem {
  asset_id: string;
  caption?: string;
}

interface ComposerViewGalleryProps {
  content: any;
  name: string;
  publicMagicId?: string;
  isPreview?: boolean;
}

function getImageUrl(assetId: string, isPreview?: boolean): string {
  const params = '?size=512';
  if (isPreview) {
    return `${API_BASE_URL}/assets/${assetId}/download${params}`;
  }
  return `${API_BASE_URL}/public/assets/${assetId}/download${params}`;
}

function GalleryThumbnail({
  assetId,
  isPreview,
  alt,
}: {
  assetId: string;
  isPreview?: boolean;
  alt?: string;
}) {
  const url = getImageUrl(assetId, isPreview);
  const blobUrl = useAuthImage(isPreview ? url : null);
  const src = isPreview ? (blobUrl || '') : url;

  if (isPreview && !blobUrl) {
    return (
      <Box
        sx={{
          width: '100%',
          height: 180,
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt || ''}
      sx={{
        width: '100%',
        height: 180,
        objectFit: 'cover',
        display: 'block',
      }}
    />
  );
}

export default function ComposerViewGallery({ content, name, publicMagicId, isPreview }: ComposerViewGalleryProps) {
  const items: GalleryItem[] = content?.items || [];
  const total = items.length;
  const previewItems = items.slice(0, 3);
  const remaining = Math.max(0, total - 3);

  const viewUrl = publicMagicId
    ? `/public/view/${publicMagicId}`
    : (isPreview ? window.location.pathname.replace('/preview', '') : undefined);

  if (total === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <PhotoLibraryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography color="text.secondary">This gallery is empty</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        {remaining > 0 && (
          <Chip
            label={`+${remaining} more`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {previewItems.map((item, index) => (
          <Box
            key={`${item.asset_id}-${index}`}
            sx={{
              flex: 1,
              minWidth: 0,
              borderRadius: 1,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <GalleryThumbnail
              assetId={item.asset_id}
              isPreview={isPreview}
              alt={item.caption || `Image ${index + 1}`}
            />
            {item.caption && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  p: 1,
                  bgcolor: 'background.paper',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.caption}
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      {viewUrl && (
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Button
            size="small"
            endIcon={<OpenInNewIcon />}
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View full gallery
          </Button>
        </Box>
      )}
    </Box>
  );
}

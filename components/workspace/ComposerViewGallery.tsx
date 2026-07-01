'use client';

import React from 'react';
import { Box, Button, Typography, Chip } from '@mui/material';
import { OpenInNew as OpenInNewIcon, PhotoLibrary as PhotoLibraryIcon } from '@mui/icons-material';
import { useSignedAssetUrl } from '../../hooks/useSignedAssetUrl';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Association {
  id: string;
  type: 'asset' | 'artifact';
  name?: string;
}

interface ComposerGalleryItem {
  association: Association;
  caption?: string;
}

interface ComposerViewGalleryProps {
  content: any;
  name: string;
  publicMagicId?: string;
  isPreview?: boolean;
  isPublicView?: boolean;
}

function getAssetIdFromItem(item: any): string | null {
  // Handle both formats:
  // 1. Standalone gallery: { asset_id: "...", caption: "..." }
  // 2. Composer section: { association: { id: "...", type: "asset" }, caption: "..." }
  return item?.asset_id || item?.association?.id || null;
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
  signedUrl: preSignedUrl,
  isPreview,
  isPublicView,
  alt,
}: {
  assetId: string;
  signedUrl?: string | null;
  isPreview?: boolean;
  isPublicView?: boolean;
  alt?: string;
}) {
  const liveSignedUrl = useSignedAssetUrl(!isPublicView ? assetId : null, 512);
  const publicUrl = getImageUrl(assetId, isPreview);

  // Priority: backend pre-signed URL > live signed URL (workspace/preview) > public URL
  const fullPreSignedUrl = preSignedUrl && preSignedUrl.startsWith('/') ? `${API_BASE_URL}${preSignedUrl}` : preSignedUrl;
  const src = fullPreSignedUrl || liveSignedUrl || publicUrl;

  if (!src) {
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

export default function ComposerViewGallery({ content, name, publicMagicId, isPreview, isPublicView }: ComposerViewGalleryProps) {
  const rawItems = content?.items || [];
  // Filter to only items with valid asset IDs (handles both standalone gallery and composer formats)
  const items = rawItems.filter((item: any) => {
    const assetId = getAssetIdFromItem(item);
    if (!assetId) return false;
    // If it has an association, verify it's an asset type
    if (item.association?.type && item.association.type !== 'asset') return false;
    return true;
  });
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
        {previewItems.map((item: any, index: number) => {
          const assetId = getAssetIdFromItem(item);
          return (
            <Box
              key={`${assetId}-${index}`}
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
                assetId={assetId!}
                signedUrl={item.signed_url}
                isPreview={isPreview}
                isPublicView={isPublicView}
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
          );
        })}
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

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Close,
} from '@mui/icons-material';
import { useSignedAssetUrl } from '../../hooks/useSignedAssetUrl';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface GalleryItem {
  asset_id: string;
  caption: string;
  signed_url?: string;
}

interface GalleryContent {
  layout: 'default' | 'carousel' | 'masonry';
  items: GalleryItem[];
}

interface GalleryPublicViewProps {
  content: any;
  name?: string;
  description?: string;
  isPreview?: boolean;
}

function getGalleryContent(content: unknown): GalleryContent {
  const c = (content || {}) as Partial<GalleryContent> & { items?: Array<{asset_id?: string; caption?: string; association?: {id: string; type?: string}}> };
  const rawItems = (Array.isArray(c.items) ? c.items : []) as any[];
  // Normalize items: handle both standalone gallery (asset_id) and composer (association.id)
  const items = rawItems.map((item: any) => ({
    asset_id: item.asset_id || item.association?.id || '',
    caption: item.caption || '',
    signed_url: item.signed_url || '',
  })).filter((item) => item.asset_id);
  return {
    layout: c.layout || 'default',
    items,
  };
}

function getImageUrl(assetId: string, size?: number, isPreview?: boolean): string {
  const params = size ? `?size=${size}` : '';
  if (isPreview) {
    return `${API_BASE_URL}/assets/${assetId}/download${params}`;
  }
  return `${API_BASE_URL}/public/assets/${assetId}/download${params}`;
}

/** Image component that uses pre-signed URL if available, falls back to public/preview URLs */
function GalleryImg({
  assetId,
  signedUrl: preSignedUrl,
  size,
  isPreview,
  alt,
  sx,
}: {
  assetId: string;
  signedUrl?: string | null;
  size?: number;
  isPreview?: boolean;
  alt?: string;
  sx?: React.ComponentProps<typeof Box>['sx'];
}) {
  const signedUrl = useSignedAssetUrl(isPreview ? assetId : null, size);
  const publicUrl = getImageUrl(assetId, size, isPreview);

  // Priority: pre-signed URL from backend > live signed URL (preview) > public URL
  const fullPreSignedUrl = preSignedUrl && preSignedUrl.startsWith('/') ? `${API_BASE_URL}${preSignedUrl}` : preSignedUrl;
  const src = fullPreSignedUrl || (isPreview ? signedUrl || '' : publicUrl);

  return (
    <Box
      component="img"
      src={src}
      alt={alt || ''}
      sx={{
        ...(sx as any),
        ...(isPreview && !signedUrl ? { bgcolor: 'action.hover', minHeight: 40 } : {}),
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Default Grid Layout                                                */
/* ------------------------------------------------------------------ */
function DefaultLayout({
  items,
  name,
  description,
  isPreview,
}: {
  items: GalleryItem[];
  name?: string;
  description?: string;
  isPreview?: boolean;
}) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const cols = isXs ? 1 : isSm ? 2 : 3;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {name && (
        <Typography variant="h4" sx={{ mb: description ? 1 : 2, fontWeight: 600 }}>
          {name}
        </Typography>
      )}
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 700 }}>
          {description}
        </Typography>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 2,
        }}
      >
        {items.map((item, index) => (
          <Box key={item.asset_id ? `${item.asset_id}-${index}` : `gallery-item-${index}`} sx={{ breakInside: 'avoid' }}>
            <GalleryImg
              assetId={item.asset_id}
              signedUrl={item.signed_url}
              size={512}
              isPreview={isPreview}
              alt={item.caption || `Image ${index + 1}`}
              sx={{
                width: '100%',
                borderRadius: 1,
                display: 'block',
                objectFit: 'cover',
                aspectRatio: '4/3',
              }}
            />
            {item.caption && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {item.caption}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Carousel Layout                                                    */
/* ------------------------------------------------------------------ */
function CarouselLayout({
  items,
  name,
  description,
  isPreview,
}: {
  items: GalleryItem[];
  name?: string;
  description?: string;
  isPreview?: boolean;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => {
    setCurrent((i) => (i > 0 ? i - 1 : items.length - 1));
  }, [items.length]);

  const goNext = useCallback(() => {
    setCurrent((i) => (i < items.length - 1 ? i + 1 : 0));
  }, [items.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (diff > 50) goNext();
    if (diff < -50) goPrev();
    touchStartX.current = null;
  };

  // Keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext]);

  if (items.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">This gallery is empty.</Typography>
      </Box>
    );
  }

  const currentItem = items[current];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        height: '100vh',
        overflow: 'hidden',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Thumbnail reel */}
      <Box
        sx={{
          width: isMobile ? '100%' : 200,
          height: isMobile ? 100 : '100%',
          flexShrink: 0,
          overflowX: isMobile ? 'auto' : 'hidden',
          overflowY: isMobile ? 'hidden' : 'auto',
          bgcolor: 'background.paper',
          borderRight: isMobile ? 'none' : '1px solid',
          borderBottom: isMobile ? '1px solid' : 'none',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          gap: 1,
          p: 1,
        }}
      >
        {items.map((item, index) => (
          <Box
            key={item.asset_id ? `${item.asset_id}-${index}` : `gallery-item-${index}`}
            onClick={() => setCurrent(index)}
            sx={{
              flexShrink: 0,
              cursor: 'pointer',
              border: index === current ? '2px solid' : '2px solid transparent',
              borderColor: index === current ? 'primary.main' : 'transparent',
              borderRadius: 1,
              overflow: 'hidden',
              opacity: index === current ? 1 : 0.6,
              transition: 'opacity 0.15s',
              width: isMobile ? 80 : '100%',
              height: isMobile ? 80 : 60,
            }}
          >
            <GalleryImg
              assetId={item.asset_id}
              signedUrl={item.signed_url}
              size={256}
              isPreview={isPreview}
              alt={item.caption || `Image ${index + 1}`}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>
        ))}
      </Box>

      {/* Main image area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header info */}
        {(name || description) && (
          <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 2, md: 3 }, pb: 1 }}>
            {name && (
              <Typography variant="h4" sx={{ fontWeight: 600, mb: description ? 0.5 : 0 }}>
                {name}
              </Typography>
            )}
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
        )}

        <Box
          sx={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Sliding image strip */}
          <Box
            sx={{
              display: 'flex',
              height: '100%',
              transition: 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
              transform: `translateX(-${current * 100}%)`,
            }}
          >
            {items.map((item, index) => (
              <Box
                key={item.asset_id ? `${item.asset_id}-${index}` : `gallery-slide-${index}`}
                sx={{
                  width: '100%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: { xs: 2, md: 4 },
                  pb: { xs: 2, md: 4 },
                }}
              >
                <GalleryImg
                  assetId={item.asset_id}
                  signedUrl={item.signed_url}
                  isPreview={isPreview}
                  alt={item.caption || `Image ${index + 1}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: 1,
                  }}
                />
              </Box>
            ))}
          </Box>

          {/* Prev arrow */}
          <IconButton
            onClick={goPrev}
            sx={{
              position: 'absolute',
              left: { xs: 4, md: 16 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              bgcolor: 'rgba(0,0,0,0.4)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
            }}
          >
            <ChevronLeft />
          </IconButton>

          {/* Next arrow */}
          <IconButton
            onClick={goNext}
            sx={{
              position: 'absolute',
              right: { xs: 4, md: 16 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              bgcolor: 'rgba(0,0,0,0.4)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Caption + counter */}
        <Box sx={{ px: { xs: 2, md: 4 }, pt: 2, pb: { xs: 6, md: 8 }, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.9rem' }}>
            {current + 1} / {items.length}
          </Typography>
          {currentItem.caption && (
            <Typography variant="h6" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
              {currentItem.caption}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Masonry Layout                                                     */
/* ------------------------------------------------------------------ */
function MasonryLayout({
  items,
  name,
  description,
  isPreview,
}: {
  items: GalleryItem[];
  name?: string;
  description?: string;
  isPreview?: boolean;
}) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const columnCount = isXs ? 2 : isSm ? 2 : 3;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const lightboxPrev = () => {
    setLightboxIndex((i) => (i > 0 ? i - 1 : items.length - 1));
  };

  const lightboxNext = () => {
    setLightboxIndex((i) => (i < items.length - 1 ? i + 1 : 0));
  };

  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleLightboxTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (diff > 50) lightboxNext();
    if (diff < -50) lightboxPrev();
    touchStartX.current = null;
  };

  // Keyboard arrow navigation inside lightbox modal only
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        lightboxPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        lightboxNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxPrev, lightboxNext]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {name && (
        <Typography variant="h4" sx={{ mb: description ? 1 : 2, fontWeight: 600 }}>
          {name}
        </Typography>
      )}
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 700 }}>
          {description}
        </Typography>
      )}

      <Box
        sx={{
          columnCount,
          columnGap: 2,
        }}
      >
        {items.map((item, index) => (
          <Box
            key={item.asset_id ? `${item.asset_id}-${index}` : `gallery-item-${index}`}
            onClick={() => openLightbox(index)}
            sx={{
              breakInside: 'avoid',
              mb: 2,
              cursor: 'pointer',
              borderRadius: 1,
              overflow: 'hidden',
              transition: 'transform 0.15s, box-shadow 0.15s',
              '&:hover': { transform: 'scale(1.01)', boxShadow: 4 },
            }}
          >
            <GalleryImg
              assetId={item.asset_id}
              signedUrl={item.signed_url}
              size={512}
              isPreview={isPreview}
              alt={item.caption || `Image ${index + 1}`}
              sx={{ width: '100%', display: 'block' }}
            />
            {item.caption && (
              <Box sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                <Typography variant="body2">{item.caption}</Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Lightbox Modal */}
      <Dialog
        open={lightboxOpen}
        onClose={closeLightbox}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.95)',
            color: '#fff',
            m: 0,
            maxWidth: '100%',
            maxHeight: '100%',
            width: '100%',
            height: '100%',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box
          sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}
          onTouchStart={handleLightboxTouchStart}
          onTouchEnd={handleLightboxTouchEnd}
        >
          {/* Close button */}
          <IconButton
            onClick={closeLightbox}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              color: '#fff',
              bgcolor: 'rgba(0,0,0,0.4)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
            }}
          >
            <Close />
          </IconButton>

          {/* Sliding image strip */}
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                height: '100%',
                transition: 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                transform: `translateX(-${lightboxIndex * 100}%)`,
              }}
            >
              {items.map((item, index) => (
                <Box
                  key={item.asset_id ? `${item.asset_id}-${index}` : `lightbox-slide-${index}`}
                  sx={{
                    width: '100%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: { xs: 2, md: 8 },
                    py: 2,
                  }}
                >
                  <GalleryImg
                    assetId={item.asset_id}
                    signedUrl={item.signed_url}
                    isPreview={isPreview}
                    alt={item.caption || `Image ${index + 1}`}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '80vh',
                      objectFit: 'contain',
                      borderRadius: 1,
                    }}
                  />
                </Box>
              ))}
            </Box>

            {items.length > 1 && (
              <>
                <IconButton
                  onClick={lightboxPrev}
                  sx={{
                    position: 'absolute',
                    left: { xs: 4, md: 16 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 2,
                    color: '#fff',
                    bgcolor: 'rgba(0,0,0,0.4)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                  }}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton
                  onClick={lightboxNext}
                  sx={{
                    position: 'absolute',
                    right: { xs: 4, md: 16 },
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 2,
                    color: '#fff',
                    bgcolor: 'rgba(0,0,0,0.4)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </>
            )}
          </Box>

          {/* Caption */}
          <Box sx={{ px: { xs: 2, md: 4 }, pt: 2, pb: { xs: 6, md: 8 }, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1.5, fontSize: '0.9rem' }}>
              {lightboxIndex + 1} / {items.length}
            </Typography>
            {items[lightboxIndex]?.caption && (
              <Typography variant="h6" sx={{ fontWeight: 500, lineHeight: 1.4, color: '#fff' }}>
                {items[lightboxIndex].caption}
              </Typography>
            )}
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Main Public View                                                   */
/* ------------------------------------------------------------------ */
export default function GalleryPublicView({ content, name, description, isPreview }: GalleryPublicViewProps) {
  const gallery = getGalleryContent(content);

  if (gallery.items.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          {name || 'Gallery'}
        </Typography>
        <Typography color="text.secondary">This gallery is empty.</Typography>
      </Box>
    );
  }

  switch (gallery.layout) {
    case 'carousel':
      return <CarouselLayout items={gallery.items} name={name} description={description} isPreview={isPreview} />;
    case 'masonry':
      return <MasonryLayout items={gallery.items} name={name} description={description} isPreview={isPreview} />;
    case 'default':
    default:
      return <DefaultLayout items={gallery.items} name={name} description={description} isPreview={isPreview} />;
  }
}

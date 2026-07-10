'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Link,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import NextLink from 'next/link';
import PublicShell from './PublicShell';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface FeedItem {
  id: string;
  name: string;
  description?: string;
  public_magic_id: string | null;
  created_at?: string;
  updated_at?: string;
  meta?: any;
  cover_url?: string | null;
}

interface FeedResponse {
  items: FeedItem[];
  total: number;
  has_more: boolean;
  public_theme?: {
    theme_id: string;
    mode: 'light' | 'dark';
    definition: any;
  };
}

interface PublicFeedProps {
  tag?: string;
  title?: string;
}

type CardSize = 'hero' | 'large' | 'medium' | 'compact';

/* ------------------------------------------------------------------ */
/* Card sizing config                                                 */
/* ------------------------------------------------------------------ */

const SIZE_CONFIG: Record<CardSize, {
  colSpan: number;
  imageAspect: string;
  imageMaxHeight: number;
  titleVariant: 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1';
  descLines: number | null;
  tagSize: 'small' | 'medium';
  tagCount: number | null;
  padding: number;
}> = {
  hero: {
    colSpan: 12,
    imageAspect: '16 / 9',
    imageMaxHeight: 420,
    titleVariant: 'h4',
    descLines: null,      // no truncation
    tagSize: 'small',
    tagCount: null,
    padding: 2,
  },
  large: {
    colSpan: 6,
    imageAspect: '4 / 3',
    imageMaxHeight: 260,
    titleVariant: 'h5',
    descLines: null,
    tagSize: 'small',
    tagCount: null,
    padding: 1.5,
  },
  medium: {
    colSpan: 4,
    imageAspect: '4 / 3',
    imageMaxHeight: 200,
    titleVariant: 'h6',
    descLines: null,
    tagSize: 'small',
    tagCount: null,
    padding: 1.5,
  },
  compact: {
    colSpan: 3,
    imageAspect: '4 / 3',
    imageMaxHeight: 160,
    titleVariant: 'subtitle1',
    descLines: null,
    tagSize: 'small',
    tagCount: 3,
    padding: 1.5,
  },
};

function getCardSize(index: number): CardSize {
  if (index === 0) return 'hero';
  if (index >= 1 && index <= 2) return 'large';
  if (index >= 3 && index <= 5) return 'medium';
  return 'compact';
}

/* ------------------------------------------------------------------ */
/* Sub-component: FeedCard                                            */
/* ------------------------------------------------------------------ */

function FeedCard({ item, size }: { item: FeedItem; size: CardSize }) {
  const cfg = SIZE_CONFIG[size];
  const itemUrl = item.public_magic_id
    ? `/public/view/${item.public_magic_id}`
    : '#';
  const tags = item.meta?.tags || [];
  const coverUrl = item.cover_url
    ? `${API_BASE_URL}${item.cover_url}`
    : null;
  const visibleTags = cfg.tagCount !== null ? tags.slice(0, cfg.tagCount) : tags;

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Link
        component={NextLink}
        href={itemUrl}
        underline="none"
        color="inherit"
        sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {coverUrl && (
          <Box
            component="img"
            src={coverUrl}
            alt={item.name}
            sx={{
              width: '100%',
              aspectRatio: cfg.imageAspect,
              maxHeight: cfg.imageMaxHeight,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}

        <Box sx={{ p: cfg.padding, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant={cfg.titleVariant}
            sx={{
              fontWeight: 600,
              mb: cfg.descLines === 0 ? 0 : 0.75,
              color: 'text.primary',
              lineHeight: 1.3,
            }}
          >
            {item.name}
          </Typography>

          {cfg.descLines !== 0 && item.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                lineHeight: 1.5,
                ...(cfg.descLines !== null && {
                  display: '-webkit-box',
                  WebkitLineClamp: cfg.descLines,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }),
              }}
            >
              {item.description}
            </Typography>
          )}

          {visibleTags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 'auto', pt: 1, flexWrap: 'wrap' }}>
              {visibleTags.map((t: string) => (
                <Chip
                  key={t}
                  label={t}
                  size={cfg.tagSize}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 22, textTransform: 'lowercase' }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Link>
    </Paper>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export default function PublicFeed({ tag, title }: PublicFeedProps) {
  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(`${API_BASE_URL}/feed`);
    if (tag) url.searchParams.set('tag', tag);
    url.searchParams.set('limit', '20');
    url.searchParams.set('offset', '0');

    fetch(url.toString())
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to load feed');
        }
        return res.json();
      })
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load feed');
        setLoading(false);
      });
  }, [tag]);

  const items = data?.items || [];

  /* ---------------------------------------------------------------- */
  /* Feed grid                                                          */
  /* ---------------------------------------------------------------- */

  const feedContent = (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3, lg: 4 }, py: 4 }}>
      {title && (
        <Typography
          variant="h1"
          sx={{ fontWeight: 700, mb: 3, fontSize: { xs: '2rem', md: '2.5rem' } }}
        >
          {title}
        </Typography>
      )}

      {items.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No featured compositions yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compositions added to the curated feed will appear here.
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 2.5,
        }}
      >
        {items.map((item, index) => {
          const size = getCardSize(index);
          const colSpan = SIZE_CONFIG[size].colSpan;

          // Mobile: first card full width, rest 2 per row (span 6)
          const mobileSpan = index === 0 ? 12 : 6;

          return (
            <Box
              key={item.id}
              sx={{
                gridColumn: { xs: `span ${mobileSpan}`, md: `span ${colSpan}` },
              }}
            >
              <FeedCard item={item} size={size} />
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  const innerContent = loading ? (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <CircularProgress size={32} />
    </Box>
  ) : error ? (
    <Box sx={{ p: 4 }}>
      <Alert severity="error">{error}</Alert>
    </Box>
  ) : (
    feedContent
  );

  return <PublicShell>{innerContent}</PublicShell>;
}

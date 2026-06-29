'use client';

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { NotePublicView } from '../public/PublicViews';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ComposerViewNoteProps {
  content: any;
  name: string;
  publicMagicId?: string;
  isPreview?: boolean;
}

/**
 * Recursively scan TipTap content for image nodes and collect asset IDs.
 */
function collectImageAssetIds(content: any): string[] {
  const ids: string[] = [];
  if (!content || typeof content !== 'object') return ids;

  // Handle arrays (e.g., the top-level content array)
  if (Array.isArray(content)) {
    for (const child of content) {
      ids.push(...collectImageAssetIds(child));
    }
    return ids;
  }

  if (content.type === 'image' && content.attrs?.['data-asset-id']) {
    ids.push(content.attrs['data-asset-id']);
  }

  if (Array.isArray(content.content)) {
    for (const child of content.content) {
      ids.push(...collectImageAssetIds(child));
    }
  }

  return ids;
}

/**
 * Deep-clone content and replace image src attributes with blob URLs.
 */
function replaceImageSrcs(content: any, blobMap: Record<string, string>): any {
  if (!content || typeof content !== 'object') return content;

  // Handle arrays (e.g., the top-level content array)
  if (Array.isArray(content)) {
    return content.map((child: any) => replaceImageSrcs(child, blobMap));
  }

  if (content.type === 'image' && content.attrs?.['data-asset-id']) {
    const assetId = content.attrs['data-asset-id'];
    const blobUrl = blobMap[assetId];
    if (blobUrl) {
      return {
        ...content,
        attrs: {
          ...content.attrs,
          src: blobUrl,
        },
      };
    }
  }

  if (Array.isArray(content.content)) {
    return {
      ...content,
      content: content.content.map((child: any) => replaceImageSrcs(child, blobMap)),
    };
  }

  return content;
}

export default function ComposerViewNote({ content, isPreview }: ComposerViewNoteProps) {
  const [processedContent, setProcessedContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const blobMapRef = React.useRef<Record<string, string>>({});

  useEffect(() => {
    const loadImages = async () => {
      const token = localStorage.getItem('accessToken');
      if (!content?.content || !token) {
        setProcessedContent(content);
        setLoading(false);
        return;
      }

      const assetIds = collectImageAssetIds(content.content);
      if (assetIds.length === 0) {
        setProcessedContent(content);
        setLoading(false);
        return;
      }

      // Fetch all images in parallel
      const blobMap: Record<string, string> = {};
      await Promise.all(
        assetIds.map(async (assetId) => {
          try {
            const res = await fetch(`${API_BASE_URL}/assets/${assetId}/download`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const blob = await res.blob();
            blobMap[assetId] = URL.createObjectURL(blob);
          } catch {
            // Ignore failed images
          }
        })
      );

      blobMapRef.current = blobMap;

      const newContent = {
        ...content,
        content: replaceImageSrcs(content.content, blobMap),
      };

      setProcessedContent(newContent);
      setLoading(false);
    };

    loadImages();

    // Cleanup blob URLs on unmount or when content changes
    return () => {
      Object.values(blobMapRef.current).forEach((url) => {
        URL.revokeObjectURL(url);
      });
      blobMapRef.current = {};
    };
  }, [content, isPreview]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!processedContent?.content) return null;

  // Pass isPreview={false} so NotePublicView doesn't rewrite URLs
  return (
    <Box>
      <NotePublicView content={processedContent} isPreview={false} />
    </Box>
  );
}

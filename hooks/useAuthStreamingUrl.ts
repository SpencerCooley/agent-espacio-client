'use client';

import { useMemo } from 'react';
import { useSignedAssetUrl } from './useSignedAssetUrl';

/**
 * Returns a signed streaming URL for video/audio assets.
 *
 * Accepts either a raw asset download URL (legacy) or an asset ID directly.
 * Returns a time-bound signed URL that supports HTTP Range requests
 * for native browser streaming.
 */
export function useAuthStreamingUrl(urlOrId: string | null): string | null {
  const assetId = useMemo(() => {
    if (!urlOrId) return null;
    // If it looks like a UUID (no slashes), use it directly
    if (!urlOrId.includes('/')) return urlOrId;
    // Otherwise extract from URL path
    const match = urlOrId.match(/\/assets\/([a-f0-9-]+)\/download/);
    return match ? match[1] : null;
  }, [urlOrId]);

  return useSignedAssetUrl(assetId);
}

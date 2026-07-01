'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAssetSignedUrl, API_BASE_URL } from '../services/assets';

interface CacheEntry {
  url: string;
  expiry: number; // Unix timestamp in ms
}

// Module-level cache shared across all hook instances
const signedUrlCache = new Map<string, CacheEntry>();
const REFRESH_BUFFER_MS = 120000; // Refresh when < 2 min from expiry

/**
 * Hook to get a time-bound signed URL for an asset.
 *
 * Fetches a signed URL from the backend, caches it, and auto-refreshes
 * when approaching expiry. Returns the full URL ready for <img src={...}>.
 *
 * @param assetId - Asset UUID (null = no fetch)
 * @param size - Optional thumbnail size
 * @returns Signed URL or null if loading/error
 */
export function useSignedAssetUrl(assetId: string | null, size?: number): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSignedUrl = useCallback(async () => {
    if (!assetId) {
      setSignedUrl(null);
      return;
    }

    const cacheKey = `${assetId}:${size || ''}`;
    const cached = signedUrlCache.get(cacheKey);
    const now = Date.now();

    // Use cached URL if it has > 2 minutes of life left
    if (cached && cached.expiry > now + REFRESH_BUFFER_MS) {
      setSignedUrl(cached.url);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const path = await getAssetSignedUrl(assetId, size);
      if (!isMountedRef.current || controller.signal.aborted) return;

      const fullUrl = `${API_BASE_URL}${path}`;
      // Cache for 10 minutes (600000 ms)
      signedUrlCache.set(cacheKey, { url: fullUrl, expiry: now + 600000 });
      setSignedUrl(fullUrl);
    } catch (err) {
      if (!isMountedRef.current || controller.signal.aborted) return;
      console.error('Failed to get signed asset URL', err);
      setSignedUrl(null);
    }
  }, [assetId, size]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchSignedUrl();
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchSignedUrl]);

  return signedUrl;
}

/**
 * Hook for streaming media (video/audio) that needs range request support.
 * Same caching behavior as useSignedAssetUrl.
 */
export function useSignedStreamingUrl(assetId: string | null): string | null {
  return useSignedAssetUrl(assetId);
}

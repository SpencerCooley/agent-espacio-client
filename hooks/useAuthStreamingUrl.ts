'use client';

import { useMemo } from 'react';
import { getToken } from '../services/api';

/**
 * Returns an authenticated streaming URL by appending the auth token
 * as a query parameter. This allows <video> and <audio> elements to
 * stream content natively with HTTP Range request support, instead of
 * downloading the entire file into memory as a blob.
 */
export function useAuthStreamingUrl(url: string | null): string | null {
  return useMemo(() => {
    if (!url) return null;
    const token = getToken();
    if (!token) return null;

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}access_token=${encodeURIComponent(token)}`;
  }, [url]);
}

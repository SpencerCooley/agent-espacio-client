'use client';

import { useState, useEffect, useRef } from 'react';
import { getToken } from '../services/api';

export function useAuthImage(url: string | null): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url) {
      setBlobUrl(null);
      return;
    }

    const token = getToken();
    if (!token) return;

    const controller = new AbortController();

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.blob();
      })
      .then((blob) => {
        const objUrl = URL.createObjectURL(blob);
        setBlobUrl(objUrl);
        blobUrlRef.current = objUrl;
      })
      .catch(() => setBlobUrl(null));

    return () => {
      controller.abort();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [url]);

  return blobUrl;
}

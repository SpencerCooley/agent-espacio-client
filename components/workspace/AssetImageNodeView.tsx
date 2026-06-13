'use client';

import { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { CircularProgress } from '@mui/material';
import { API_BASE_URL, getToken } from '../../services/api';

type ImageState =
  | { status: 'loading' }
  | { status: 'loaded'; blobUrl: string }
  | { status: 'error' };

export default function AssetImageNodeView(props: NodeViewProps) {
  const { node } = props;
  const rawSrc: string | undefined = node.attrs.src;
  const downloadUrl = rawSrc
    ? rawSrc.startsWith('/') ? `${API_BASE_URL}${rawSrc}` : rawSrc
    : null;
  const [state, setState] = useState<ImageState>({ status: 'loading' });
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!downloadUrl) {
      setState({ status: 'error' });
      return;
    }

    const token = getToken();
    if (!token) {
      setState({ status: 'error' });
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const objUrl = URL.createObjectURL(blob);
        blobUrlRef.current = objUrl;
        setState({ status: 'loaded', blobUrl: objUrl });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [downloadUrl]);

  const textAlign: string | null = node.attrs.textAlign ?? null;

  return (
    <NodeViewWrapper
      style={{
        display: 'block',
        textAlign: textAlign || undefined,
        width: '100%',
      }}
    >
      {state.status === 'loading' && <CircularProgress size={16} sx={{ verticalAlign: 'middle' }} />}
      {state.status === 'error' && (
        <span style={{ color: 'red', fontSize: '0.8rem' }}>Failed to load image</span>
      )}
      {state.status === 'loaded' && (
        <img
          src={state.blobUrl}
          alt={node.attrs.alt || ''}
          draggable={false}
          style={{
            maxWidth: '100%',
            maxHeight: '70vh',
            borderRadius: 4,
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            verticalAlign: 'middle',
          }}
        />
      )}
    </NodeViewWrapper>
  );
}

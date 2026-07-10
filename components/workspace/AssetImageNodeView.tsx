'use client';

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { CircularProgress, Box } from '@mui/material';
import { API_BASE_URL } from '../../services/api';
import { useSignedAssetUrl } from '../../hooks/useSignedAssetUrl';

export default function AssetImageNodeView(props: NodeViewProps) {
  const { node } = props;

  // Backend enrichment injects proper signed URLs into node.attrs['signed_url'].
  // node.attrs['src'] is a raw download URL (requires auth) — never trust it as signed.
  const preSignedUrl: string | undefined = node.attrs['signed_url'];
  const assetId: string | undefined = node.attrs['data-asset-id'];
  const thumbSize: number = node.attrs['data-thumb-size'] || 512;

  // Use backend-injected signed_url if available (public/preview view),
  // otherwise fetch a fresh signed URL via the hook (workspace editor)
  const fullPreSignedUrl = preSignedUrl && preSignedUrl.startsWith('/')
    ? `${API_BASE_URL}${preSignedUrl}`
    : preSignedUrl;
  const liveSignedUrl = useSignedAssetUrl(fullPreSignedUrl ? null : assetId || null, thumbSize);
  const signedUrl = fullPreSignedUrl || liveSignedUrl || null;

  const textAlign: string | null = node.attrs.textAlign ?? null;

  return (
    <NodeViewWrapper
      style={{
        display: 'block',
        textAlign: textAlign || undefined,
        width: '100%',
      }}
    >
      {!signedUrl ? (
        <CircularProgress size={16} sx={{ verticalAlign: 'middle' }} />
      ) : (
        <img
          src={signedUrl}
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

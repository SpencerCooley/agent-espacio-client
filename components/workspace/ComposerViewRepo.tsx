'use client';

import { useEffect, useState, useMemo } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { OpenInNew as OpenInNewIcon, Hub as GitBranchIcon } from '@mui/icons-material';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ComposerViewRepoProps {
  content: any;
  name: string;
  description?: string | null;
  publicMagicId?: string;
  isPreview?: boolean;
  isPublicView?: boolean;
  themeMode?: 'light' | 'dark';
}

interface RepoMeta {
  commit_count: number;
  file_count: number;
  last_commit: { hash: string; message: string; author: string; date: string } | null;
}

export default function ComposerViewRepo({
  content,
  name,
  description,
  publicMagicId,
  isPreview,
  isPublicView,
}: ComposerViewRepoProps) {
  const [meta, setMeta] = useState<RepoMeta | null>(null);

  const baseUrl = useMemo(() => {
    if (isPublicView || !isPreview) {
      return `${API_BASE_URL}/public/repo/${publicMagicId}`;
    }
    return `${API_BASE_URL}/artifacts/${content?.artifact_id || publicMagicId}/repo`;
  }, [publicMagicId, isPreview, isPublicView, content?.artifact_id]);

  const viewUrl = publicMagicId
    ? `/public/view/${publicMagicId}`
    : isPreview
      ? window.location.pathname.replace('/preview', '')
      : undefined;

  useEffect(() => {
    const headers: Record<string, string> = isPreview
      ? { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` }
      : {};
    fetch(baseUrl, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setMeta(data);
      })
      .catch(() => {});
  }, [baseUrl, isPreview]);

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 1 }}
    >
      <GitBranchIcon sx={{ fontSize: 36, color: 'primary.main', flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {description}
          </Typography>
        )}
        {meta ? (
          <Box sx={{ display: 'flex', gap: 1.5, mt: 0.25, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              {meta.commit_count} commit{meta.commit_count !== 1 ? 's' : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {meta.file_count} file{meta.file_count !== 1 ? 's' : ''}
            </Typography>
            {meta.last_commit && (
              <>
                <Typography variant="caption" color="text.secondary">·</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                  {meta.last_commit.hash}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, minWidth: 0 }}>
                  {meta.last_commit.message}
                </Typography>
              </>
            )}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary">Loading...</Typography>
        )}
      </Box>
      {viewUrl && (
        <Button
          size="small"
          endIcon={<OpenInNewIcon />}
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          sx={{ flexShrink: 0 }}
        >
          Open
        </Button>
      )}
    </Paper>
  );
}

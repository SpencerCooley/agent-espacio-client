'use client';

import { useEffect, useState, useMemo } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { OpenInNew as OpenInNewIcon, Hub as GitBranchIcon, Web as WebIcon } from '@mui/icons-material';

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
  publish?: {
    enabled: boolean;
    slug: string;
    render_mode: string;
    site_url?: string;
    allow_public_code_view?: boolean;
  } | null;
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
      .then((r) => {
        console.log('[ComposerViewRepo] fetch', baseUrl, 'status:', r.status, 'ok:', r.ok);
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        console.log('[ComposerViewRepo] data:', data?.publish);
        if (data) setMeta(data);
      })
      .catch((err) => {
        console.error('[ComposerViewRepo] error:', err);
      });
  }, [baseUrl, isPreview]);

  const siteUrl = meta?.publish?.enabled && meta?.publish?.slug
    ? (meta.publish.site_url || `${API_BASE_URL}/published/${meta.publish.slug}/`)
    : null;

  const isRepoLink = meta?.publish?.render_mode === 'repo_link';
  const allowPublicCodeView = meta?.publish?.allow_public_code_view ?? false;

  // If render_mode is repo_link, show the normal repo card (not iframe)
  if (siteUrl && isRepoLink) {
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
          <Button
            size="small"
            endIcon={<OpenInNewIcon />}
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            sx={{ flexShrink: 0 }}
          >
            View Full
          </Button>
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
              View Code
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  // If published as embedded or direct, show iframe
  if (siteUrl) {
    return (
      <Box>
        {/* Header bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <WebIcon sx={{ fontSize: 20, color: 'success.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
            {name}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
              {description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button
              size="small"
              endIcon={<OpenInNewIcon />}
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
            >
              View Full
            </Button>
            {allowPublicCodeView && viewUrl && (
              <Button
                size="small"
                endIcon={<OpenInNewIcon />}
                href={`${viewUrl}?repo_view=true`}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
              >
                View Code
              </Button>
            )}
          </Box>
        </Box>

        {/* Iframe */}
        <Box
          sx={{
            width: '100%',
            height: 480,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          <iframe
            src={siteUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={name}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </Box>
      </Box>
    );
  }

  // Regular repo — show compact card
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
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
            View Code
          </Button>
        )}
      </Box>
    </Paper>
  );
}

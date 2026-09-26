'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Button, CircularProgress } from '@mui/material';
import {
  Description as MarkdownIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { marked } from 'marked';
import { API_BASE_URL } from '../../services/api';
import { markdownContentSx } from '../../lib/markdown-styles';

const COLLAPSED_HEIGHT = 320;

interface ComposerViewMarkdownProps {
  item: any;
  isPreview?: boolean;
  isPublicView?: boolean;
}

export default function ComposerViewMarkdown({ item, isPreview, isPublicView }: ComposerViewMarkdownProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!item) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        let res: Response;
        if (isPublicView) {
          res = await fetch(`${API_BASE_URL}/public/assets/${item.public_magic_id || item.id}/download`);
        } else {
          const token = localStorage.getItem('accessToken');
          if (!token) throw new Error('Not authenticated');
          res = await fetch(`${API_BASE_URL}/assets/${item.id}/content`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        if (!res.ok) throw new Error('Failed to load markdown');
        const text = await res.text();
        if (!cancelled) setContent(text);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load markdown');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [item, isPublicView]);

  // Measure once content renders: does it exceed the collapsed height?
  useEffect(() => {
    const el = bodyRef.current;
    if (!el || content == null) return;
    setOverflows(el.scrollHeight > COLLAPSED_HEIGHT + 1);
  }, [content]);

  const handleCopy = async () => {
    if (content == null) return;
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!item) return null;

  // Link to the asset's own page (public page in public view, workspace page otherwise)
  const viewUrl = isPublicView
    ? `/public/view/${item.public_magic_id || item.id}`
    : `/workspace/assets/${item.id}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <MarkdownIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />
        <Typography
          variant="h6"
          component="a"
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            fontWeight: 600,
            flexGrow: 1,
            minWidth: 0,
            wordBreak: 'break-word',
            color: 'text.primary',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {item.name}
        </Typography>
        <Tooltip title={copied ? 'Copied!' : 'Copy markdown'}>
          <span>
            <IconButton
              size="small"
              onClick={handleCopy}
              disabled={content == null}
              color={copied ? 'success' : 'default'}
            >
              {copied ? <CheckCircleIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : error ? (
        <Typography color="text.secondary">{error}</Typography>
      ) : (
        <>
          <Box sx={{ position: 'relative' }}>
            <Box
              ref={bodyRef}
              sx={{
                maxHeight: expanded ? 'none' : COLLAPSED_HEIGHT,
                overflow: 'hidden',
              }}
            >
              <Box
                className="composer-markdown"
                sx={markdownContentSx}
                dangerouslySetInnerHTML={{ __html: marked.parse(content || '') as string }}
              />
            </Box>
            {!expanded && overflows && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 80,
                  background: (theme) =>
                    `linear-gradient(transparent, ${theme.palette.background.paper})`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </Box>
          {overflows && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Button
                size="small"
                onClick={() => setExpanded((v) => !v)}
                endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              >
                {expanded ? 'Show less' : 'View full'}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

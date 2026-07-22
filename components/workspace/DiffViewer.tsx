'use client';

import { useMemo } from 'react';
import { Box, Typography, Chip, useTheme } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { RepoCommitDetail, RepoDiffFile } from '../../services/repos';

interface DiffViewerProps {
  commit: RepoCommitDetail;
}

function DiffFileCard({ file, index }: { file: RepoDiffFile; index: number }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const statusColor = useMemo(() => {
    switch (file.status) {
      case 'added': return { bg: isDark ? 'rgba(63,185,80,0.15)' : 'rgba(46,160,67,0.08)', text: '#2da042' };
      case 'deleted': return { bg: isDark ? 'rgba(248,81,73,0.15)' : 'rgba(218,54,51,0.08)', text: '#cf222e' };
      default: return { bg: isDark ? 'rgba(56,139,253,0.1)' : 'rgba(9,105,218,0.06)', text: '#0969da' };
    }
  }, [file.status, isDark]);

  const patchLines = useMemo(() => {
    if (!file.patch) return [];
    return file.patch.split('\n').filter(l =>
      l.startsWith('@@') || l.startsWith('+') || l.startsWith('-') || l.startsWith('diff') || l.startsWith('index') || l.startsWith('---') || l.startsWith('+++')
    );
  }, [file.patch]);

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
          borderLeft: `3px solid ${statusColor.text}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0,
          boxShadow: `0 1px 0 0 ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500, flex: 1 }}>
          {file.path}
        </Typography>
        <Chip
          label={file.status}
          size="small"
          sx={{ height: 20, fontSize: '0.65rem', color: statusColor.text, bgcolor: 'transparent', border: 'none' }}
        />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {file.additions > 0 && (
            <Typography variant="caption" sx={{ color: '#2da042', fontFamily: 'monospace' }}>
              +{file.additions}
            </Typography>
          )}
          {file.deletions > 0 && (
            <Typography variant="caption" sx={{ color: '#cf222e', fontFamily: 'monospace' }}>
              -{file.deletions}
            </Typography>
          )}
        </Box>
      </Box>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 0,
          flex: 1,
          minHeight: 0,
          fontSize: '0.75rem',
          lineHeight: 1.5,
          fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
          overflow: 'auto',
          bgcolor: 'background.paper',
        }}
      >
        {patchLines.map((line, i) => {
          const isHunk = line.startsWith('@@');
          const isAdd = line.startsWith('+') && !line.startsWith('+++');
          const isDel = line.startsWith('-') && !line.startsWith('---');
          const isHeader = line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++');

          return (
            <Box
              key={i}
              component="div"
              sx={{
                display: 'flex',
                px: 2,
                whiteSpace: 'pre',
                bgcolor: isAdd ? (isDark ? 'rgba(63,185,80,0.12)' : 'rgba(46,160,67,0.06)')
                  : isDel ? (isDark ? 'rgba(248,81,73,0.12)' : 'rgba(218,54,51,0.06)')
                  : isHunk ? (isDark ? 'rgba(56,139,253,0.08)' : 'rgba(9,105,218,0.04)')
                  : 'transparent',
                color: isHeader ? 'text.secondary' : 'text.primary',
              }}
            >
              <Box sx={{ width: 20, flexShrink: 0, textAlign: 'center', color: isAdd ? '#2da042' : isDel ? '#cf222e' : 'text.secondary', userSelect: 'none' }}>
                {isAdd ? '+' : isDel ? '-' : ' '}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>{line}</Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function DiffViewer({ commit }: DiffViewerProps) {
  const date = new Date(commit.date);
  const formattedDate = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Commit header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          {commit.message}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {commit.short_hash}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {commit.author}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formattedDate} at {formattedTime}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {commit.total_additions > 0 && (
              <Chip
                icon={<AddIcon sx={{ fontSize: 14 }} />}
                label={commit.total_additions}
                size="small"
                sx={{ height: 20, fontSize: '0.65rem', color: '#2da042', bgcolor: 'transparent', '& .MuiChip-icon': { color: '#2da042' } }}
              />
            )}
            {commit.total_deletions > 0 && (
              <Chip
                icon={<RemoveIcon sx={{ fontSize: 14 }} />}
                label={commit.total_deletions}
                size="small"
                sx={{ height: 20, fontSize: '0.65rem', color: '#cf222e', bgcolor: 'transparent', '& .MuiChip-icon': { color: '#cf222e' } }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* File diffs */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {commit.files.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No file changes in this commit
            </Typography>
          </Box>
        ) : (
          commit.files.map((file, i) => (
            <DiffFileCard key={`${file.path}-${i}`} file={file} index={i} />
          ))
        )}
      </Box>
    </Box>
  );
}

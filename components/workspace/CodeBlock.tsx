'use client';

import { useMemo } from 'react';
import { Box, useTheme, Chip, Typography } from '@mui/material';
import { highlightCode, getLanguageLabel } from '../../lib/prism-highlight';

interface CodeBlockProps {
  code: string;
  filename: string;
}

export default function CodeBlock({ code, filename }: CodeBlockProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const highlighted = useMemo(() => highlightCode(code, filename), [code, filename]);
  const langLabel = getLanguageLabel(filename);

  const tokenColors = useMemo(() => {
    const p = theme.palette;
    // Light mode: prefer .dark variants so neon secondary/warning stay readable on paper
    const accent = isDark ? p.secondary.main : p.secondary.dark;
    const warn = isDark ? p.warning.main : p.warning.dark;
    const info = isDark ? p.info.main : p.info.dark;
    return {
      comment: p.text.secondary,
      punctuation: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
      property: info,
      tag: p.error.main,
      boolean: warn,
      number: warn,
      constant: warn,
      symbol: warn,
      string: isDark ? '#98c379' : '#22863a',
      char: isDark ? '#98c379' : '#22863a',
      builtin: info,
      selector: accent,
      keyword: p.primary.main === '#1a202c' ? '#d73a49' : accent,
      function: info,
      'class-name': warn,
      operator: p.text.primary,
      regex: warn,
      important: p.error.main,
      variable: p.error.main,
      url: info,
      atrule: accent,
      'attr-name': warn,
      'attr-value': isDark ? '#98c379' : '#22863a',
    };
  }, [theme, isDark]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          px: 2,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          flexShrink: 0,
          boxShadow: `0 1px 0 0 ${theme.palette.divider}`,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {filename}
        </Typography>
        <Chip
          label={langLabel}
          size="small"
          variant="outlined"
          sx={{ height: 20, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }}
        />
      </Box>
      <Box
        component="pre"
        sx={{
          flex: 1,
          overflow: 'auto',
          m: 0,
          p: 2,
          fontFamily: '"JetBrains Mono", "Fira Code", "Source Code Pro", Consolas, monospace',
          fontSize: '0.8125rem',
          lineHeight: 1.6,
          bgcolor: 'background.paper',
          color: 'text.primary',
          tabSize: 2,
          '& .token.comment': { color: tokenColors.comment, fontStyle: 'italic' },
          '& .token.prolog': { color: tokenColors.comment },
          '& .token.doctype': { color: tokenColors.comment },
          '& .token.cdata': { color: tokenColors.comment },
          '& .token.punctuation': { color: tokenColors.punctuation },
          '& .token.property': { color: tokenColors.property },
          '& .token.tag': { color: tokenColors.tag },
          '& .token.boolean': { color: tokenColors.boolean },
          '& .token.number': { color: tokenColors.number },
          '& .token.constant': { color: tokenColors.constant },
          '& .token.symbol': { color: tokenColors.symbol },
          '& .token.string': { color: tokenColors.string },
          '& .token.char': { color: tokenColors.char },
          '& .token.builtin': { color: tokenColors.builtin },
          '& .token.selector': { color: tokenColors.selector },
          '& .token.keyword': { color: tokenColors.keyword },
          '& .token.function': { color: tokenColors.function },
          '& .token.class-name': { color: tokenColors['class-name'] },
          '& .token.operator': { color: tokenColors.operator },
          '& .token.regex': { color: tokenColors.regex },
          '& .token.important': { color: tokenColors.important },
          '& .token.variable': { color: tokenColors.variable },
          '& .token.url': { color: tokenColors.url },
          '& .token.atrule': { color: tokenColors.atrule },
          '& .token.attr-name': { color: tokenColors['attr-name'] },
          '& .token.attr-value': { color: tokenColors['attr-value'] },
        }}
      >
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </Box>
    </Box>
  );
}

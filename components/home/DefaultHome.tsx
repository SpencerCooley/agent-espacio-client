'use client';

import { Box, Typography, Button, Stack, Card, CardContent } from '@mui/material';
import NextLink from 'next/link';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Agent Espacio';
const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Collaborative workspace for AI agents and humans';

/**
 * Minimal default landing page for Agent Espacio.
 *
 * Rendered at `/` when `NEXT_PUBLIC_HOME_PAGE_ENABLED=true`.
 * It is mounted inside PublicShell with `noCenter` — only the header is
 * shared. This component owns the entire width below the header, so it can
 * go edge-to-edge, use its own grids, Three.js canvases, etc.
 *
 * Developers: edit `CustomHome.tsx` (which re-exports this by default).
 * Any layout you return here will be full-width; constrain inner sections
 * yourself with `maxWidth` / `mx: auto` when you want a centered column.
 */
export default function DefaultHome() {
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Hero — full bleed, own spacing */}
      <Box
        sx={{
          width: '100%',
          py: { xs: 8, md: 14 },
          px: { xs: 2, md: 6 },
          display: 'flex',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Stack spacing={4} alignItems="center" textAlign="center" sx={{ maxWidth: 720, width: '100%' }}>
          <Typography
            variant="h1"
            sx={{ fontWeight: 800, fontSize: { xs: '2.5rem', md: '3.75rem' }, letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            {SITE_NAME}
          </Typography>

          <Typography variant="h5" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {SITE_DESCRIPTION}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
            <Button
              component={NextLink}
              href="/feed"
              variant="contained"
              size="large"
              sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', fontWeight: 600 }}
            >
              Explore the feed
            </Button>
            <Button
              component={NextLink}
              href="/workspace"
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', fontWeight: 600 }}
            >
              Open workspace
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Feature strip — demonstrates full-width + inner constraint pattern */}
      <Box
        sx={{
          width: '100%',
          py: { xs: 6, md: 8 },
          px: { xs: 2, md: 6 },
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            maxWidth: 1200,
            mx: 'auto',
            width: '100%',
          }}
        >
          {[
            { title: 'Folders, assets & artifacts', desc: 'Everything lives in folders — a filesystem for humans and agents.' },
            { title: 'Public feed at /feed', desc: 'Curated compositions stay at /feed. This page is yours to design.' },
            { title: 'Bring your own visuals', desc: 'This component is full-width. Add Three.js, charts, or marketing sections edge-to-edge.' },
          ].map((f) => (
            <Card key={f.title} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {f.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {f.desc}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ maxWidth: 720, mx: 'auto', textAlign: 'center', mt: 6, pt: 4, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            This is the default landing at{' '}
            <Box component="code" sx={{ px: 1, py: 0.25, bgcolor: 'action.hover', borderRadius: 1, fontSize: '0.85em' }}>
              /
            </Box>{' '}
            when{' '}
            <Box component="code" sx={{ px: 1, py: 0.25, bgcolor: 'action.hover', borderRadius: 1, fontSize: '0.85em' }}>
              NEXT_PUBLIC_HOME_PAGE_ENABLED=true
            </Box>
            . Set it to{' '}
            <Box component="code" sx={{ px: 1, py: 0.25, bgcolor: 'action.hover', borderRadius: 1, fontSize: '0.85em' }}>
              false
            </Box>{' '}
            to show the feed at <Box component="code" sx={{ px: 1, py: 0.25, bgcolor: 'action.hover', borderRadius: 1, fontSize: '0.85em' }}>/</Box> instead, or edit{' '}
            <Box component="code" sx={{ px: 1, py: 0.25, bgcolor: 'action.hover', borderRadius: 1, fontSize: '0.85em' }}>
              components/home/CustomHome.tsx
            </Box>{' '}
            to replace this page — you own the layout below the header.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

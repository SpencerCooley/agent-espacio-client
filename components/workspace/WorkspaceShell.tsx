'use client';

import { useState } from 'react';
import { Box, Drawer, Button, IconButton } from '@mui/material';
import { MenuOpen as MenuOpenIcon, Close as CloseIcon } from '@mui/icons-material';
import { ReactNode } from 'react';

interface WorkspaceShellProps {
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  children: ReactNode;
}

/**
 * WorkspaceShell - 3-panel layout container for all workspace pages.
 *
 * Provides a fixed header area (rendered by parent) and a 3-panel body:
 * - Left panel (optional, 280px, collapsible)
 * - Main panel (flexible, scrollable)
 * - Right panel (optional, 320px, collapsible)
 *
 * No global scroll. Each panel scrolls independently.
 *
 * Mobile behaviour:
 * - Left panel is hidden by default and slides in via a Drawer when toggled.
 * - A "Details" button appears at the top of the main content to open it.
 */
export default function WorkspaceShell({ leftPanel, rightPanel, children }: WorkspaceShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        mt: 8, // Space for fixed AppBar (64px)
      }}
    >
      {/* Desktop Left Panel */}
      {leftPanel && (
        <Box
          sx={{
            width: 280,
            flexShrink: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: { xs: 'none', md: 'block' },
          }}
        >
          {leftPanel}
        </Box>
      )}

      {/* Mobile Left Panel Drawer */}
      {leftPanel && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: 280,
              overflowY: 'auto',
              overflowX: 'hidden',
              bgcolor: 'background.paper',
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton size="small" onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          {leftPanel}
        </Drawer>
      )}

      {/* Main Content Panel */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          minWidth: 0,
          p: { xs: 1.5, md: 3 },
        }}
      >
        {/* Mobile toggle for left panel */}
        {leftPanel && (
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 1.5 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<MenuOpenIcon />}
              onClick={() => setDrawerOpen(true)}
            >
              Details
            </Button>
          </Box>
        )}
        {children}
      </Box>

      {/* Right Panel */}
      {rightPanel && (
        <Box
          sx={{
            width: 320,
            flexShrink: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            borderLeft: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {rightPanel}
        </Box>
      )}
    </Box>
  );
}

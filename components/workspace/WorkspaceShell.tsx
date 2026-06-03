'use client';

import { Box } from '@mui/material';
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
 */
export default function WorkspaceShell({ leftPanel, rightPanel, children }: WorkspaceShellProps) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        mt: 8, // Space for fixed AppBar (64px)
      }}
    >
      {/* Left Panel */}
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

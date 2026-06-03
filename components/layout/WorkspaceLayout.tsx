'use client';

import { Box } from '@mui/material';
import WorkspaceHeader from './WorkspaceHeader';
import WorkspaceShell from '../workspace/WorkspaceShell';
import { ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  folderId?: string;
}

interface WorkspaceLayoutProps {
  children: ReactNode;
  showAdminToggle?: boolean;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  breadcrumb?: BreadcrumbItem[];
  onDropOnBreadcrumb?: (folderId: string, event: React.DragEvent) => void;
}

/**
 * WorkspaceLayout - Shell for all workspace pages.
 *
 * Renders a fixed header with optional breadcrumb navigation,
 * plus a 3-panel body (left/main/right) via WorkspaceShell.
 *
 * The entire layout fills the viewport with no global scroll.
 * Only individual panels scroll.
 */
export default function WorkspaceLayout({
  children,
  showAdminToggle = false,
  leftPanel,
  rightPanel,
  breadcrumb,
  onDropOnBreadcrumb,
}: WorkspaceLayoutProps) {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <WorkspaceHeader
        showAdminToggle={showAdminToggle}
        breadcrumb={breadcrumb}
        onDropOnBreadcrumb={onDropOnBreadcrumb}
      />
      <WorkspaceShell leftPanel={leftPanel} rightPanel={rightPanel}>
        {children}
      </WorkspaceShell>
    </Box>
  );
}

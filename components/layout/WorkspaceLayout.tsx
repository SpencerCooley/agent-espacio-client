'use client';

import { Box, Toolbar } from '@mui/material';
import WorkspaceHeader from './WorkspaceHeader';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  showAdminToggle?: boolean;
}

export default function WorkspaceLayout({ children, showAdminToggle = false }: WorkspaceLayoutProps) {
  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      <WorkspaceHeader showAdminToggle={showAdminToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // Space for AppBar
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {children}
      </Box>
    </Box>
  );
}

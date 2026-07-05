'use client';

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  People,
  VpnKey,
  Workspaces,
  OpenInNew,
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LeftSidebarProps {
  open: boolean;
  onClose: () => void;
}

const adminMenuItems = [
  { text: 'Dashboard', icon: <Dashboard />, href: '/admin' },
  { text: 'Users', icon: <People />, href: '/admin/users' },
  { text: 'API Keys', icon: <VpnKey />, href: '/admin/api-keys' },
];

export default function LeftSidebar({ open, onClose }: LeftSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();

  const drawerWidth = 240;

  const drawer = (
    <List>
      {/* Workspace Link */}
      <ListItem disablePadding>
        <Link href="/workspace" style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}>
          <ListItemButton
            selected={pathname === '/workspace'}
            onClick={() => isMobile && onClose()}
          >
            <ListItemIcon><Workspaces /></ListItemIcon>
            <ListItemText primary="Back to Workspace" />
          </ListItemButton>
        </Link>
      </ListItem>

      {/* View Public Site */}
      <ListItem disablePadding>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}
        >
          <ListItemButton onClick={() => isMobile && onClose()}>
            <ListItemIcon><OpenInNew /></ListItemIcon>
            <ListItemText primary="View Public Site" />
          </ListItemButton>
        </a>
      </ListItem>
      
      <Divider sx={{ my: 1 }} />
      
      {/* Admin Menu Items */}
      {adminMenuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <ListItem key={item.text} disablePadding>
            <Link href={item.href} style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}>
              <ListItemButton
                selected={isActive}
                onClick={() => isMobile && onClose()}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </Link>
          </ListItem>
        );
      })}
    </List>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={isMobile ? open : true}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          ...(isMobile ? {} : { position: 'fixed', height: '100%' }),
        },
      }}
    >
      <Toolbar /> {/* Spacer for AppBar */}
      {drawer}
    </Drawer>
  );
}

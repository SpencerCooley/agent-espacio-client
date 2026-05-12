'use client';

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  AccountCircle,
  Settings as SettingsIcon,
  Logout,
  Dashboard,
} from '@mui/icons-material';
import Logo from '../Logo';
import { useApp } from '../../context/AppContext';
import Link from 'next/link';

interface WorkspaceHeaderProps {
  showAdminToggle?: boolean;
}

export default function WorkspaceHeader({ showAdminToggle = false }: WorkspaceHeaderProps) {
  const { user, logout } = useApp();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    window.location.href = '/login';
  };

  return (
    <AppBar 
      position="fixed"
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Link href="/workspace" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <Logo />
          </Link>
        </Box>

        {/* Admin Toggle - Icon Button */}
        {showAdminToggle && user?.role === 'admin' && (
          <IconButton
            component={Link}
            href="/admin"
            sx={{ mr: 1, color: 'text.primary' }}
            title="Switch to Admin Panel"
          >
            <Dashboard sx={{ color: 'text.primary' }} />
          </IconButton>
        )}

        {/* Settings Icon */}
        <IconButton
          component={Link}
          href="/workspace/settings"
          sx={{ mr: 1, color: 'text.primary' }}
          title="Settings"
        >
          <SettingsIcon sx={{ color: 'text.primary' }} />
        </IconButton>

        {/* User Menu */}
        <div>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            sx={{ color: 'text.primary' }}
          >
            <AccountCircle sx={{ color: 'text.primary' }} />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="textSecondary">
                {user?.email}
              </Typography>
            </MenuItem>
            <MenuItem component={Link} href="/workspace/settings">
              <SettingsIcon sx={{ mr: 1, fontSize: 20 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1, fontSize: 20 }} />
              Logout
            </MenuItem>
          </Menu>
        </div>
      </Toolbar>
    </AppBar>
  );
}

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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Workspaces,
  OpenInNew,
} from '@mui/icons-material';
import Logo from '../Logo';
import { useApp } from '../../context/AppContext';
import Link from 'next/link';

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useApp();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar>
        <IconButton
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, color: 'text.primary' }}
        >
          <MenuIcon sx={{ color: 'text.primary' }} />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }}>
          <Link href="/workspace" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <Logo />
          </Link>
        </Box>

        {/* Workspace Toggle - Icon Button */}
        <IconButton
          component={Link}
          href="/workspace"
          sx={{ mr: 1, color: 'text.primary' }}
          title="Switch to Workspace"
        >
          <Workspaces sx={{ color: 'text.primary' }} />
        </IconButton>

        {/* Open Public Site - Icon Button */}
        <IconButton
          component="a"
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mr: 1, color: 'text.primary' }}
          title="View Public Site"
        >
          <OpenInNew sx={{ color: 'text.primary' }} />
        </IconButton>

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

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
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  AccountCircle,
  Settings as SettingsIcon,
  Logout,
  Dashboard,
  ChevronRight,
} from '@mui/icons-material';
import Logo from '../Logo';
import { useApp } from '../../context/AppContext';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
  folderId?: string;
}

interface WorkspaceHeaderProps {
  showAdminToggle?: boolean;
  breadcrumb?: BreadcrumbItem[];
  onDropOnBreadcrumb?: (folderId: string, event: React.DragEvent) => void;
}

export default function WorkspaceHeader({
  showAdminToggle = false,
  breadcrumb,
  onDropOnBreadcrumb,
}: WorkspaceHeaderProps) {
  const { user, logout } = useApp();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // Track which breadcrumb item is being dragged over
  const [activeBreadcrumbDrop, setActiveBreadcrumbDrop] = useState<string | null>(null);

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

  const handleBreadcrumbDragEnter = (folderId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveBreadcrumbDrop(folderId);
  };

  const handleBreadcrumbDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleBreadcrumbDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear highlight if we're actually leaving this breadcrumb item,
    // not just moving between child elements inside it (e.g., the link text)
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const currentTarget = e.currentTarget as HTMLElement;
    if (relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    setActiveBreadcrumbDrop(null);
  };

  const handleBreadcrumbDrop = (folderId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveBreadcrumbDrop(null);
    if (onDropOnBreadcrumb) {
      onDropOnBreadcrumb(folderId, e);
    }
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left section: Logo + Breadcrumb */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
          <Link href="/workspace" style={{ textDecoration: 'none', display: 'inline-block', flexShrink: 0 }}>
            <Logo />
          </Link>

          {breadcrumb && breadcrumb.length > 0 && (
            <Breadcrumbs
              separator={<ChevronRight sx={{ fontSize: 16, color: 'text.secondary' }} />}
              sx={{
                ml: 2,
                '& .MuiBreadcrumbs-ol': {
                  flexWrap: 'nowrap',
                  overflow: 'hidden',
                },
                '& .MuiBreadcrumbs-li': {
                  whiteSpace: 'nowrap',
                },
              }}
            >
              {breadcrumb.map((item, index) => {
                const isLast = index === breadcrumb.length - 1;
                const isActiveDrop = activeBreadcrumbDrop === item.folderId;

                // Drop target wrapper for breadcrumb items with folderId
                if (item.folderId && onDropOnBreadcrumb && !isLast) {
                  return (
                    <Box
                      key={index}
                      component="span"
                      onDragEnter={handleBreadcrumbDragEnter(item.folderId)}
                      onDragOver={handleBreadcrumbDragOver}
                      onDragLeave={handleBreadcrumbDragLeave}
                      onDrop={handleBreadcrumbDrop(item.folderId)}
                      sx={{
                        display: 'inline-block',
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 0.75,
                        mx: -0.75,
                        my: -0.5,
                        transition: 'all 0.15s ease',
                        bgcolor: isActiveDrop ? 'primary.main' : 'transparent',
                        color: isActiveDrop ? 'primary.contrastText' : 'inherit',
                        boxShadow: isActiveDrop
                          ? (theme) => `0 0 0 3px ${theme.palette.primary.main}40`
                          : 'none',
                        '&:hover': {
                          bgcolor: isActiveDrop ? 'primary.main' : 'action.hover',
                        },
                      }}
                    >
                      <MuiLink
                        component={Link}
                        href={item.href || `/workspace/folders/${item.folderId}`}
                        color="inherit"
                        sx={{
                          textDecoration: 'none',
                          color: isActiveDrop ? 'primary.contrastText' : 'inherit',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {item.label}
                      </MuiLink>
                    </Box>
                  );
                }

                if (item.href && !isLast) {
                  return (
                    <MuiLink
                      key={index}
                      component={Link}
                      href={item.href}
                      color="inherit"
                      sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {item.label}
                    </MuiLink>
                  );
                }
                return (
                  <Typography key={index} color={isLast ? 'text.primary' : 'text.secondary'} variant="body2">
                    {item.label}
                  </Typography>
                );
              })}
            </Breadcrumbs>
          )}
        </Box>

        {/* Right section: Actions + User */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {/* Admin Toggle */}
          {showAdminToggle && user?.role === 'admin' && (
            <IconButton
              component={Link}
              href="/admin"
              sx={{ color: 'text.primary' }}
              title="Switch to Admin Panel"
            >
              <Dashboard />
            </IconButton>
          )}

          {/* Settings */}
          <IconButton
            component={Link}
            href="/workspace/settings"
            sx={{ color: 'text.primary' }}
            title="Settings"
          >
            <SettingsIcon />
          </IconButton>

          {/* User Menu */}
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            sx={{ color: 'text.primary' }}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
        </Box>
      </Toolbar>
    </AppBar>
  );
}

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Box, Snackbar, Alert, Slide, SlideProps } from '@mui/material';
import { useNotifications } from '../context/NotificationContext';
import { useWebSocket } from '../context/WebSocketContext';

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

function formatEventMessage(event: any): string | null {
  const { event_type, payload } = event;
  const name = payload?.name || 'Unknown';

  switch (event_type) {
    case 'folder.created':
      return `New folder created: "${name}"`;
    case 'folder.deleted':
      return `Folder deleted: "${name}"`;
    case 'folder.moved':
      return `Folder moved: "${name}"`;
    case 'asset.created':
      return `New file uploaded: "${name}"`;
    case 'asset.deleted':
      return `File deleted: "${name}"`;
    case 'asset.moved':
      return `File moved: "${name}"`;
    case 'artifact.created':
      return `New artifact created: "${name}"`;
    case 'artifact.deleted':
      return `Artifact deleted: "${name}"`;
    case 'artifact.updated':
      return `Artifact updated: "${name}"`;
    default:
      return null;
  }
}

function getCurrentFolderId(pathname: string): string | null {
  const match = pathname.match(/\/workspace\/folders\/([^/]+)/);
  return match ? match[1] : null;
}

export default function NotificationFeed() {
  const { notifications, removeNotification } = useNotifications();
  const { subscribe, unsubscribe } = useWebSocket();
  const { addNotification } = useNotifications();
  const pathname = usePathname();

  useEffect(() => {
    const handleEvent = (event: any) => {
      const message = formatEventMessage(event);
      if (!message) return;

      // Skip notification if user is already viewing the affected folder
      const currentFolderId = getCurrentFolderId(pathname || '');
      if (currentFolderId && event.folder_id === currentFolderId) {
        return;
      }

      addNotification(message, 'info');
    };

    subscribe('global', handleEvent);
    return () => {
      unsubscribe('global', handleEvent);
    };
  }, [subscribe, unsubscribe, addNotification, pathname]);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        pointerEvents: 'none',
      }}
    >
      {notifications.map((notification, index) => (
        <Box key={notification.id} sx={{ pointerEvents: 'auto' }}>
          <Snackbar
            open
            autoHideDuration={5000}
            onClose={() => removeNotification(notification.id)}
            TransitionComponent={SlideTransition}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{
              position: 'relative',
              transform: `translateY(-${index * 8}px)`,
            }}
          >
            <Alert
              severity={notification.severity}
              variant="filled"
              onClose={() => removeNotification(notification.id)}
              sx={{
                minWidth: 280,
                boxShadow: 3,
              }}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        </Box>
      ))}
    </Box>
  );
}

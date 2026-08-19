'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';import ProtectedRoute from '../../components/auth/ProtectedRoute';
import WorkspaceLayout from '../../components/layout/WorkspaceLayout';
import FolderItemCard from '../../components/workspace/FolderItemCard';
import { useApp } from '../../context/AppContext';
import { folderService, FolderItem } from '../../services/folders';

const ROOT_FOLDER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Workspace index:
 * - Admin → redirect to My Drive root
 * - Editor with grants → "My Folders" card grid (no create at this level)
 * - Editor with zero grants → locked-out empty state
 */
function WorkspaceIndexContent() {
  const router = useRouter();
  const { user } = useApp();
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantFolders, setGrantFolders] = useState<FolderItem[]>([]);

  useEffect(() => {
    if (!user) return;

    if (isAdmin) {
      router.replace(`/workspace/folders/${ROOT_FOLDER_ID}`);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await folderService.listFolders();
        if (cancelled) return;
        // Top-level trees are the grant roots
        const items: FolderItem[] = (res.folders || []).map((f: any) => ({
          kind: 'folder' as const,
          id: f.id,
          name: f.name,
          created_at: f.created_at,
          updated_at: f.created_at,
          is_public: false,
          public_magic_id: null,
        }));
        setGrantFolders(items);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load folders');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, router]);

  if (isAdmin) {
    return (
      <WorkspaceLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      </WorkspaceLayout>
    );
  }

  if (loading) {
    return (
      <WorkspaceLayout breadcrumb={[{ label: 'My Folders' }]}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      </WorkspaceLayout>
    );
  }

  if (error) {
    return (
      <WorkspaceLayout breadcrumb={[{ label: 'My Folders' }]}>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </WorkspaceLayout>
    );
  }

  if (grantFolders.length === 0) {
    return (
      <WorkspaceLayout breadcrumb={[{ label: 'My Folders' }]}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            py: 8,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              maxWidth: 420,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <LockIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              You are not part of any folders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              An administrator needs to grant you access to one or more folders
              before you can work in the workspace.
            </Typography>
          </Paper>
        </Box>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout breadcrumb={[{ label: 'My Folders' }]}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
          My Folders
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {grantFolders.length} folder{grantFolders.length === 1 ? '' : 's'} you can access
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {grantFolders.map((item) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={item.id}>
            <FolderItemCard item={item} />
          </Grid>
        ))}
      </Grid>
    </WorkspaceLayout>
  );
}

export default function WorkspaceIndexPage() {
  return (
    <ProtectedRoute>
      <WorkspaceIndexContent />
    </ProtectedRoute>
  );
}

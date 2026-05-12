'use client';

import ProtectedRoute from '../../components/auth/ProtectedRoute';
import WorkspaceLayout from '../../components/layout/WorkspaceLayout';
import { useApp } from '../../context/AppContext';
import { Typography, Paper, Box } from '@mui/material';

function WorkspaceContent() {
  const { user } = useApp();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Workspace
      </Typography>

      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Welcome to your Workspace
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Logged in as: <strong>{user?.email}</strong>
        </Typography>

        <Typography variant="body1" color="text.secondary">
          This is the workspace container. We will build folder structures and artifact management here soon.
        </Typography>

        <Box sx={{ mt: 4, p: 3, backgroundColor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            🚧 Coming Soon:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div" sx={{ mt: 1 }}>
            • Folder creation and management<br />
            • Real-time artifact collaboration<br />
            • Agent-generated content (maps, data, documents)<br />
            • File upload and organization
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default function WorkspacePage() {
  const { user } = useApp();
  const isAdmin = user?.role === 'admin';

  return (
    <ProtectedRoute>
      <WorkspaceLayout showAdminToggle={isAdmin}>
        <WorkspaceContent />
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}

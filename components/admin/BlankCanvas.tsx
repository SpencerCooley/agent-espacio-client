'use client';

import { Typography, Paper, Box, Chip, Card, CardContent } from '@mui/material';
import { useApp } from '../../context/AppContext';

export default function BlankCanvas() {
  const { user } = useApp();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Welcome to Agent Espacio!
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            You are logged in as: <strong>{user?.email}</strong>
          </Typography>
          
          <Chip 
            label={user?.role === 'admin' ? 'Administrator' : 'User'} 
            color={user?.role === 'admin' ? 'primary' : 'default'}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Getting Started
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          This is your blank canvas. Start building your collaborative workspace here.
        </Typography>
        
        <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                1. Manage Users
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create and manage user accounts in the Users section.
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                2. Create API Keys
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate API keys for your AI agents to authenticate.
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                3. Start Collaborating
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Begin creating artifacts and collaborating with agents (coming soon).
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Status
        </Typography>
        <Typography variant="body2" color="text.secondary">
          All systems operational. API is connected and ready.
        </Typography>
      </Paper>
    </Box>
  );
}

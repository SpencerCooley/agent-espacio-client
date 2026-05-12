'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Chip,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { apiKeyService, ApiKey, ApiError } from '../../services/api';

interface CreateKeyFormData {
  name: string;
}

export default function ApiKeyManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const data = await apiKeyService.listApiKeys();
      setApiKeys(data.keys);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load API keys');
      }
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSnackbar('Copied to clipboard!');
  };

  // Create key dialog
  const CreateKeyDialog = () => {
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<CreateKeyFormData>();

    const onSubmit = async (data: CreateKeyFormData) => {
      try {
        const result = await apiKeyService.createApiKey(data.name);
        setNewlyCreatedKey(result.key);
        setCreateDialogOpen(false);
        setNewKeyDialogOpen(true);
        reset();
        loadApiKeys();
        showSuccess('API key created successfully');
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        }
      }
    };

    return (
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Create an API key for AI agents to authenticate with the system.
            The full key will be shown only once after creation.
          </Typography>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Key Name"
            placeholder="e.g., laptop-main, openclaw-node-1"
            {...register('name', {
              required: 'Name is required',
              minLength: {
                value: 1,
                message: 'Name is required',
              },
            })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // New key display dialog (shown only once)
  const NewKeyDialog = () => (
    <Dialog 
      open={newKeyDialogOpen} 
      onClose={() => {
        setNewKeyDialogOpen(false);
        setNewlyCreatedKey(null);
      }} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle sx={{ color: 'warning.main' }}>
        Save Your API Key
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This is the only time you will see the full API key. 
          Please copy it now and store it securely. It cannot be retrieved later.
        </Alert>
        <Paper 
          sx={{ 
            p: 2, 
            backgroundColor: 'grey.900',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            position: 'relative',
          }}
        >
          <Typography variant="body1" sx={{ color: 'success.main' }}>
            {newlyCreatedKey}
          </Typography>
          <IconButton
            onClick={() => newlyCreatedKey && copyToClipboard(newlyCreatedKey)}
            sx={{ 
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'success.main',
            }}
            title="Copy to clipboard"
          >
            <ContentCopyIcon />
          </IconButton>
        </Paper>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Use this key in the <code>X-Agent-Key</code> header when making API requests:
        </Typography>
        <Paper sx={{ p: 2, mt: 1, backgroundColor: 'grey.100' }}>
          <Typography variant="body2" component="code" sx={{ fontFamily: 'monospace' }}>
            X-Agent-Key: {newlyCreatedKey?.slice(0, 20)}...
          </Typography>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => {
            setNewKeyDialogOpen(false);
            setNewlyCreatedKey(null);
          }} 
          variant="contained"
        >
          I've Saved The Key
        </Button>
      </DialogActions>
    </Dialog>
  );

  const handleRevoke = async (id: number) => {
    try {
      await apiKeyService.revokeApiKey(id);
      showSuccess('API key revoked');
      loadApiKeys();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await apiKeyService.activateApiKey(id);
      showSuccess('API key activated');
      loadApiKeys();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">API Key Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create API Key
        </Button>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isMobile ? (
        // Mobile: Card view
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {apiKeys.map((key) => (
            <Card key={key.id}>
              <CardContent>
                <Typography variant="h6">{key.name}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontFamily: 'monospace' }}>
                  {key.prefix}...
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    label={key.is_active ? 'Active' : 'Revoked'} 
                    color={key.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Created: {new Date(key.created_at).toLocaleDateString()}
                  {key.last_used_at && (
                    <span> | Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                  )}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {key.is_active ? (
                    <Button
                      size="small"
                      color="error"
                      startIcon={<BlockIcon />}
                      onClick={() => handleRevoke(key.id)}
                    >
                      Revoke
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleActivate(key.id)}
                    >
                      Activate
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        // Desktop: Table view
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Prefix</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Used</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>{key.name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{key.prefix}...</TableCell>
                  <TableCell>{new Date(key.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {key.last_used_at 
                      ? new Date(key.last_used_at).toLocaleDateString() 
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={key.is_active ? 'Active' : 'Revoked'} 
                      color={key.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {key.is_active ? (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<BlockIcon />}
                        onClick={() => handleRevoke(key.id)}
                      >
                        Revoke
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleActivate(key.id)}
                      >
                        Activate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CreateKeyDialog />
      <NewKeyDialog />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}

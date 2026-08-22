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
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { apiKeyService, userService, ApiKey, User, ApiError } from '../../services/api';

interface CreateKeyFormData {
  name: string;
  user_id: string; // '' = global
}

export default function ApiKeyManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
    loadUsers();
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

  const loadUsers = async () => {
    try {
      const data = await userService.listUsers();
      setUsers(data.users.filter((u) => u.role !== 'admin'));
    } catch {
      // Non-fatal; assignment dropdown will just be empty
    }
  };

  const userEmailById = (userId: number | null | undefined) => {
    if (userId == null) return null;
    return users.find((u) => u.id === userId)?.email ?? `User #${userId}`;
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
    } = useForm<CreateKeyFormData>({
      defaultValues: { name: '', user_id: '' },
    });

    const onSubmit = async (data: CreateKeyFormData) => {
      try {
        const userId = data.user_id ? Number(data.user_id) : null;
        const result = await apiKeyService.createApiKey(data.name, userId);
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
            Create an API key for AI agents.
            Optionally assign an editor so the key inherits that user&apos;s folder grants.
            Leave unassigned for a global (unrestricted) key. The key is stored
            encrypted and can be copied again anytime from this table or by the
            assigned user from their settings.
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
          <TextField
            margin="normal"
            fullWidth
            label="Assign to editor (optional)"
            select
            defaultValue=""
            {...register('user_id')}
            helperText="Unassigned = global access. Assigned = inherits that editor's folder grants."
          >
            <MenuItem value="">Global (unrestricted)</MenuItem>
            {users.map((u) => (
              <MenuItem key={u.id} value={String(u.id)}>
                {u.email}
              </MenuItem>
            ))}
          </TextField>
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
      <DialogTitle>
        Your New API Key
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          The key is stored encrypted and can be copied again anytime from the
          table below, or by its assigned user from their settings page.
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
        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
          <Typography variant="body2" component="code" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
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
          Done
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
                <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip 
                    label={key.is_active ? 'Active' : 'Revoked'} 
                    color={key.is_active ? 'success' : 'default'}
                    size="small"
                  />
                  <Chip
                    label={key.user_id == null ? 'Global' : userEmailById(key.user_id) || 'Assigned'}
                    size="small"
                    color={key.user_id == null ? 'warning' : 'default'}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Created: {new Date(key.created_at).toLocaleDateString()}
                  {key.last_used_at && (
                    <span> | Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                  )}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  {key.key && (
                    <IconButton
                      size="small"
                      title="Copy key"
                      onClick={() => copyToClipboard(key.key!)}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  )}
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
                <TableCell>Scope</TableCell>
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
                  <TableCell>
                    <Chip
                      label={key.user_id == null ? 'Global' : userEmailById(key.user_id) || `User #${key.user_id}`}
                      size="small"
                      color={key.user_id == null ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
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
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      {key.key && (
                        <IconButton
                          size="small"
                          title="Copy key"
                          onClick={() => copyToClipboard(key.key!)}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      )}
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

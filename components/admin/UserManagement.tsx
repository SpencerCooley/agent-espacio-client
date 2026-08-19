'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Autocomplete,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  LockReset as LockResetIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import {
  userService,
  User,
  ApiError,
  ScopeFolder,
} from '../../services/api';
import { folderService, FolderItem } from '../../services/folders';

interface CreateUserFormData {
  email: string;
  password: string;
  role: string;
}

interface ResetPasswordFormData {
  newPassword: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scopesDialogOpen, setScopesDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formatRole = (role: string) => (role === 'admin' ? 'Admin' : 'Editor');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.listUsers();
      setUsers(data.users);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Create user dialog
  const CreateUserDialog = () => {
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<CreateUserFormData>();

    const onSubmit = async (data: CreateUserFormData) => {
      try {
        await userService.createUser(data.email, data.password, data.role);
        showSuccess('User created successfully');
        setCreateDialogOpen(false);
        reset();
        loadUsers();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        }
      }
    };

    return (
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email',
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Min 8 characters',
                },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Role"
              select
              SelectProps={{ native: true }}
              defaultValue="editor"
              {...register('role', { required: 'Role is required' })}
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Reset password dialog
  const ResetPasswordDialog = () => {
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<ResetPasswordFormData>();

    const onSubmit = async (data: ResetPasswordFormData) => {
      if (!selectedUser) return;
      try {
        await userService.resetPassword(selectedUser.id, data.newPassword);
        showSuccess(`Password reset for ${selectedUser.email}`);
        setResetPasswordDialogOpen(false);
        reset();
        setSelectedUser(null);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        }
      }
    };

    return (
      <Dialog open={resetPasswordDialogOpen} onClose={() => setResetPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Resetting password for: <strong>{selectedUser?.email}</strong>
          </Typography>
          <TextField
            margin="normal"
            required
            fullWidth
            label="New Password"
            type="password"
            {...register('newPassword', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Min 8 characters',
              },
            })}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" color="primary">
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Delete confirmation dialog
  const DeleteDialog = () => (
    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
      <DialogTitle>Delete User</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete <strong>{selectedUser?.email}</strong>?
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
        <Button 
          onClick={async () => {
            if (!selectedUser) return;
            try {
              await userService.deleteUser(selectedUser.id);
              showSuccess('User deleted successfully');
              loadUsers();
            } catch (err) {
              if (err instanceof ApiError) {
                setError(err.message);
              }
            }
            setDeleteDialogOpen(false);
            setSelectedUser(null);
          }} 
          color="error" 
          variant="contained"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Folder scopes dialog
  const ROOT_FOLDER_ID = '00000000-0000-0000-0000-000000000001';

  const ScopesDialog = () => {
    const [scopes, setScopes] = useState<ScopeFolder[]>([]);
    const [scopesLoading, setScopesLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [searchOptions, setSearchOptions] = useState<FolderItem[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const loadScopes = useCallback(async () => {
      if (!selectedUser) return;
      setScopesLoading(true);
      setActionError(null);
      try {
        const data = await userService.listScopes(selectedUser.id);
        setScopes(data.scopes);
      } catch (err) {
        setActionError(err instanceof ApiError ? err.message : 'Failed to load scopes');
      } finally {
        setScopesLoading(false);
      }
    }, [selectedUser]);

    useEffect(() => {
      if (scopesDialogOpen && selectedUser) {
        loadScopes();
      }
    }, [scopesDialogOpen, selectedUser, loadScopes]);

    useEffect(() => {
      if (!scopesDialogOpen) return;
      if (!searchInput.trim()) {
        setSearchOptions([]);
        return;
      }
      let cancelled = false;
      const timer = setTimeout(async () => {
        setSearchLoading(true);
        try {
          const res = await folderService.searchScopedItems(searchInput.trim());
          if (cancelled) return;
          const folders = (res.items || []).filter((i) => i.kind === 'folder');
          // Also allow granting My Drive root via exact name match
          setSearchOptions(folders);
        } catch {
          if (!cancelled) setSearchOptions([]);
        } finally {
          if (!cancelled) setSearchLoading(false);
        }
      }, 300);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }, [searchInput, scopesDialogOpen]);

    const handleAddById = async (folderId: string, name: string) => {
      if (!selectedUser) return;
      setActionError(null);
      try {
        await userService.addScope(selectedUser.id, folderId);
        setSearchInput('');
        setSearchOptions([]);
        await loadScopes();
        showSuccess(`Granted access to "${name}"`);
      } catch (err) {
        setActionError(err instanceof ApiError ? err.message : 'Failed to add scope');
      }
    };

    const handleAdd = async (folder: FolderItem | null) => {
      if (!folder) return;
      await handleAddById(folder.id, folder.name);
    };

    const handleRemove = async (folderId: string, name: string) => {
      if (!selectedUser) return;
      setActionError(null);
      try {
        await userService.removeScope(selectedUser.id, folderId);
        await loadScopes();
        showSuccess(`Removed access to "${name}"`);
      } catch (err) {
        setActionError(err instanceof ApiError ? err.message : 'Failed to remove scope');
      }
    };

    const handleClose = () => {
      setScopesDialogOpen(false);
      setSelectedUser(null);
      setScopes([]);
      setSearchInput('');
      setActionError(null);
    };

    const grantedIds = new Set(scopes.map((s) => s.folder_id));

    return (
      <Dialog open={scopesDialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Folder Access</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Grants for <strong>{selectedUser?.email}</strong>. Each grant includes
            that folder and all of its subfolders. Zero grants = no workspace access.
          </Typography>

          {actionError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
              {actionError}
            </Alert>
          )}

          <Autocomplete
            options={searchOptions.filter((o) => !grantedIds.has(o.id))}
            getOptionLabel={(o) => o.name}
            loading={searchLoading}
            inputValue={searchInput}
            onInputChange={(_, value) => setSearchInput(value)}
            onChange={(_, value) => handleAdd(value)}
            filterOptions={(x) => x}
            noOptionsText={
              searchInput.trim()
                ? searchLoading
                  ? 'Searching…'
                  : 'No folders found'
                : 'Type to search folders'
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add folder grant"
                placeholder="Search folders…"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            sx={{ mb: 1 }}
          />

          {!grantedIds.has(ROOT_FOLDER_ID) && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<FolderIcon />}
              onClick={() => handleAddById(ROOT_FOLDER_ID, 'My Drive')}
              sx={{ mb: 2 }}
            >
              Grant full access (My Drive)
            </Button>
          )}

          {scopesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : scopes.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No folder grants yet. This editor cannot access any content.
            </Typography>
          ) : (
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {scopes.map((s) => (
                <Chip
                  key={s.folder_id}
                  icon={<FolderIcon />}
                  label={s.is_root ? `${s.name} (full access)` : s.name}
                  onDelete={() => handleRemove(s.folder_id, s.name)}
                  color={s.is_root ? 'primary' : 'default'}
                />
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Done</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const openScopes = (user: User) => {
    setSelectedUser(user);
    setScopesDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create User
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
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent>
                <Typography variant="h6">{user.email}</Typography>
                <Chip 
                  label={formatRole(user.role)} 
                  color={user.role === 'admin' ? 'primary' : 'default'}
                  size="small"
                  sx={{ mt: 1, mb: 1 }}
                />
                <Typography variant="body2" color="textSecondary">
                  Created: {new Date(user.created_at).toLocaleDateString()}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  {user.role !== 'admin' && (
                    <IconButton
                      size="small"
                      onClick={() => openScopes(user)}
                      title="Folder access"
                    >
                      <FolderIcon />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedUser(user);
                      setResetPasswordDialogOpen(true);
                    }}
                  >
                    <LockResetIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setSelectedUser(user);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
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
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={formatRole(user.role)} 
                      color={user.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {user.role !== 'admin' && (
                      <IconButton
                        onClick={() => openScopes(user)}
                        title="Folder access"
                      >
                        <FolderIcon />
                      </IconButton>
                    )}
                    <IconButton
                      onClick={() => {
                        setSelectedUser(user);
                        setResetPasswordDialogOpen(true);
                      }}
                      title="Reset Password"
                    >
                      <LockResetIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setSelectedUser(user);
                        setDeleteDialogOpen(true);
                      }}
                      title="Delete User"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CreateUserDialog />
      <ResetPasswordDialog />
      <DeleteDialog />
      <ScopesDialog />
    </Box>
  );
}

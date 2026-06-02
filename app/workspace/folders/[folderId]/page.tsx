'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
} from '@mui/material';
import { CreateNewFolder, UploadFile } from '@mui/icons-material';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import WorkspaceLayout from '../../../../components/layout/WorkspaceLayout';
import FolderItemCard from '../../../../components/workspace/FolderItemCard';
import CreateFolderDialog from '../../../../components/workspace/CreateFolderDialog';
import DeleteConfirmDialog from '../../../../components/workspace/DeleteConfirmDialog';
import { folderService, FolderContentsResponse, FolderItem } from '../../../../services/folders';
import { assetService } from '../../../../services/assets';
import { artifactService } from '../../../../services/artifacts';

interface BreadcrumbItem {
  label: string;
  href?: string;
  folderId?: string;
}

function FolderExplorerContent() {
  const params = useParams();
  const folderId = params.folderId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<FolderContentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FolderItem | null>(null);

  // Drag-and-drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Ref-based drag counter to handle nested drag enter/leave
  const dragCounterRef = useRef(0);

  const loadContents = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await folderService.getFolderContents(folderId);
      setData(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load folder contents';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
  };

  const handleCloseSuccess = () => {
    setSuccessMessage(null);
  };

  // Delete handlers
  const handleDeleteRequest = (item: FolderItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.kind === 'folder') {
        await folderService.deleteFolder(itemToDelete.id);
      } else if (itemToDelete.kind === 'asset') {
        await assetService.deleteAsset(itemToDelete.id);
      } else if (itemToDelete.kind === 'artifact') {
        await artifactService.deleteArtifact(itemToDelete.id);
      }
      showSuccess(`"${itemToDelete.name}" deleted successfully`);
      loadContents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete item';
      setError(message);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Rename handler (folders only)
  const handleRename = async (item: FolderItem, newName: string) => {
    if (item.kind !== 'folder') return;
    try {
      await folderService.updateFolder(item.id, newName);
      showSuccess(`Renamed to "${newName}"`);
      loadContents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to rename folder';
      setError(message);
      throw err;
    }
  };

  // Move handler (drag-and-drop between folders)
  const handleMoveItem = async (draggedItem: FolderItem, targetFolderId: string) => {
    try {
      if (draggedItem.kind === 'folder') {
        await folderService.moveFolder(draggedItem.id, targetFolderId);
      } else if (draggedItem.kind === 'asset') {
        await assetService.moveAsset(draggedItem.id, targetFolderId);
      } else if (draggedItem.kind === 'artifact') {
        await artifactService.moveArtifact(draggedItem.id, targetFolderId);
      }
      showSuccess(`Moved "${draggedItem.name}"`);
      loadContents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to move item';
      setError(message);
      throw err;
    }
  };

  // Upload handler for dropping onto folder cards
  const handleUploadToFolder = async (targetFolderId: string, files: FileList) => {
    setUploading(true);
    let uploadedCount = 0;
    let failedCount = 0;

    for (const file of Array.from(files)) {
      try {
        await assetService.uploadAsset(file, targetFolderId);
        uploadedCount++;
      } catch {
        failedCount++;
      }
    }

    setUploading(false);
    if (uploadedCount > 0) {
      showSuccess(`${uploadedCount} file${uploadedCount > 1 ? 's' : ''} uploaded`);
      loadContents();
    }
    if (failedCount > 0) {
      setError(`${failedCount} file${failedCount > 1 ? 's' : ''} failed to upload`);
    }
  };

  // File upload handlers
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(files);
    event.target.value = ''; // Reset input
  };

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    let uploadedCount = 0;
    let failedCount = 0;

    for (const file of Array.from(files)) {
      try {
        await assetService.uploadAsset(file, folderId);
        uploadedCount++;
      } catch {
        failedCount++;
      }
    }

    setUploading(false);
    if (uploadedCount > 0) {
      showSuccess(`${uploadedCount} file${uploadedCount > 1 ? 's' : ''} uploaded successfully`);
      loadContents();
    }
    if (failedCount > 0) {
      setError(`${failedCount} file${failedCount > 1 ? 's' : ''} failed to upload`);
    }
  };

  // Drag-and-drop handlers for parent drop zone
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    // External file drop → upload to current folder
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
      return;
    }

    // Internal item drop → move to current folder
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const draggedItem = JSON.parse(data) as FolderItem;
        // Can't drop an item onto the folder it's already in
        if (draggedItem.kind === 'folder') {
          // For folders, check if target is same as current parent
          // The parent drop zone means "move to current folder"
          await handleMoveItem(draggedItem, folderId);
        } else {
          await handleMoveItem(draggedItem, folderId);
        }
      } catch {
        // Ignore parse errors
      }
    }
  };

  const breadcrumb: BreadcrumbItem[] = data
    ? [
        { label: 'My Drive', href: '/workspace', folderId: '00000000-0000-0000-0000-000000000001' },
        { label: data.folder.name },
      ]
    : [{ label: 'My Drive', href: '/workspace', folderId: '00000000-0000-0000-0000-000000000001' }];

  // Breadcrumb drop handler
  const handleDropOnBreadcrumb = async (targetFolderId: string, event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // External file drop
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      await handleUploadToFolder(targetFolderId, event.dataTransfer.files);
      return;
    }

    // Internal item drop
    const data = event.dataTransfer.getData('application/json');
    if (data) {
      try {
        const draggedItem = JSON.parse(data) as FolderItem;
        await handleMoveItem(draggedItem, targetFolderId);
      } catch {
        // Ignore parse errors
      }
    }
  };

  if (loading) {
    return (
      <WorkspaceLayout breadcrumb={breadcrumb} onDropOnBreadcrumb={handleDropOnBreadcrumb}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      </WorkspaceLayout>
    );
  }

  if (error || !data) {
    return (
      <WorkspaceLayout breadcrumb={breadcrumb} onDropOnBreadcrumb={handleDropOnBreadcrumb}>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Failed to load folder'}
        </Alert>
      </WorkspaceLayout>
    );
  }

  const { folder, items, total_items } = data;

  return (
    <WorkspaceLayout breadcrumb={breadcrumb} onDropOnBreadcrumb={handleDropOnBreadcrumb}>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Hidden file input for upload button */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        multiple
      />

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        parentFolderId={folderId}
        onSuccess={() => {
          showSuccess('Folder created successfully');
          loadContents();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.name || ''}
        itemKind={itemToDelete?.kind || 'folder'}
      />

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            {folder.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {total_items} {total_items === 1 ? 'item' : 'items'}
            {uploading && ' • Uploading...'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CreateNewFolder />}
            onClick={() => setCreateDialogOpen(true)}
          >
            New Folder
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<UploadFile />}
            onClick={handleUploadClick}
          >
            Upload
          </Button>
        </Box>
      </Box>

      {items.length === 0 && !isDragOver ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            color: 'text.secondary',
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            This folder is empty
          </Typography>
          <Typography variant="body2">
            Upload files, create folders, or add artifacts to get started.
          </Typography>
        </Box>
      ) : (
        <Box
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            minHeight: 200,
            p: 5,
            border: isDragOver ? '2px dashed' : '2px solid transparent',
            borderColor: isDragOver ? 'primary.main' : 'transparent',
            borderRadius: 2,
            bgcolor: isDragOver
              ? 'action.hover'
              : 'background.paper',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
        >
          {isDragOver && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 500 }}>
                Drop files here
              </Typography>
            </Box>
          )}
          <Grid container spacing={4} sx={{ opacity: isDragOver ? 0.3 : 1, transition: 'opacity 0.2s ease' }}>
            {items.map((item: FolderItem) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={item.id}>
                <FolderItemCard
                  item={item}
                  onDelete={handleDeleteRequest}
                  onRename={item.kind === 'folder' ? handleRename : undefined}
                  onMoveItem={handleMoveItem}
                  onUploadToFolder={handleUploadToFolder}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </WorkspaceLayout>
  );
}

export default function FolderExplorerPage() {
  return (
    <ProtectedRoute>
      <FolderExplorerContent />
    </ProtectedRoute>
  );
}

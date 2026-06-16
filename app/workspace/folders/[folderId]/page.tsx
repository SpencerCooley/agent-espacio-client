'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
  Menu,
  MenuItem,
  Fade,
} from '@mui/material';
import { CreateNewFolder, UploadFile, NoteAdd, Share as ShareIcon } from '@mui/icons-material';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import WorkspaceLayout from '../../../../components/layout/WorkspaceLayout';
import FolderItemCard from '../../../../components/workspace/FolderItemCard';
import CreateFolderDialog from '../../../../components/workspace/CreateFolderDialog';
import DeleteConfirmDialog from '../../../../components/workspace/DeleteConfirmDialog';
import { folderService, FolderContentsResponse, FolderItem } from '../../../../services/folders';
import { assetService } from '../../../../services/assets';
import { artifactService, ArtifactType } from '../../../../services/artifacts';
import { useWebSocket } from '../../../../context/WebSocketContext';
import SharePanel from '../../../../components/workspace/SharePanel';

interface BreadcrumbItem {
  label: string;
  href?: string;
  folderId?: string;
}

function FolderExplorerContent() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<FolderContentsResponse | null>(null);
  const dataRef = useRef<FolderContentsResponse | null>(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  const [ancestors, setAncestors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FolderItem | null>(null);

  // Artifact creation state
  const [artifactTypes, setArtifactTypes] = useState<ArtifactType[]>([]);
  const [artifactTypeAnchor, setArtifactTypeAnchor] = useState<HTMLElement | null>(null);
  const [creatingArtifact, setCreatingArtifact] = useState(false);

  // Drag-and-drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Real-time: track newly added items for highlight animation
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());

  // Share state
  const [isPublic, setIsPublic] = useState(false);
  const [publicMagicId, setPublicMagicId] = useState<string | null>(null);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [parentIsPublic, setParentIsPublic] = useState(false);

  // Ref-based drag counter to handle nested drag enter/leave
  const dragCounterRef = useRef(0);
  const { subscribe, unsubscribe } = useWebSocket();

  const loadContents = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await folderService.getFolderContents(folderId);
      setData(response);
      setIsPublic(response.folder.is_public);
      setPublicMagicId(response.folder.public_magic_id);
      // Fetch ancestors for breadcrumb
      const ancestorsRes = await folderService.getFolderAncestors(folderId);
      const chain = ancestorsRes.ancestors
        .filter((f) => !f.is_root && f.id !== folderId)
        .map((f) => ({
          id: f.id,
          name: f.name,
        }));
      setAncestors(chain);
      // Check if any ancestor is publicly shared (inherited public status)
      const hasPublicParent = ancestorsRes.ancestors.some(
        (f) => !f.is_root && f.id !== folderId && f.is_public
      );
      setParentIsPublic(hasPublicParent);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load folder contents';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  const handleToggleShare = useCallback(async () => {
    if (!folderId || isShareLoading) return;
    setIsShareLoading(true);
    try {
      const response = await folderService.shareFolder(folderId);
      setIsPublic(response.is_public);
      setPublicMagicId(response.public_magic_id);
      setSuccessMessage(
        response.is_public
          ? 'Folder is now publicly shared'
          : 'Folder is now private'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to toggle sharing';
      setError(message);
    } finally {
      setIsShareLoading(false);
    }
  }, [folderId, isShareLoading]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  useEffect(() => {
    artifactService.getArtifactDocs()
      .then((res) => setArtifactTypes(res.types ?? []))
      .catch(() => {});
  }, []);

  // Subscribe to real-time folder updates
  useEffect(() => {
    if (!folderId) return;

    const channel = `folder:${folderId}`;
    const handleEvent = (event: any) => {
      // Refresh folder contents on any change
      folderService.getFolderContents(folderId)
        .then((response) => {
          // Track new items for highlight animation
          const oldIds = new Set(dataRef.current?.items.map((i) => i.id) ?? []);
          const newIds = new Set<string>();
          for (const item of response.items) {
            if (!oldIds.has(item.id)) {
              newIds.add(item.id);
            }
          }
          if (newIds.size > 0) {
            setNewItemIds(newIds);
            setTimeout(() => {
              setNewItemIds(new Set());
            }, 2000);
          }
          setData(response);
        })
        .catch(() => {});
    };

    subscribe(channel, handleEvent);
    return () => {
      unsubscribe(channel, handleEvent);
    };
  }, [folderId, subscribe, unsubscribe]);

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

  // Artifact creation handler
  const handleCreateArtifact = async (type: ArtifactType) => {
    setArtifactTypeAnchor(null);
    setCreatingArtifact(true);
    try {
      // For maps, create a clean map without any default geometries.
      // For notes, start empty so the editor begins blank.
      let content: any;
      if (type.key === 'map') {
        content = {
          viewport: {
            latitude: 20,
            longitude: 0,
            zoom: 2,
            pitch: 0,
            bearing: 0,
            bounds: {
              north: 85.0,
              south: -85.0,
              east: 180.0,
              west: -180.0,
            },
          },
          style: 'carto-voyager',
          geojson: {
            type: 'FeatureCollection',
            features: [],
          },
        };
      } else if (type.key === 'note') {
        content = {};
      } else {
        content = (type.example_content as any)?.content || {};
      }

      const artifact = await artifactService.createArtifact({
        name: `New ${type.name}`,
        type: type.key,
        content,
        folder_id: folderId,
      });
      router.push(`/workspace/artifacts/${artifact.id}`);
    } catch {
      setError('Failed to create artifact');
    } finally {
      setCreatingArtifact(false);
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
        ...ancestors.map((f) => ({
          label: f.name,
          href: `/workspace/folders/${f.id}`,
          folderId: f.id,
        })),
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
    <WorkspaceLayout
      breadcrumb={breadcrumb}
      onDropOnBreadcrumb={handleDropOnBreadcrumb}
      rightPanel={
        showSharePanel && folder.parent_id && !parentIsPublic ? (
          <SharePanel
            itemId={folderId}
            itemType="folder"
            isPublic={isPublic}
            publicMagicId={publicMagicId}
            onToggle={handleToggleShare}
          />
        ) : undefined
      }
    >
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
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Share toggle button - only for non-root folders not under a public parent */}
          {folder.parent_id && !parentIsPublic && (
            <Button
              variant={showSharePanel ? "contained" : "outlined"}
              size="small"
              startIcon={<ShareIcon />}
              onClick={() => setShowSharePanel(!showSharePanel)}
              color={isPublic ? "success" : "primary"}
            >
              {showSharePanel ? 'Hide' : 'Share'}
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<CreateNewFolder />}
            onClick={() => setCreateDialogOpen(true)}
          >
            New Folder
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<NoteAdd />}
            onClick={(e) => setArtifactTypeAnchor(e.currentTarget)}
            disabled={creatingArtifact}
          >
            New Artifact
          </Button>
          <Menu
            anchorEl={artifactTypeAnchor}
            open={Boolean(artifactTypeAnchor)}
            onClose={() => setArtifactTypeAnchor(null)}
          >
            {artifactTypes.map((t) => (
              <MenuItem key={t.key} onClick={() => handleCreateArtifact(t)}>
                {t.name}
              </MenuItem>
            ))}
          </Menu>
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
                <Fade in={true} timeout={newItemIds.has(item.id) ? 1000 : 0}>
                  <Box>
                    <FolderItemCard
                      item={item}
                      onDelete={handleDeleteRequest}
                      onRename={item.kind === 'folder' ? handleRename : undefined}
                      onMoveItem={handleMoveItem}
                      onUploadToFolder={handleUploadToFolder}
                      isNew={newItemIds.has(item.id)}
                    />
                  </Box>
                </Fade>
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

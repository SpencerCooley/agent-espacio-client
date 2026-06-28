'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  Typography,
  IconButton,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  CircularProgress,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  ViewModule,
  ViewCarousel,
  ViewQuilt,
  Delete,
  DragIndicator,
  AddPhotoAlternate,
  Close,
} from '@mui/icons-material';
import { artifactService, Artifact } from '../../services/artifacts';
import { assetService, Asset, getAssetDownloadUrl } from '../../services/assets';
import { useAuthImage } from '../../hooks/useAuthImage';

interface GalleryEditorProps {
  artifact: Artifact;
}

interface GalleryItem {
  asset_id: string;
  caption: string;
}

interface GalleryContent {
  layout: 'default' | 'carousel' | 'masonry';
  items: GalleryItem[];
  linked_asset_ids: string[];
}

function getGalleryContent(content: unknown): GalleryContent {
  const c = (content || {}) as Partial<GalleryContent>;
  return {
    layout: c.layout || 'default',
    items: Array.isArray(c.items) ? c.items : [],
    linked_asset_ids: Array.isArray(c.linked_asset_ids) ? c.linked_asset_ids : [],
  };
}

/** Authenticated thumbnail image — exact same pattern as FolderItemCard */
function GalleryThumb({
  assetId,
  size,
  alt,
  sx,
}: {
  assetId: string;
  size: number;
  alt?: string;
  sx?: React.ComponentProps<typeof Box>['sx'];
}) {
  const thumbUrl = getAssetDownloadUrl(assetId, size);
  const thumbSrc = useAuthImage(thumbUrl);

  return (
    <Box
      component="img"
      src={thumbSrc || ''}
      alt={alt || ''}
      sx={{
        ...(sx as any),
        // When thumbSrc is null (loading or error), show a subtle placeholder background
        ...(thumbSrc
          ? {}
          : { bgcolor: 'action.hover', minHeight: 80 }),
      }}
    />
  );
}

export default function GalleryEditor({ artifact }: GalleryEditorProps) {
  const [name, setName] = useState(artifact.name);
  const lastSavedName = useRef(artifact.name);
  const [description, setDescription] = useState(artifact.description || '');
  const lastSavedDescription = useRef(artifact.description || '');

  const [content, setContent] = useState<GalleryContent>(getGalleryContent(artifact.content));
  const lastSavedContent = useRef<GalleryContent>(getGalleryContent(artifact.content));

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queueSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const updates: Partial<{
        name: string;
        description: string;
        content: Record<string, unknown>;
      }> = {};
      if (name !== lastSavedName.current) updates.name = name;
      if (description !== lastSavedDescription.current) updates.description = description;
      const currentContent = { ...content, linked_asset_ids: content.items.map((i) => i.asset_id) };
      if (JSON.stringify(currentContent) !== JSON.stringify(lastSavedContent.current)) {
        updates.content = currentContent as Record<string, unknown>;
      }
      if (Object.keys(updates).length > 0) {
        artifactService
          .updateArtifact(artifact.id, updates)
          .then(() => {
            lastSavedName.current = name;
            lastSavedDescription.current = description;
            lastSavedContent.current = currentContent;
          })
          .catch(() => {
            // Silent fail; user can continue editing
          });
      }
    }, 1500);
  }, [name, description, content, artifact.id]);

  useEffect(() => {
    queueSave();
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [name, description, content, queueSave]);

  const handleLayoutChange = (_event: React.MouseEvent<HTMLElement>, newLayout: string | null) => {
    if (newLayout && newLayout !== content.layout) {
      setContent((prev) => ({ ...prev, layout: newLayout as GalleryContent['layout'] }));
    }
  };

  const handleCaptionChange = (index: number, caption: string) => {
    setContent((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], caption };
      return { ...prev, items: newItems };
    });
  };

  const handleRemoveItem = (index: number) => {
    setContent((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems, linked_asset_ids: newItems.map((i) => i.asset_id) };
    });
    if (selectedIndex === index) {
      setSelectedIndex(null);
    } else if (selectedIndex !== null && selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const DRAG_TYPE = 'application/x-gallery-index';

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData(DRAG_TYPE, String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnterCard = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes(DRAG_TYPE)) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeaveCard = (e: React.DragEvent) => {
    // Only clear if leaving the card entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes(DRAG_TYPE)) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    // External file drop on a card
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
      return;
    }

    const raw = e.dataTransfer.getData(DRAG_TYPE);
    if (!raw) return; // Not an internal reorder
    const dragIndex = Number(raw);
    if (dragIndex === dropIndex || Number.isNaN(dragIndex)) return;
    setDragOverIndex(null);
    setContent((prev) => {
      const newItems = [...prev.items];
      const [moved] = newItems.splice(dragIndex, 1);
      newItems.splice(dropIndex, 0, moved);
      return { ...prev, items: newItems, linked_asset_ids: newItems.map((i) => i.asset_id) };
    });
    if (selectedIndex === dragIndex) {
      setSelectedIndex(dropIndex);
    } else if (selectedIndex !== null) {
      const old = selectedIndex;
      if (dragIndex < old && dropIndex >= old) {
        setSelectedIndex(old - 1);
      } else if (dragIndex > old && dropIndex <= old) {
        setSelectedIndex(old + 1);
      }
    }
  };

  // Zone-level drag-and-drop for external file uploads
  const handleZoneDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files') && !e.dataTransfer.types.includes(DRAG_TYPE)) {
      dragCounterRef.current += 1;
      setIsDragOver(true);
    }
  };

  const handleZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files') && !e.dataTransfer.types.includes(DRAG_TYPE)) {
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  };

  const handleZoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  };

  const handleZoneDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    // Ignore internal gallery item drops on the zone background
    if (e.dataTransfer.types.includes(DRAG_TYPE)) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploadedAssetIds: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const response = await assetService.uploadAsset(file, artifact.folder_id);
        const asset = response?.asset || response;
        const assetId = asset?.id;
        if (assetId) {
          uploadedAssetIds.push(assetId);
        }
      } catch {
        // ignore individual failures
      }
    }
    setUploading(false);
    if (uploadedAssetIds.length > 0) {
      setContent((prev) => {
        const newItems = [
          ...prev.items,
          ...uploadedAssetIds.map((id) => ({ asset_id: id, caption: '' })),
        ];
        return { ...prev, items: newItems, linked_asset_ids: newItems.map((i) => i.asset_id) };
      });
      setSuccessMessage(`${uploadedAssetIds.length} image${uploadedAssetIds.length > 1 ? 's' : ''} uploaded and added`);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await handleUploadFiles(files);
    event.target.value = '';
  };

  const openAddDialog = () => {
    setAddDialogOpen(true);
    setAssetsLoading(true);
    assetService
      .listAssets(undefined, 'image/')
      .then((res) => {
        const all = res.assets || [];
        const existing = new Set(content.items.map((i) => i.asset_id));
        setAvailableAssets(all.filter((a) => !existing.has(a.id)));
      })
      .catch(() => setAvailableAssets([]))
      .finally(() => setAssetsLoading(false));
  };

  const handleAddExisting = () => {
    if (!selectedAsset) return;
    setContent((prev) => {
      const newItems = [...prev.items, { asset_id: selectedAsset.id, caption: '' }];
      return { ...prev, items: newItems, linked_asset_ids: newItems.map((i) => i.asset_id) };
    });
    setSelectedAsset(null);
    setAddDialogOpen(false);
  };

  const selectedItem = selectedIndex !== null ? content.items[selectedIndex] : null;

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main content area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ px: 3, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant="standard"
            fullWidth
            placeholder="Gallery name"
            sx={{
              '& .MuiInputBase-input': { fontSize: '1.5rem', fontWeight: 600, px: 0 },
              mb: 1.5,
            }}
          />
          <TextField
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            variant="standard"
            fullWidth
            placeholder="Description (optional)"
            sx={{ '& .MuiInputBase-input': { fontSize: '0.95rem', color: 'text.secondary', px: 0 }, mb: 1.5 }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <ToggleButtonGroup
              value={content.layout}
              exclusive
              onChange={handleLayoutChange}
              size="small"
            >
              <ToggleButton value="default" aria-label="default layout">
                <ViewModule fontSize="small" sx={{ mr: 0.5 }} />
                Grid
              </ToggleButton>
              <ToggleButton value="carousel" aria-label="carousel layout">
                <ViewCarousel fontSize="small" sx={{ mr: 0.5 }} />
                Carousel
              </ToggleButton>
              <ToggleButton value="masonry" aria-label="masonry layout">
                <ViewQuilt fontSize="small" sx={{ mr: 0.5 }} />
                Masonry
              </ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddPhotoAlternate />}
              onClick={openAddDialog}
              sx={{ textTransform: 'none' }}
            >
              Add existing
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddPhotoAlternate />}
              onClick={handleUploadClick}
              disabled={uploading}
              sx={{ textTransform: 'none' }}
            >
              {uploading ? 'Uploading…' : 'Upload images'}
            </Button>
            <input
              type="file"
              multiple
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </Box>
        </Box>

        {/* Image grid */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            bgcolor: isDragOver ? 'action.hover' : 'transparent',
            border: isDragOver ? '2px dashed' : '2px solid transparent',
            borderColor: isDragOver ? 'primary.main' : 'transparent',
            borderRadius: isDragOver ? 2 : 0,
            transition: 'background-color 0.2s, border-color 0.2s',
          }}
          onDragEnter={handleZoneDragEnter}
          onDragOver={handleZoneDragOver}
          onDragLeave={handleZoneDragLeave}
          onDrop={handleZoneDrop}
        >
          {content.items.length === 0 ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
                gap: 2,
              }}
            >
              <AddPhotoAlternate sx={{ fontSize: 64, opacity: 0.4 }} />
              <Typography align="center">
                No images yet. Upload or add existing images to get started.
                <br />
                You can also drag and drop images here.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 2,
              }}
            >
              {content.items.map((item, index) => (
                <Paper
                  key={item.asset_id ? `${item.asset_id}-${index}` : `gallery-item-${index}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnterCard(e, index)}
                  onDragLeave={handleDragLeaveCard}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => setSelectedIndex(index)}
                  sx={{
                    position: 'relative',
                    cursor: 'grab',
                    border:
                      dragOverIndex === index
                        ? '2px dashed'
                        : selectedIndex === index
                          ? '2px solid'
                          : '1px solid',
                    borderColor:
                      dragOverIndex === index
                        ? 'primary.main'
                        : selectedIndex === index
                          ? 'primary.main'
                          : 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.15s, border-color 0.15s, border-style 0.15s',
                    bgcolor: dragOverIndex === index ? 'action.hover' : 'background.paper',
                    '&:hover': { boxShadow: 2 },
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <GalleryThumb
                      assetId={item.asset_id}
                      size={256}
                      alt={item.caption || `Image ${index + 1}`}
                      sx={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                    />
                    {item.caption && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                          px: 1,
                          py: 0.75,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#fff',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.caption}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      #{index + 1}
                    </Typography>
                    <Tooltip title="Remove from gallery">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(index);
                        }}
                        sx={{ p: 0.5 }}
                      >
                        <Delete fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <DragIndicator sx={{ color: '#fff', fontSize: 16 }} />
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Right panel */}
      {selectedItem && selectedIndex !== null && (
        <Box
          sx={{
            width: 320,
            borderLeft: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              Image {selectedIndex + 1} of {content.items.length}
            </Typography>
            <IconButton size="small" onClick={() => setSelectedIndex(null)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <GalleryThumb
              assetId={selectedItem.asset_id}
              size={512}
              alt={selectedItem.caption || `Image ${selectedIndex + 1}`}
              sx={{ width: '100%', borderRadius: 1, objectFit: 'cover' }}
            />
            <TextField
              label="Caption"
              value={selectedItem.caption}
              onChange={(e) => handleCaptionChange(selectedIndex, e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Add a caption for this image..."
              sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
            />
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<Delete />}
              onClick={() => handleRemoveItem(selectedIndex)}
              sx={{ textTransform: 'none', mt: 'auto' }}
            >
              Remove from gallery
            </Button>
          </Box>
        </Box>
      )}

      {/* Add existing dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add existing images</DialogTitle>
        <DialogContent>
          {assetsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : availableAssets.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No more image assets available in the workspace.
            </Typography>
          ) : (
            <Autocomplete
              options={availableAssets}
              getOptionLabel={(option) => option.name}
              value={selectedAsset}
              onChange={(_event, newValue) => setSelectedAsset(newValue)}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <GalleryThumb
                    assetId={option.id}
                    size={256}
                    alt={option.name}
                    sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 0.5, flexShrink: 0 }}
                  />
                  <Typography variant="body2" noWrap>
                    {option.name}
                  </Typography>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search images"
                  placeholder="Type to search by name..."
                  margin="normal"
                />
              )}
              fullWidth
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddExisting}
            variant="contained"
            disabled={!selectedAsset}
            sx={{ textTransform: 'none' }}
          >
            Add to gallery
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

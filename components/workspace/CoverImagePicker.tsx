'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Autocomplete,
} from '@mui/material';
import {
  Image as ImageIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { artifactService } from '../../services/artifacts';
import { Asset, assetService } from '../../services/assets';
import { folderService } from '../../services/folders';
import { useSignedAssetUrl } from '../../hooks/useSignedAssetUrl';

interface CoverImagePickerProps {
  /** Structurally the fields this picker needs — full Artifact also works. */
  artifact: {
    id: string;
    meta?: Record<string, unknown> | null;
    folder_id?: string | null;
  };
  /** Called after a successful save with the new cover asset id (or null). */
  onChange?: (assetId: string | null) => void;
}

/**
 * Shared featured-image picker (adapted from ComposerMetaPanel).
 *
 * Stores the selection in `artifact.meta.cover_asset_id` — the same field the
 * composer and the feed use, so feed cards and OG tags pick it up for free.
 * Supports picking an existing image asset (search), uploading a new one
 * (button or drag-drop), and removing the current cover.
 */
export default function CoverImagePicker({ artifact, onChange }: CoverImagePickerProps) {
  const [coverAssetId, setCoverAssetId] = useState<string | null>(
    typeof artifact.meta?.cover_asset_id === 'string' ? artifact.meta.cover_asset_id : null
  );
  const [knownImageAssets, setKnownImageAssets] = useState<Asset[]>([]);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [imageSearchResults, setImageSearchResults] = useState<Asset[]>([]);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const coverInputRef = useRef<HTMLInputElement>(null);
  // Track the latest meta we've written so consecutive saves merge instead of
  // clobbering keys written by other editors.
  const metaRef = useRef<Record<string, unknown>>(artifact.meta || {});

  // Load the currently selected cover asset so it can display in the picker
  useEffect(() => {
    const currentId = typeof artifact.meta?.cover_asset_id === 'string' ? artifact.meta.cover_asset_id : null;
    if (!currentId) return;
    assetService.getAsset(currentId)
      .then((asset) => {
        setKnownImageAssets((prev) => {
          if (prev.find((a) => a.id === asset.id)) return prev;
          return [...prev, asset];
        });
      })
      .catch((err) => console.error('Failed to load current cover asset', err));
  }, [artifact.meta?.cover_asset_id]);

  // Debounced search for image assets
  useEffect(() => {
    if (!imageSearchOpen || imageSearchQuery.trim().length < 2) {
      setImageSearchResults([]);
      return;
    }

    setImageSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const rootFolderId = '00000000-0000-0000-0000-000000000001';
        const res = await folderService.searchFolderItems(rootFolderId, imageSearchQuery.trim());

        const imageItems: Asset[] = (res.items || [])
          .filter((item: any) => item.kind === 'asset')
          .filter((item: any) => (item.mime_type || '').startsWith('image/'))
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            storage_filename: '',
            mime_type: item.mime_type,
            size_bytes: 0,
            human_readable_size: '',
            folder_id: null,
            is_image: true,
            is_markdown: false,
            file_extension: '',
            file_meta: null,
            is_public: item.is_public ?? false,
            public_magic_id: item.public_magic_id ?? null,
            descendant_of: null,
            created_at: item.created_at,
            updated_at: item.updated_at,
            created_by_id: null,
          }));

        setImageSearchResults(imageItems);

        // Merge into known cache so selected assets survive dropdown closes
        setKnownImageAssets((prev) => {
          const merged = [...prev];
          for (const item of imageItems) {
            if (!merged.find((a) => a.id === item.id)) {
              merged.push(item);
            }
          }
          return merged;
        });
      } catch (e) {
        console.error('Image search failed', e);
        setImageSearchResults([]);
      } finally {
        setImageSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [imageSearchQuery, imageSearchOpen]);

  // Save cover asset ID into artifact.meta.cover_asset_id
  const saveCoverAssetId = useCallback(async (assetId: string | null) => {
    setCoverAssetId(assetId);
    const nextMeta = { ...metaRef.current, cover_asset_id: assetId };
    try {
      await artifactService.updateArtifact(artifact.id, { meta: nextMeta });
      metaRef.current = nextMeta;
      onChange?.(assetId);
    } catch (err) {
      console.error('Failed to save cover asset', err);
    }
  }, [artifact.id, onChange]);

  const handleCoverSelect = useCallback((asset: Asset | null) => {
    saveCoverAssetId(asset ? asset.id : null);
  }, [saveCoverAssetId]);

  const handleRemoveCover = useCallback(() => {
    saveCoverAssetId(null);
  }, [saveCoverAssetId]);

  // Drag-and-drop upload
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const uploadCoverFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    setUploading(true);
    try {
      const result = await assetService.uploadAsset(file, artifact.folder_id || undefined);
      const uploadedAsset = result.asset || result;
      if (uploadedAsset?.id) {
        setKnownImageAssets((prev) => [uploadedAsset, ...prev]);
        setImageSearchResults((prev) => [uploadedAsset, ...prev]);
        await saveCoverAssetId(uploadedAsset.id);
      }
    } catch (err: any) {
      console.error('Failed to upload cover image', err);
    } finally {
      setUploading(false);
    }
  }, [artifact.folder_id, saveCoverAssetId]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Only accept the first image file
    const file = (Array.from(files) as File[]).find((f) => f.type.startsWith('image/'));
    if (!file) return;

    await uploadCoverFile(file);
  }, [uploadCoverFile]);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <ImageIcon sx={{ fontSize: 14 }} />
        Featured Image
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
        Used for social sharing cards (OG image) and feed covers.
      </Typography>

      {coverAssetId ? (
        <Paper variant="outlined" sx={{ p: 1.5, mt: 1, position: 'relative' }}>
          <CoverImagePreview assetId={coverAssetId} size={512} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CloseIcon />}
              onClick={handleRemoveCover}
              fullWidth
            >
              Remove
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            mt: 1,
            borderStyle: isDragOver ? 'dashed' : 'solid',
            borderColor: isDragOver ? 'primary.main' : 'divider',
            bgcolor: isDragOver ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s ease',
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {uploading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress size={28} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Uploading...
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <UploadIcon sx={{ color: 'text.secondary', fontSize: 32, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Drop an image here
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  or select from workspace
                </Typography>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadCoverFile(file);
                    e.target.value = '';
                  }}
                />
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    startIcon={<UploadIcon />}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    Choose file
                  </Button>
                </Box>
              </Box>

              <Autocomplete
                options={imageSearchResults}
                getOptionLabel={(item) =>
                  typeof item === 'string' ? item : item.name
                }
                renderOption={(props, item) => {
                  const asset = item as Asset;
                  return (
                    <li {...props} key={asset.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <AutocompleteThumb assetId={asset.id} />
                        <Typography variant="body2">{asset.name}</Typography>
                      </Box>
                    </li>
                  );
                }}
                value={knownImageAssets.find((a) => a.id === coverAssetId) || null}
                onChange={(_, value) => {
                  handleCoverSelect(value as Asset | null);
                  if (value && typeof value !== 'string') {
                    setImageSearchOpen(false);
                  }
                }}
                onInputChange={(_, value) => {
                  setImageSearchQuery(value);
                }}
                open={imageSearchOpen}
                onOpen={() => setImageSearchOpen(true)}
                onClose={() => setImageSearchOpen(false)}
                filterOptions={(x) => x}
                loading={imageSearchLoading}
                noOptionsText={imageSearchQuery.trim().length < 2 ? 'Type at least 2 characters' : 'No results'}
                fullWidth
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select image asset"
                    placeholder="Search images..."
                  />
                )}
              />
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}

/* Sub-component: renders cover image preview using a signed URL */
function CoverImagePreview({ assetId, size }: { assetId: string; size: number }) {
  const signedUrl = useSignedAssetUrl(assetId, size > 256 ? 512 : 256);

  if (!signedUrl) {
    return (
      <Box sx={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={signedUrl}
      alt="Featured"
      sx={{
        width: '100%',
        maxHeight: 300,
        objectFit: 'cover',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    />
  );
}

/* Sub-component: 40×40 thumbnail for Autocomplete rows */
function AutocompleteThumb({ assetId }: { assetId: string }) {
  const signedUrl = useSignedAssetUrl(assetId, 256);

  if (!signedUrl) {
    return (
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 0.5,
          flexShrink: 0,
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={14} thickness={4} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={signedUrl}
      alt=""
      sx={{
        width: 40,
        height: 40,
        borderRadius: 0.5,
        objectFit: 'cover',
        flexShrink: 0,
        border: '1px solid',
        borderColor: 'divider',
      }}
    />
  );
}

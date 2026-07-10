'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Autocomplete,
} from '@mui/material';
import {
  RssFeed as FeedIcon,
  Label as TagIcon,
  Description as DescriptionIcon,
  Public as PublicIcon,
  Image as ImageIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Artifact, artifactService } from '../../services/artifacts';
import { feedService } from '../../services/feed';
import { Asset, assetService } from '../../services/assets';
import { folderService } from '../../services/folders';
import { useSignedAssetUrl } from '../../hooks/useSignedAssetUrl';

interface ComposerMetaPanelProps {
  artifact: Artifact;
  onArtifactUpdate: (updated: Artifact) => void;
}

export default function ComposerMetaPanel({ artifact, onArtifactUpdate }: ComposerMetaPanelProps) {
  const [inFeed, setInFeed] = useState(false);
  const [checkingFeed, setCheckingFeed] = useState(true);
  const [feedActionLoading, setFeedActionLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [description, setDescription] = useState(artifact.description || '');
  const [descriptionSaving, setDescriptionSaving] = useState(false);

  const [tags, setTags] = useState<string[]>(Array.isArray(artifact.meta?.tags) ? artifact.meta.tags : []);
  const [tagInput, setTagInput] = useState('');
  const [tagsSaving, setTagsSaving] = useState(false);

  // Featured image state
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

  // Check feed status on mount
  useEffect(() => {
    setCheckingFeed(true);
    feedService.getFeedItemStatus(artifact.id)
      .then(() => setInFeed(true))
      .catch(() => setInFeed(false))
      .finally(() => setCheckingFeed(false));
  }, [artifact.id]);

  // Load currently selected cover asset on mount so it can display in the picker
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
          .filter((item: any) => {
            const mime = item.mime_type || '';
            return mime.startsWith('image/');
          })
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

  // Toggle feed inclusion
  const handleFeedToggle = useCallback(async () => {
    setFeedActionLoading(true);
    setFeedError(null);
    try {
      if (inFeed) {
        await feedService.removeFromFeed(artifact.id);
        setInFeed(false);
      } else {
        await feedService.addToFeed(artifact.id);
        setInFeed(true);
      }
    } catch (err: any) {
      setFeedError(err.message || 'Failed to update feed status');
    } finally {
      setFeedActionLoading(false);
    }
  }, [artifact.id, inFeed]);

  // Save description
  const handleDescriptionSave = useCallback(async () => {
    setDescriptionSaving(true);
    try {
      const updated = await artifactService.updateArtifact(artifact.id, {
        description: description.trim() || undefined,
      });
      onArtifactUpdate(updated);
    } catch (err: any) {
      console.error('Failed to save description', err);
    } finally {
      setDescriptionSaving(false);
    }
  }, [artifact.id, description, onArtifactUpdate]);

  // Add tag
  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) return;
    const newTags = [...tags, trimmed];
    setTags(newTags);
    setTagInput('');
    setTagsSaving(true);
    artifactService.updateArtifact(artifact.id, {
      meta: { ...(artifact.meta || {}), tags: newTags },
    })
      .then((updated) => onArtifactUpdate(updated))
      .catch((err) => console.error('Failed to save tags', err))
      .finally(() => setTagsSaving(false));
  }, [artifact.id, artifact.meta, tags, tagInput, onArtifactUpdate]);

  // Remove tag
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    setTagsSaving(true);
    artifactService.updateArtifact(artifact.id, {
      meta: { ...(artifact.meta || {}), tags: newTags },
    })
      .then((updated) => onArtifactUpdate(updated))
      .catch((err) => console.error('Failed to save tags', err))
      .finally(() => setTagsSaving(false));
  }, [artifact.id, artifact.meta, tags, onArtifactUpdate]);

  // Save cover asset ID
  const saveCoverAssetId = useCallback(async (assetId: string | null) => {
    setCoverAssetId(assetId);
    try {
      const updated = await artifactService.updateArtifact(artifact.id, {
        meta: { ...(artifact.meta || {}), cover_asset_id: assetId, tags },
      });
      onArtifactUpdate(updated);
    } catch (err) {
      console.error('Failed to save cover asset', err);
    }
  }, [artifact.id, artifact.meta, tags, onArtifactUpdate]);

  // Handle cover selection from autocomplete
  const handleCoverSelect = useCallback((asset: Asset | null) => {
    saveCoverAssetId(asset ? asset.id : null);
  }, [saveCoverAssetId]);

  // Remove cover
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

  const isPublic = artifact.is_public;
  const publicUrl = artifact.public_magic_id
    ? `${window.location.origin}/public/view/${artifact.public_magic_id}`
    : null;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FeedIcon fontSize="small" />
        Feed Curation
      </Typography>

      {feedError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {feedError}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 1.5, mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={inFeed}
              onChange={handleFeedToggle}
              disabled={checkingFeed || feedActionLoading}
              size="small"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2">
                {checkingFeed
                  ? 'Checking...'
                  : inFeed
                    ? 'In main feed'
                    : 'Not in feed'}
              </Typography>
              {feedActionLoading && <CircularProgress size={14} thickness={4} />}
            </Box>
          }
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, ml: 4 }}>
          {inFeed
            ? 'This composition appears on the home page.'
            : 'Add to the curated feed to feature on the home page.'}
        </Typography>
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* Featured Image Section */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ImageIcon fontSize="small" />
        Featured Image
      </Typography>

      {coverAssetId ? (
        <Paper variant="outlined" sx={{ p: 1.5, mb: 3, position: 'relative' }}>
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
            mb: 3,
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

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <DescriptionIcon fontSize="small" />
        Description
      </Typography>

      <TextField
        multiline
        rows={3}
        size="small"
        fullWidth
        placeholder="Short summary for feed cards..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleDescriptionSave}
        disabled={descriptionSaving}
        sx={{ mb: 1 }}
      />
      {descriptionSaving && (
        <Typography variant="caption" color="text.secondary">
          Saving...
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TagIcon fontSize="small" />
        Tags
        {tagsSaving && <CircularProgress size={14} thickness={4} sx={{ ml: 1 }} />}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
        <TextField
          size="small"
          placeholder="Add tag..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTag();
            }
          }}
          fullWidth
        />
        <Button size="small" variant="outlined" onClick={handleAddTag} disabled={!tagInput.trim()}>
          Add
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            onDelete={() => handleRemoveTag(tag)}
            sx={{ textTransform: 'lowercase' }}
          />
        ))}
        {tags.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            No tags. Tags enable sub-feed filtering.
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PublicIcon fontSize="small" />
        Sharing
      </Typography>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="body2" component="span" sx={{ mb: 1, display: 'block' }}>
          Status:{' '}
          <Chip
            label={isPublic ? 'Public' : 'Private'}
            color={isPublic ? 'success' : 'default'}
            size="small"
            sx={{ ml: 0.5 }}
          />
        </Typography>

        {publicUrl && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Public URL:
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                wordBreak: 'break-all',
                color: 'primary.main',
                cursor: 'pointer',
              }}
              onClick={() => window.open(publicUrl, '_blank')}
            >
              {publicUrl}
            </Typography>
          </>
        )}

        {!isPublic && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Make this composition public to share it and appear in the feed.
          </Typography>
        )}
      </Paper>
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

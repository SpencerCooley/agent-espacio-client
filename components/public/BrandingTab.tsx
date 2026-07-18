'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Paper,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Wallpaper as BackgroundIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  AspectRatio as CoverIcon,
  GridView as TileIcon,
} from '@mui/icons-material';
import { Asset, assetService } from '../../services/assets';
import { folderService } from '../../services/folders';
import { usePublicAppearance } from '../../context/PublicAppearanceContext';
import { useSignedAssetUrl } from '../../hooks/useSignedAssetUrl';

const ROOT_FOLDER_ID = '00000000-0000-0000-0000-000000000001';

export default function BrandingTab() {
  const { branding, updateBranding, brandingLoading } = usePublicAppearance();
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = useCallback(async (updates: Record<string, any>) => {
    setSaveError(null);
    try {
      await updateBranding(updates);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save branding');
    }
  }, [updateBranding]);

  if (brandingLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Light Logo */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LightModeIcon fontSize="small" />
        Light Mode Logo
      </Typography>
      <AssetPicker
        field="logo_light_asset_id"
        label="Select light logo"
        assetId={branding.logo_light_asset_id || null}
        brandingLoading={brandingLoading}
        onSave={handleSave}
        onSaveError={setSaveError}
      />

      {/* Dark Logo */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <DarkModeIcon fontSize="small" />
        Dark Mode Logo
      </Typography>
      <AssetPicker
        field="logo_dark_asset_id"
        label="Select dark logo"
        assetId={branding.logo_dark_asset_id || null}
        brandingLoading={brandingLoading}
        onSave={handleSave}
        onSaveError={setSaveError}
      />

      <Divider sx={{ my: 2 }} />

      {/* Background */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BackgroundIcon fontSize="small" />
        Background
      </Typography>
      <AssetPicker
        field="background_asset_id"
        label="Select background image"
        assetId={branding.background_asset_id || null}
        brandingLoading={brandingLoading}
        onSave={handleSave}
        onSaveError={setSaveError}
      />

      {branding.background_asset_id && (
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={branding.background_style}
            exclusive
            onChange={(_, value) => value && handleSave({ background_style: value })}
            size="small"
            fullWidth
            disabled={brandingLoading}
          >
            <ToggleButton value="cover">
              <CoverIcon fontSize="small" sx={{ mr: 0.5 }} />
              Cover
            </ToggleButton>
            <ToggleButton value="tile">
              <TileIcon fontSize="small" sx={{ mr: 0.5 }} />
              Tile
            </ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            {branding.background_style === 'cover'
              ? 'Image fills the entire screen. Best for photographs.'
              : 'Image repeats in a pattern. Best for textures and tiles.'}
          </Typography>
        </Box>
      )}

      {saveError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {saveError}
        </Alert>
      )}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  AssetPicker — independent component with debounced server search   */
/* ------------------------------------------------------------------ */

interface AssetPickerProps {
  field: string;
  label: string;
  assetId: string | null;
  brandingLoading: boolean;
  onSave: (updates: Record<string, any>) => void;
  onSaveError: (err: string | null) => void;
}

function AssetPicker({ field, label, assetId, brandingLoading, onSave, onSaveError }: AssetPickerProps) {
  // Known assets cache so selected items survive dropdown closes
  const [knownAssets, setKnownAssets] = useState<Asset[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Upload / drag-drop state
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  // Load currently selected asset on mount so it displays in the picker
  useEffect(() => {
    if (!assetId) return;
    assetService.getAsset(assetId)
      .then((asset) => {
        setKnownAssets((prev) => {
          if (prev.find((a) => a.id === asset.id)) return prev;
          return [...prev, asset];
        });
      })
      .catch(() => {/* ignore */});
  }, [assetId]);

  // Debounced server-side search
  useEffect(() => {
    if (!searchOpen || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await folderService.searchFolderItems(ROOT_FOLDER_ID, searchQuery.trim());
        const imageItems: Asset[] = (res.items || [])
          .filter((item) => item.kind === 'asset')
          .filter((item) => (item.mime_type || '').startsWith('image/'))
          .map((item) => ({
            id: item.id,
            name: item.name,
            storage_filename: '',
            mime_type: item.mime_type || '',
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

        setSearchResults(imageItems);
        setKnownAssets((prev) => {
          const merged = [...prev];
          for (const item of imageItems) {
            if (!merged.find((a) => a.id === item.id)) {
              merged.push(item);
            }
          }
          return merged;
        });
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen]);

  // Drag-and-drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setDragOver(false);
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
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = (Array.from(files) as File[]).find((f) => f.type.startsWith('image/'));
    if (!file) return;

    setUploading(true);
    try {
      const result = await assetService.uploadAsset(file, ROOT_FOLDER_ID);
      const uploadedAsset = result.asset || result;
      if (uploadedAsset?.id) {
        setKnownAssets((prev) => [uploadedAsset, ...prev]);
        setSearchResults((prev) => [uploadedAsset, ...prev]);
        onSave({ [field]: uploadedAsset.id });
      }
    } catch (err: any) {
      onSaveError(err.message || `Failed to upload ${field}`);
    } finally {
      setUploading(false);
    }
  }, [field, onSave, onSaveError]);

  const handleSelect = useCallback((asset: Asset | null) => {
    onSave({ [field]: asset ? asset.id : null });
    if (asset) {
      setSearchOpen(false);
    }
  }, [field, onSave]);

  if (assetId) {
    return (
      <Paper variant="outlined" sx={{ p: 1, mb: 2, position: 'relative' }}>
        <IconButton
          size="small"
          onClick={() => onSave({ [field]: null })}
          disabled={brandingLoading}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 1,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <LogoPreview assetId={assetId} />
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        mb: 2,
        borderStyle: dragOver ? 'dashed' : 'solid',
        borderColor: dragOver ? 'primary.main' : 'divider',
        bgcolor: dragOver ? 'action.hover' : 'background.paper',
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
            onMouseDown={(e) => e.preventDefault()}
            options={searchResults}
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
            value={knownAssets.find((a) => a.id === assetId) || null}
            onChange={(_, value) => handleSelect(value as Asset | null)}
            onInputChange={(_, value) => setSearchQuery(value)}
            open={searchOpen}
            onOpen={() => setSearchOpen(true)}
            onClose={() => setSearchOpen(false)}
            filterOptions={(x) => x}
            loading={searchLoading}
            noOptionsText={searchQuery.trim().length < 2 ? 'Type at least 2 characters' : 'No results'}
            fullWidth
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder="Search images..."
              />
            )}
          />
        </>
      )}
    </Paper>
  );
}

/* Sub-component: renders logo preview using a signed URL */
function LogoPreview({ assetId }: { assetId: string }) {
  const signedUrl = useSignedAssetUrl(assetId, 256);

  if (!signedUrl) {
    return (
      <Box sx={{ width: '100%', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={signedUrl}
      alt="Logo"
      sx={{
        width: '100%',
        maxHeight: 100,
        objectFit: 'contain',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    />
  );
}

/* Sub-component: 40x40 thumbnail for Autocomplete rows */
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

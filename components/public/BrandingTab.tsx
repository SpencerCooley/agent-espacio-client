'use client';

import React, { useState, useRef, useCallback } from 'react';
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
import { usePublicAppearance } from '../../context/PublicAppearanceContext';
import { useSignedAssetUrl } from '../../hooks/useSignedAssetUrl';

const ROOT_FOLDER_ID = '00000000-0000-0000-0000-000000000001';

export default function BrandingTab() {
  const { branding, updateBranding, brandingLoading } = usePublicAppearance();

  const [imageAssets, setImageAssets] = useState<Asset[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState<Record<string, boolean>>({});
  const dragCounterRef = useRef<Record<string, number>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load image assets for pickers
  React.useEffect(() => {
    setLoadingImages(true);
    assetService.listAssets(undefined, 'image/')
      .then((res) => setImageAssets(res.assets || []))
      .catch((err) => console.error('Failed to load image assets', err))
      .finally(() => setLoadingImages(false));
  }, []);

  const handleSave = useCallback(async (updates: Record<string, any>) => {
    setSaveError(null);
    try {
      await updateBranding(updates);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save branding');
    }
  }, [updateBranding]);

  // --- Generic drag-and-drop handlers ---
  const handleDragEnter = useCallback((key: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current[key] = (dragCounterRef.current[key] || 0) + 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragOver((prev) => ({ ...prev, [key]: true }));
    }
  }, []);

  const handleDragLeave = useCallback((key: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current[key] = (dragCounterRef.current[key] || 0) - 1;
    if (dragCounterRef.current[key] === 0) {
      setDragOver((prev) => ({ ...prev, [key]: false }));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((key: string, field: string) => async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current[key] = 0;
    setDragOver((prev) => ({ ...prev, [key]: false }));

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = (Array.from(files) as File[]).find((f) => f.type.startsWith('image/'));
    if (!file) return;

    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      const result = await assetService.uploadAsset(file, ROOT_FOLDER_ID);
      const uploadedAsset = result.asset || result;
      if (uploadedAsset?.id) {
        setImageAssets((prev) => [uploadedAsset, ...prev]);
        await handleSave({ [field]: uploadedAsset.id });
      }
    } catch (err: any) {
      console.error(`Failed to upload ${key}`, err);
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  }, [handleSave]);

  // --- Generic asset picker ---
  const AssetPicker = ({ field, label }: { field: string; label: string }) => {
    const key = field;
    const assetId = (branding as any)[field] as string | null;
    const isUploading = uploading[key] || false;
    const isDragOver = dragOver[key] || false;

    return assetId ? (
      <Paper variant="outlined" sx={{ p: 1, mb: 2, position: 'relative' }}>
        <IconButton
          size="small"
          onClick={() => handleSave({ [field]: null })}
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
    ) : (
      <Paper
        variant="outlined"
        sx={{
          p: 1,
          mb: 2,
          borderStyle: isDragOver ? 'dashed' : 'solid',
          borderColor: isDragOver ? 'primary.main' : 'divider',
          bgcolor: isDragOver ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease',
        }}
        onDragEnter={handleDragEnter(key)}
        onDragLeave={handleDragLeave(key)}
        onDragOver={handleDragOver}
        onDrop={handleDrop(key, field)}
      >
        {isUploading ? (
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
              options={imageAssets}
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
              value={imageAssets.find((a) => a.id === assetId) || null}
              onChange={(_, value) => handleSave({ [field]: value ? (value as Asset).id : null })}
              loading={loadingImages}
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
  };

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
      <AssetPicker field="logo_light_asset_id" label="Select light logo" />

      {/* Dark Logo */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <DarkModeIcon fontSize="small" />
        Dark Mode Logo
      </Typography>
      <AssetPicker field="logo_dark_asset_id" label="Select dark logo" />

      <Divider sx={{ my: 2 }} />

      {/* Background */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BackgroundIcon fontSize="small" />
        Background
      </Typography>
      <AssetPicker field="background_asset_id" label="Select background image" />

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

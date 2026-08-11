/**
 * Profile Editor Component.
 *
 * Allows users to edit their profile: display name, bio, and avatar with drag-and-drop.
 */
"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Avatar,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import { CloudUpload as UploadIcon } from "@mui/icons-material";
import { Profile, getAvatarUrl } from "@/services/profiles";

interface ProfileEditorProps {
  profile: Profile;
  onProfileUpdate: (data: { display_name?: string; bio?: string }) => void;
  onAvatarUpload: (file: File) => void;
  isSaving?: boolean;
  isUploading?: boolean;
}

export default function ProfileEditor({
  profile,
  onProfileUpdate,
  onAvatarUpload,
  isSaving = false,
  isUploading = false,
}: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleSave = () => {
    setError(null);
    onProfileUpdate({
      display_name: displayName || undefined,
      bio: bio || undefined,
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const validateAndUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    setError(null);
    onAvatarUpload(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
    event.target.value = ""; // Reset input
  };

  // Drag and drop handlers
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (file) {
      validateAndUpload(file);
    } else {
      setError("Please drop an image file");
    }
  }, [onAvatarUpload]);

  const hasChanges =
    displayName !== (profile.display_name || "") || bio !== (profile.bio || "");

  return (
    <Box sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Avatar Upload with Drag-and-Drop */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Avatar
          </Typography>
          
          <Paper
            variant="outlined"
            onClick={!isUploading ? handleAvatarClick : undefined}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              cursor: isUploading ? "default" : "pointer",
              borderStyle: isDragOver ? "dashed" : "solid",
              borderColor: isDragOver ? "primary.main" : "divider",
              bgcolor: isDragOver ? "action.hover" : "background.paper",
              transition: "all 0.2s ease",
              opacity: isUploading ? 0.6 : 1,
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={getAvatarUrl(profile.avatar_url) || undefined}
                alt={profile.display_name || "User"}
                sx={{
                  width: 80,
                  height: 80,
                }}
              />
              {isUploading && (
                <CircularProgress
                  size={40}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginTop: "-20px",
                    marginLeft: "-20px",
                  }}
                />
              )}
            </Box>

            <Box sx={{ flexGrow: 1 }}>
              {isDragOver ? (
                <Typography variant="body2" color="primary">
                  Drop image here
                </Typography>
              ) : isUploading ? (
                <Typography variant="body2" color="text.secondary">
                  Uploading...
                </Typography>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Click or drop an image
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    JPG, PNG, GIF, WebP supported
                  </Typography>
                </>
              )}
            </Box>

            <UploadIcon color="action" />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </Paper>
        </Box>

        {/* Display Name */}
        <TextField
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How you want to be known"
          fullWidth
          size="small"
          inputProps={{ maxLength: 100 }}
          helperText={`${displayName.length}/100`}
        />

        {/* Bio */}
        <TextField
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short description about yourself"
          fullWidth
          size="small"
          multiline
          rows={2}
          inputProps={{ maxLength: 500 }}
          helperText={`${bio.length}/500`}
        />

        {/* Save Button */}
        <Box>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            size="small"
            startIcon={isSaving ? <CircularProgress size={16} /> : null}
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

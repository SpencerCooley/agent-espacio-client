/**
 * Author Selector Component.
 *
 * Allows selecting an author for a composer artifact using searchable autocomplete.
 */
"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Autocomplete,
  Avatar,
  Typography,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Clear as ClearIcon } from "@mui/icons-material";
import { apiClient } from "@/services/api";
import { getAvatarUrl } from "@/services/profiles";

interface ProfileSearchResult {
  user_id: number;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface AuthorSelectorProps {
  authorId: string | null;
  onAuthorChange: (authorId: string | null) => void;
}

export default function AuthorSelector({ authorId, onAuthorChange }: AuthorSelectorProps) {
  const [selectedAuthor, setSelectedAuthor] = useState<ProfileSearchResult | null>(null);
  const [options, setOptions] = useState<ProfileSearchResult[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load current author when authorId changes
  useEffect(() => {
    if (!authorId) {
      setSelectedAuthor(null);
      return;
    }

    const userId = parseInt(authorId, 10);
    if (isNaN(userId)) return;

    let cancelled = false;
    apiClient.get<ProfileSearchResult>(`/profiles/${userId}`)
      .then((profile) => {
        if (!cancelled) {
          setSelectedAuthor({
            user_id: profile.user_id,
            display_name: profile.display_name,
            email: "",
            avatar_url: profile.avatar_url,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setSelectedAuthor(null);
      });

    return () => { cancelled = true; };
  }, [authorId]);

  // Search profiles when input changes
  useEffect(() => {
    if (inputValue.length < 2) {
      setOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await apiClient.get<ProfileSearchResult[]>(
          `/profiles/search?q=${encodeURIComponent(inputValue)}`
        );
        setOptions(results);
      } catch {
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSelect = (value: ProfileSearchResult | null) => {
    setSelectedAuthor(value);
    onAuthorChange(value ? String(value.user_id) : null);
  };

  const handleClear = () => {
    setSelectedAuthor(null);
    onAuthorChange(null);
    setInputValue("");
  };

  // If author is selected, show as chip
  if (selectedAuthor) {
    return (
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            avatar={
              selectedAuthor.avatar_url ? (
                <Avatar src={getAvatarUrl(selectedAuthor.avatar_url) || undefined} alt={selectedAuthor.display_name || ""} />
              ) : (
                <Avatar>{(selectedAuthor.display_name || "?").charAt(0).toUpperCase()}</Avatar>
              )
            }
            label={selectedAuthor.display_name || selectedAuthor.email || `User ${selectedAuthor.user_id}`}
            onDelete={handleClear}
            deleteIcon={<ClearIcon />}
          />
        </Box>
      </Box>
    );
  }

  // Show search input
  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option) => option.display_name || option.email || `User ${option.user_id}`}
      inputValue={inputValue}
      onInputChange={(_, value) => setInputValue(value)}
      onChange={(_, value) => handleSelect(value)}
      loading={isLoading}
      filterOptions={(x) => x} // Don't filter, server does it
      noOptionsText={inputValue.length < 2 ? "Type to search..." : "No users found"}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder="Search by name or email..."
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.user_id}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
            {option.avatar_url ? (
              <Avatar src={getAvatarUrl(option.avatar_url) || undefined} sx={{ width: 32, height: 32 }} />
            ) : (
              <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                {(option.display_name || option.email || "?").charAt(0).toUpperCase()}
              </Avatar>
            )}
            <Box>
              <Typography variant="body2">
                {option.display_name || option.email}
              </Typography>
              {option.display_name && (
                <Typography variant="caption" color="text.secondary">
                  {option.email}
                </Typography>
              )}
            </Box>
          </Box>
        </li>
      )}
    />
  );
}

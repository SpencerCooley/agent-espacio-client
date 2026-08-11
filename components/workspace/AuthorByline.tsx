/**
 * Author Byline Component.
 *
 * Displays author information in composer views with prominent styling.
 */
"use client";

import React from "react";
import { Box, Avatar, Typography, Link } from "@mui/material";
import { format, parseISO } from "date-fns";
import { getAvatarUrl } from "@/services/profiles";

export interface Author {
  user_id: number;
  display_name: string | null;
  avatar_url: string | null;
}

interface AuthorBylineProps {
  author: Author | null;
  publishedAt: string | null;
}

export default function AuthorByline({ author, publishedAt }: AuthorBylineProps) {
  if (!author && !publishedAt) {
    return null;
  }

  const formattedDate = publishedAt
    ? format(parseISO(publishedAt), "MMMM d, yyyy")
    : null;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
      {author?.avatar_url && (
        <Avatar
          src={getAvatarUrl(author.avatar_url) || undefined}
          alt={author.display_name || "Author"}
          sx={{ width: 44, height: 44 }}
        />
      )}
      {!author?.avatar_url && author?.display_name && (
        <Avatar sx={{ width: 44, height: 44, fontSize: 18 }}>
          {author.display_name.charAt(0).toUpperCase()}
        </Avatar>
      )}

      <Box>
        {author?.display_name && (
          <Link
            href={`/public/profile/${author.user_id}`}
            underline="hover"
            color="text.primary"
            sx={{ fontWeight: 600, fontSize: "1rem" }}
          >
            {author.display_name}
          </Link>
        )}
        {formattedDate && (
          <Typography variant="body2" color="text.secondary">
            Published {formattedDate}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
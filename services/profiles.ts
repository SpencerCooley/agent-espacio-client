/**
 * Profile API service.
 *
 * Handles profile fetching, updates, and avatar upload.
 */
import { apiClient, API_BASE_URL, getToken } from "./api";

export interface Profile {
  id: number;
  user_id: number;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  avatar_asset_id: string | null;
}

export interface PublicProfile {
  user_id: number;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ProfileUpdateData {
  display_name?: string;
  bio?: string;
}

/**
 * Get current user's profile (creates empty one if missing).
 */
export async function getMyProfile(): Promise<Profile> {
  return apiClient.get<Profile>("/profiles/me");
}

/**
 * Update current user's profile.
 */
export async function updateMyProfile(data: ProfileUpdateData): Promise<Profile> {
  return apiClient.put<Profile>("/profiles/me", data);
}

/**
 * Upload avatar for current user.
 */
export async function uploadAvatar(file: File): Promise<Profile> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profiles/me/avatar`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(error.detail || `Upload failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get a user's public profile (for author display).
 */
export async function getPublicProfile(userId: number): Promise<PublicProfile> {
  return apiClient.get<PublicProfile>(`/profiles/${userId}`);
}

/**
 * Get full avatar URL from relative path.
 */
export function getAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath) return null;
  return `${API_BASE_URL}${avatarPath}`;
}

import { apiClient, API_BASE_URL, getToken, ApiError } from './api';

export interface Asset {
  id: string;
  name: string;
  storage_filename: string;
  mime_type: string;
  size_bytes: number;
  human_readable_size: string;
  folder_id: string | null;
  is_image: boolean;
  is_markdown: boolean;
  file_extension: string;
  descendant_of: string | null;
  created_at: string;
  updated_at: string;
  created_by_id: number | null;
}

export const assetService = {
  getAsset: (assetId: string) =>
    apiClient.get<Asset>(`/assets/${assetId}`),

  listAssets: (folderId?: string, mimeType?: string) => {
    const params = new URLSearchParams();
    if (folderId) params.append('folder_id', folderId);
    if (mimeType) params.append('mime_type', mimeType);
    const query = params.toString();
    return apiClient.get<{ assets: Asset[]; total: number }>(`/assets${query ? `?${query}` : ''}`);
  },

  deleteAsset: (assetId: string) =>
    apiClient.delete<{ deleted_asset_id: string; deleted_file: boolean }>(`/assets/${assetId}`),

  moveAsset: (assetId: string, folderId: string) =>
    apiClient.put<Asset>(`/assets/${assetId}`, { folder_id: folderId }),

  uploadAsset: async (file: File, folderId?: string) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folder_id', folderId);
    }

    const response = await fetch(`${API_BASE_URL}/assets/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) errorMessage = errorData.detail;
      } catch {
        // Ignore JSON parse errors
      }
      throw new ApiError(errorMessage, response.status);
    }

    return response.json();
  },
};

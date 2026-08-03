import { apiClient, API_BASE_URL, getToken, ApiError } from './api';

export { API_BASE_URL };

export interface FileMeta {
  width?: number;
  height?: number;
  has_alpha?: boolean;
  thumbnails?: Record<string, { w: number; h: number; size_bytes: number }>;
  preview?: string;
}

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
  file_meta: FileMeta | null;
  is_public: boolean;
  public_magic_id: string | null;
  descendant_of: string | null;
  created_at: string;
  updated_at: string;
  created_by_id: number | null;
}

export const DOWNLOAD_BASE_URL = `${API_BASE_URL}/assets`;

/**
 * Get the download URL for an asset.
 * @param assetId - Asset UUID
 * @param size - Optional thumbnail size (256, 512, etc.)
 */
export function getAssetDownloadUrl(assetId: string, size?: number): string {
  const params = size ? `?size=${size}` : '';
  return `${DOWNLOAD_BASE_URL}/${assetId}/download${params}`;
}

/**
 * Fetch a time-bound signed URL for downloading a private asset.
 * @param assetId - Asset UUID
 * @param size - Optional thumbnail size
 */
export async function getAssetSignedUrl(assetId: string, size?: number): Promise<string> {
  const url = size
    ? `/assets/${assetId}/signed-url?size=${size}`
    : `/assets/${assetId}/signed-url`;
  const response = await apiClient.post<{ signed_url: string }>(url);
  return response.signed_url;
}

export const assetService = {
  getAsset: (assetId: string) =>
    apiClient.get<Asset>(`/assets/${assetId}`),

  getContent: (assetId: string) =>
    apiClient.getText(`/assets/${assetId}/content`),

  updateContent: (assetId: string, content: string) =>
    apiClient.put<Asset>(`/assets/${assetId}`, { content }),

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

  shareAsset: (assetId: string) =>
    apiClient.post<Asset>(`/assets/${assetId}/share`),

  uploadAsset: (file: File, folderId?: string, onProgress?: (percent: number) => void) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folder_id', folderId);
    }

    // XMLHttpRequest is used instead of fetch because it exposes
    // upload progress events (xhr.upload.onprogress).
    return new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/assets/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        let data: any = null;
        try {
          data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch {
          // Ignore JSON parse errors
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          const errorMessage = data?.detail || `HTTP ${xhr.status}`;
          reject(new ApiError(errorMessage, xhr.status));
        }
      };

      xhr.onerror = () => {
        reject(new ApiError('Network error during upload', 0));
      };

      xhr.send(formData);
    });
  },
};

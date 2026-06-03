import { apiClient } from './api';

export interface FileMeta {
  width?: number;
  height?: number;
  has_alpha?: boolean;
  thumbnails?: Record<string, { w: number; h: number; size_bytes: number }>;
}

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  is_root: boolean;
  depth: number;
  created_at: string;
  updated_at: string;
  created_by_id: number | null;
}

export interface FolderItem {
  kind: 'folder' | 'asset' | 'artifact';
  id: string;
  name: string;
  type?: string;
  mime_type?: string;
  size_bytes?: number;
  is_image?: boolean;
  file_meta?: FileMeta | null;
  created_at: string;
  updated_at: string;
}

export interface FolderContentsResponse {
  folder: Folder;
  items: FolderItem[];
  total_items: number;
}

export const folderService = {
  getFolder: (folderId: string) =>
    apiClient.get<Folder>(`/folders/${folderId}`),

  getFolderAncestors: (folderId: string) =>
    apiClient.get<{ ancestors: Folder[] }>(`/folders/${folderId}/ancestors`),

  getFolderContents: (folderId: string) =>
    apiClient.get<FolderContentsResponse>(`/folders/${folderId}/contents`),

  listFolders: () =>
    apiClient.get<{ folders: Folder[]; total: number }>('/folders'),

  createFolder: (name: string, parentId?: string) =>
    apiClient.post<Folder>('/folders', { name, parent_id: parentId }),

  updateFolder: (folderId: string, name?: string, parentId?: string) =>
    apiClient.put<Folder>(`/folders/${folderId}`, { name, parent_id: parentId }),

  moveFolder: (folderId: string, parentId: string) =>
    apiClient.put<Folder>(`/folders/${folderId}`, { parent_id: parentId }),

  deleteFolder: (folderId: string) =>
    apiClient.delete<{ deleted_folder_id: string; deleted_subfolders_count: number; deleted_assets_count: number }>(`/folders/${folderId}`),
};

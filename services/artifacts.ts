import { apiClient } from './api';

export interface Artifact {
  id: string;
  name: string;
  type: string;
  description: string | null;
  content: Record<string, unknown>;
  folder_id: string;
  is_public: boolean;
  public_magic_id: string | null;
  created_at: string;
  updated_at: string;
  created_by_id: number | null;
}

export interface ArtifactType {
  key: string;
  name: string;
  description: string;
  ai_instructions: string;
  content_schema: Record<string, unknown>;
  example_content: Record<string, unknown>;
  icon: string;
  category: string;
}

export const artifactService = {
  getArtifact: (artifactId: string) =>
    apiClient.get<Artifact>(`/artifacts/${artifactId}`),

  listArtifacts: (folderId?: string, type?: string) => {
    const params = new URLSearchParams();
    if (folderId) params.append('folder_id', folderId);
    if (type) params.append('type', type);
    const query = params.toString();
    return apiClient.get<{ artifacts: Artifact[]; total: number }>(`/artifacts${query ? `?${query}` : ''}`);
  },

  createArtifact: (data: {
    name: string;
    type: string;
    description?: string;
    content: Record<string, unknown>;
    folder_id: string;
  }) => apiClient.post<Artifact>('/artifacts', data),

  updateArtifact: (artifactId: string, data: Partial<{
    name: string;
    type: string;
    description: string;
    content: Record<string, unknown>;
    folder_id: string;
  }>) => apiClient.put<Artifact>(`/artifacts/${artifactId}`, data),

  moveArtifact: (artifactId: string, folderId: string) =>
    apiClient.put<Artifact>(`/artifacts/${artifactId}`, { folder_id: folderId }),

  deleteArtifact: (artifactId: string) =>
    apiClient.delete<{ deleted_artifact_id: string }>(`/artifacts/${artifactId}`),

  getArtifactDocs: () =>
    apiClient.get<{ types: ArtifactType[]; total: number }>('/artifacts/docs'),

  getArtifactTypeDocs: (typeKey: string) =>
    apiClient.get<ArtifactType>(`/artifacts/docs/${typeKey}`),

  shareArtifact: (artifactId: string) =>
    apiClient.post<Artifact>(`/artifacts/${artifactId}/share`),
};

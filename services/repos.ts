import { apiClient } from './api';

export interface RepoMetadata {
  name: string;
  description: string | null;
  artifact_id: string;
  git_remote_url: string;
  clone_url: string;
  default_branch: string;
  last_commit: {
    hash: string;
    message: string;
    author: string;
    date: string;
  } | null;
  commit_count: number;
  file_count: number;
  repo_size_bytes: number;
  publish: PublishConfig | null;
}

export interface PublishConfig {
  enabled: boolean;
  slug: string;
  render_mode: 'embedded' | 'direct' | 'repo_link';
  build_command: string;
  output_dir: string;
  auto_deploy: boolean;
  allow_public_code_view: boolean;
  status: 'idle' | 'building' | 'deployed' | 'failed';
  last_deploy_at: string | null;
  last_deploy_commit: string | null;
}

export interface PublishSettings {
  enabled: boolean;
  slug: string;
  render_mode: string;
  build_command: string;
  output_dir: string;
  auto_deploy: boolean;
  allow_public_code_view: boolean;
  status: string;
  last_deploy_at: string | null;
  last_deploy_commit: string | null;
  site_url: string;
}

export interface DeployHistoryEntry {
  status: string;
  commit: string;
  started_at: string | null;
  finished_at: string | null;
  log: string;
  ref?: string;
}

export interface DeployStatus {
  status: string;
  last_deploy_at: string | null;
  last_deploy_commit: string | null;
  last_deploy_log: string | null;
  deploy_history: DeployHistoryEntry[];
}

export interface RepoTreeItem {
  name: string;
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

export interface RepoTree {
  ref: string;
  items: RepoTreeItem[];
}

export interface RepoCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface RepoCommits {
  commits: RepoCommit[];
}

export interface RepoDiffFile {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string | null;
}

export interface RepoCommitDetail {
  hash: string;
  short_hash: string;
  message: string;
  author: string;
  date: string;
  parent_hash: string | null;
  files: RepoDiffFile[];
  total_additions: number;
  total_deletions: number;
}

export interface RepoFile {
  path: string;
  ref: string;
  content: string;
  size: number;
  is_binary: boolean;
}

export interface SshKey {
  id: number;
  name: string;
  fingerprint: string;
  created_at: string;
}

export const repoService = {
  getMetadata: (artifactId: string) =>
    apiClient.get<RepoMetadata>(`/artifacts/${artifactId}/repo`),

  getTree: (artifactId: string, ref?: string, path?: string) => {
    const params = new URLSearchParams();
    if (ref) params.append('ref', ref);
    if (path) params.append('path', path);
    const query = params.toString();
    return apiClient.get<RepoTree>(`/artifacts/${artifactId}/repo/tree${query ? `?${query}` : ''}`);
  },

  getFile: (artifactId: string, filePath: string, ref?: string) => {
    const params = new URLSearchParams();
    if (ref) params.append('ref', ref);
    const query = params.toString();
    const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/');
    return apiClient.get<RepoFile>(`/artifacts/${artifactId}/repo/files/${encodedPath}${query ? `?${query}` : ''}`);
  },

  /** Absolute URL for raw file bytes (images). Requires auth headers or useAuthBlob. */
  getRawFileUrl: (artifactId: string, filePath: string, ref?: string) => {
    const params = new URLSearchParams();
    if (ref) params.append('ref', ref);
    const query = params.toString();
    const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/');
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return `${base}/artifacts/${artifactId}/repo/raw/${encodedPath}${query ? `?${query}` : ''}`;
  },


  getCommits: (artifactId: string, ref?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (ref) params.append('ref', ref);
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return apiClient.get<RepoCommits>(`/artifacts/${artifactId}/repo/commits${query ? `?${query}` : ''}`);
  },

  getCommitDetail: (artifactId: string, commitHash: string) =>
    apiClient.get<RepoCommitDetail>(`/artifacts/${artifactId}/repo/commits/${commitHash}`),

  // SSH key management
  listSshKeys: () =>
    apiClient.get<{ keys: SshKey[]; total: number }>('/ssh-keys'),

  addSshKey: (data: { name: string; public_key: string }) =>
    apiClient.post<SshKey>('/ssh-keys', data),

  deleteSshKey: (keyId: number) =>
    apiClient.delete(`/ssh-keys/${keyId}`),

  // Publish / Deploy
  getPublishSettings: (artifactId: string) =>
    apiClient.get<PublishSettings>(`/artifacts/${artifactId}/publish`),

  updatePublishSettings: (artifactId: string, data: Partial<{
    enabled: boolean;
    slug: string;
    render_mode: string;
    build_command: string;
    output_dir: string;
    auto_deploy: boolean;
  }>) => apiClient.put<PublishSettings>(`/artifacts/${artifactId}/publish`, data),

  unpublish: (artifactId: string) =>
    apiClient.delete(`/artifacts/${artifactId}/publish`),

  triggerDeploy: (artifactId: string) =>
    apiClient.post<{ task_id: string; status: string }>(`/artifacts/${artifactId}/deploy`),

  getDeployStatus: (artifactId: string) =>
    apiClient.get<DeployStatus>(`/artifacts/${artifactId}/deploy/status`),
};

const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif',
]);

/** True if path looks like a viewable image file. */
export function isImageFile(path: string): boolean {
  const base = path.split('/').pop() || path;
  const dot = base.lastIndexOf('.');
  if (dot < 0) return false;
  return IMAGE_EXTENSIONS.has(base.slice(dot + 1).toLowerCase());
}

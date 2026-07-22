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
};

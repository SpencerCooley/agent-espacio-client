export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not defined');
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Type definitions
export interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
  is_confirmed: boolean;
}

export interface AuthToken {
  token: string;
  expires_at: string;
  user: User;
}

export interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

// Helper to get token from localStorage
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

// Generic request function
async function request<T>(method: string, path: string, data?: unknown): Promise<T> {
  const token = getToken();
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
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

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Generic API client
export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, data?: unknown) => request<T>('POST', path, data),
  put: <T>(path: string, data?: unknown) => request<T>('PUT', path, data),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

// Service objects
export const authService = {
  login: (email: string, password: string) => 
    apiClient.post<AuthToken>('/auth/login', { email, password }),
  
  logout: () => apiClient.post('/auth/logout', {}),
  
  validateToken: () => 
    apiClient.get<{ valid: boolean; user: User }>('/auth/validate'),
  
  getCurrentUser: () => apiClient.get<User>('/users/me'),
};

export const userService = {
  listUsers: () => 
    apiClient.get<{ users: User[]; total: number }>('/users'),
  
  createUser: (email: string, password: string, role: string) => 
    apiClient.post<User>('/users', { email, password, role }),
  
  resetPassword: (userId: number, newPassword: string) => 
    apiClient.post(`/users/${userId}/reset-password`, { new_password: newPassword }),
  
  deleteUser: (userId: number) => 
    apiClient.delete(`/users/${userId}`),
};

export const apiKeyService = {
  listApiKeys: () => 
    apiClient.get<{ keys: (ApiKey & { key?: string })[]; total: number }>('/api-keys'),
  
  createApiKey: (name: string) => 
    apiClient.post<ApiKey & { key: string }>('/api-keys', { name }),
  
  revokeApiKey: (id: number) => 
    apiClient.delete(`/api-keys/${id}`),
  
  activateApiKey: (id: number) => 
    apiClient.post<ApiKey>(`/api-keys/${id}/activate`, {}),
};

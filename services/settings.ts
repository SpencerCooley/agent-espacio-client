import { apiClient, ApiError } from './api';

export interface PublicTheme {
  name: string;
  mode: 'light' | 'dark';
}

export interface SettingsResponse {
  settings: Record<string, any>;
}

export const settingsService = {
  getSettings: () =>
    apiClient.get<SettingsResponse>('/settings'),

  getPublicTheme: () =>
    apiClient.get<PublicTheme>('/settings/public-theme'),

  updatePublicTheme: (name: string, mode: 'light' | 'dark') =>
    apiClient.put<{ public_theme: PublicTheme }>('/settings/public-theme', { name, mode }),
};

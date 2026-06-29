import { apiClient, ApiError } from './api';

export interface PublicTheme {
  theme_id: string;
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

  updatePublicTheme: (theme_id: string, mode: 'light' | 'dark') =>
    apiClient.put<{ public_theme: PublicTheme }>('/settings/public-theme', { theme_id, mode }),
};

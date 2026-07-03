import { apiClient, ApiError } from './api';

export interface PublicTheme {
  theme_id: string;
  mode: 'light' | 'dark';
}

export interface Branding {
  logo_light_asset_id: string | null;
  logo_dark_asset_id: string | null;
  background_asset_id: string | null;
  background_style: 'cover' | 'tile';
  logo_light_url: string | null;
  logo_dark_url: string | null;
  background_url: string | null;
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

  getBranding: () =>
    apiClient.get<Branding>('/settings/branding'),

  updateBranding: (branding: Partial<Branding>) =>
    apiClient.put<{ branding: Branding }>('/settings/branding', branding),
};

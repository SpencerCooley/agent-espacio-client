import { apiClient } from './api';

export interface ThemeListItem {
  id: string;
  name: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  light_definition: Record<string, any>;
  dark_definition: Record<string, any>;
}

export const themeService = {
  getThemes: () =>
    apiClient.get<{ themes: ThemeListItem[] }>('/themes'),

  getTheme: (id: string) =>
    apiClient.get<ThemeDefinition>(`/themes/${id}`),

  updateTheme: (id: string, data: { name?: string; light_definition?: Record<string, any>; dark_definition?: Record<string, any> }) =>
    apiClient.put<ThemeDefinition>(`/themes/${id}`, data),
};

import { apiClient } from './api';

export interface FeedItem {
  id: string;
  artifact_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const feedService = {
  /** Check if an artifact is in the curated feed. Returns the feed item or throws 404. */
  getFeedItemStatus: (artifactId: string) =>
    apiClient.get<FeedItem>(`/feed/items/${artifactId}`),

  /** Add an artifact to the curated feed. */
  addToFeed: (artifactId: string) =>
    apiClient.post<FeedItem>(`/feed/items?artifact_id=${artifactId}`),

  /** Remove an artifact from the curated feed. */
  removeFromFeed: (artifactId: string) =>
    apiClient.delete<{ removed: boolean }>(`/feed/items/${artifactId}`),

  /** Update sort order of a feed item. */
  reorderFeedItem: (artifactId: string, sortOrder: number) =>
    apiClient.put<FeedItem>(`/feed/items/${artifactId}/order?sort_order=${sortOrder}`),
};

'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import PublicFeed from '../../components/public/PublicFeed';

export default function TagFeedPage() {
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag') || undefined;

  return (
    <PublicFeed
      tag={tag}
      title={tag ? `${tag}` : 'Feed'}
    />
  );
}

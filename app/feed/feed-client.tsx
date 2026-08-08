'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PublicFeed from '../../components/public/PublicFeed';

function FeedInner() {
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag') || undefined;

  return (
    <PublicFeed
      tag={tag}
      title={tag ? `${tag}` : 'Feed'}
    />
  );
}

// useSearchParams() requires a Suspense boundary so the page shell can be
// statically generated; the param-dependent content renders on the client.
export default function FeedClient() {
  return (
    <Suspense fallback={null}>
      <FeedInner />
    </Suspense>
  );
}

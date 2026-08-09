'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PublicFeed from '../../components/public/PublicFeed';
import type { FeedItem } from '../../lib/server/api';

interface FeedClientProps {
  initialItems?: FeedItem[];
  tag?: string;
}

function FeedInner({ initialItems, tag: serverTag }: FeedClientProps) {
  const searchParams = useSearchParams();
  const clientTag = searchParams.get('tag') || undefined;
  // Prefer client tag if the user navigated client-side; otherwise use the
  // server-provided tag from the initial SSR context.
  const tag = clientTag || serverTag;

  return (
    <PublicFeed
      tag={tag}
      title={tag ? `${tag}` : 'Feed'}
      initialItems={initialItems}
    />
  );
}

// useSearchParams() requires a Suspense boundary so the page shell can be
// statically generated; the param-dependent content renders on the client.
export default function FeedClient({ initialItems, tag }: FeedClientProps) {
  return (
    <Suspense fallback={null}>
      <FeedInner initialItems={initialItems} tag={tag} />
    </Suspense>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

/**
 * Root workspace page - redirects to the root folder (My Drive).
 *
 * The root folder ID is deterministic: 00000000-0000-0000-0000-000000000001
 */
export default function WorkspaceIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/workspace/folders/00000000-0000-0000-0000-000000000001');
  }, [router]);

  return (
    <ProtectedRoute>
      <div />
    </ProtectedRoute>
  );
}

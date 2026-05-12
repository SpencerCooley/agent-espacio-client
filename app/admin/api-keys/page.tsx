'use client';

import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import AdminLayout from '../../../components/layout/AdminLayout';
import ApiKeyManagement from '../../../components/admin/ApiKeyManagement';

export default function ApiKeysPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <ApiKeyManagement />
      </AdminLayout>
    </ProtectedRoute>
  );
}

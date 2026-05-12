'use client';

import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import AdminLayout from '../../../components/layout/AdminLayout';
import UserManagement from '../../../components/admin/UserManagement';

export default function UsersPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <UserManagement />
      </AdminLayout>
    </ProtectedRoute>
  );
}

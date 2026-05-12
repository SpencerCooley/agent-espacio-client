'use client';

import ProtectedRoute from '../../components/auth/ProtectedRoute';
import AdminLayout from '../../components/layout/AdminLayout';
import BlankCanvas from '../../components/admin/BlankCanvas';

export default function AdminDashboard() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <BlankCanvas />
      </AdminLayout>
    </ProtectedRoute>
  );
}

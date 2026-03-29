"use client";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <main className="ml-60 min-h-screen p-6 transition-all duration-200">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}

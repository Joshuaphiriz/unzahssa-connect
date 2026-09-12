import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../lib/auth";

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
  /** Restricts this route to admins whose assigned position includes this page key. */
  page?: string;
}

export function ProtectedRoute({ children, adminOnly = false, page }: Props) {
  const { user, isAdmin, hasAdminPage, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  if (adminOnly && page && !hasAdminPage(page)) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
}

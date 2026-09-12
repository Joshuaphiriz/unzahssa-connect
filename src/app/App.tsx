import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./lib/auth";

// Layouts
import { StudentLayout } from "./components/layouts/StudentLayout";
import { AdminLayout } from "./components/layouts/AdminLayout";

// Shared
import { ProtectedRoute } from "./components/shared/ProtectedRoute";
import { BrandingProvider } from "./components/shared/BrandingContext";
import { AiAssistantProvider } from "./components/shared/AiAssistant";

// Auth pages
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/auth/ResetPasswordPage";

// Student pages
import { Dashboard } from "./components/student/Dashboard";
import { Forum } from "./components/student/Forum";
import { Affiliations } from "./components/student/Affiliations";
import { AcademicQueryPage } from "./components/student/AcademicQueryPage";
import { InternshipLanding } from "./components/student/InternshipLanding";
import { InternshipPortal } from "./components/student/InternshipPortal";
import { Profile } from "./components/student/Profile";

// Admin pages
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { StudentRegistry } from "./components/admin/StudentRegistry";
import { InternshipReviews } from "./components/admin/InternshipReviews";
import { Analytics } from "./components/admin/Analytics";
import { AuditLogPage } from "./components/admin/AuditLogPage";
import { Payments } from "./components/admin/Payments";
import { AcademicQueries } from "./components/admin/AcademicQueries";
import { Programmes } from "./components/admin/Programmes";
import { SystemBranding } from "./components/admin/SystemBranding";
import { AdminUsers } from "./components/admin/AdminUsers";

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function AppRoutes() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={user ? <Navigate to={isAdmin ? "/admin/dashboard" : "/"} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Student routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <StudentLayout><Dashboard /></StudentLayout>
        </ProtectedRoute>
      } />
      <Route path="/forum" element={
        <ProtectedRoute>
          <StudentLayout><Forum /></StudentLayout>
        </ProtectedRoute>
      } />
      <Route path="/affiliations" element={
        <ProtectedRoute>
          <StudentLayout><Affiliations /></StudentLayout>
        </ProtectedRoute>
      } />
      <Route path="/academic-query" element={
        <ProtectedRoute>
          <StudentLayout><AcademicQueryPage /></StudentLayout>
        </ProtectedRoute>
      } />
      <Route path="/internship" element={
        <ProtectedRoute>
          <StudentLayout><InternshipLanding /></StudentLayout>
        </ProtectedRoute>
      } />
      <Route path="/internship/portal" element={
        <ProtectedRoute>
          <StudentLayout><InternshipPortal /></StudentLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <StudentLayout><Profile /></StudentLayout>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute adminOnly page="dashboard">
          <AdminLayout><AdminDashboard /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/registry" element={
        <ProtectedRoute adminOnly page="registry">
          <AdminLayout><StudentRegistry /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/reviews" element={
        <ProtectedRoute adminOnly page="reviews">
          <AdminLayout><InternshipReviews /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/analytics" element={
        <ProtectedRoute adminOnly page="analytics">
          <AdminLayout><Analytics /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/payments" element={
        <ProtectedRoute adminOnly page="payments">
          <AdminLayout><Payments /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/academic-queries" element={
        <ProtectedRoute adminOnly page="academic_queries">
          <AdminLayout><AcademicQueries /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/programmes" element={
        <ProtectedRoute adminOnly page="programmes">
          <AdminLayout><Programmes /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/branding" element={
        <ProtectedRoute adminOnly page="branding">
          <AdminLayout><SystemBranding /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute adminOnly page="users">
          <AdminLayout><AdminUsers /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/audit-log" element={
        <ProtectedRoute adminOnly page="audit_log">
          <AdminLayout><AuditLogPage /></AdminLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* MARKER-MAKE-KIT-INVOKED */}
      <AuthProvider>
        <BrandingProvider>
          <AiAssistantProvider>
            <AppRoutes />
          </AiAssistantProvider>
        </BrandingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

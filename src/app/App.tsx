import { ProgrammesManagement } from './components/admin/ProgrammesManagement';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { AuthProvider, useAuth } from './components/shared/AuthContext';
import { BrandingProvider } from './components/shared/BrandingContext';
import { api } from './components/shared/api';

// Auth pages
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';

// Student pages
import { StudentLayout } from './components/student/StudentLayout';
import { Dashboard } from './components/student/Dashboard';
import { Forum } from './components/student/Forum';
import { Affiliations } from './components/student/Affiliations';
import { AcademicQuery } from './components/student/AcademicQuery';
import { InternshipLanding } from './components/student/InternshipLanding';
import { InternshipPortal } from './components/student/InternshipPortal';
import { Profile } from './components/student/Profile';

// Admin pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentRegistry } from './components/admin/StudentRegistry';
import { InternshipReviews } from './components/admin/InternshipReviews';
import { Analytics } from './components/admin/Analytics';
import { PaymentsManagement } from './components/admin/PaymentsManagement';
import { SystemBranding } from './components/admin/SystemBranding';
import { AuditLogs } from './components/admin/AuditLogs';
import { AcademicQueries } from './components/admin/AcademicQueries';

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: '#1E3A5F', borderTopColor: 'transparent' }} />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function SmartRedirect() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

function SeedOnMount() {
  useEffect(() => {
    api('/seed', { method: 'POST' }).catch(() => {});
  }, []);
  return null;
}

function AppRoutes() {
  return (
    <>
      <SeedOnMount />
      <Routes>
        {/* Public */}
        <Route path="/" element={<SmartRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Student routes */}
        <Route element={<RequireAuth><StudentLayout /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/affiliations" element={<Affiliations />} />
          <Route path="/academic-query" element={<AcademicQuery />} />
          <Route path="/internship" element={<InternshipLanding />} />
          <Route path="/internship/portal" element={<InternshipPortal />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Admin routes */}
        <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/programmes" element={<ProgrammesManagement />} />
          <Route path="/admin/students" element={<StudentRegistry />} />
          <Route path="/admin/internships" element={<InternshipReviews />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/payments" element={<PaymentsManagement />} />
          <Route path="/admin/branding" element={<SystemBranding />} />
          <Route path="/admin/audit" element={<AuditLogs />} />
          <Route path="/admin/academic-queries" element={<AcademicQueries />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BrandingProvider>
          <AppRoutes />
        </BrandingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
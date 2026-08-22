import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router';
import {
  LayoutDashboard, Users, Briefcase, BarChart2, CreditCard,
  Palette, FileText, LogOut, GraduationCap, ChevronLeft, Menu, MessageSquare, BookOpen
} from 'lucide-react';
import { useAuth } from '../shared/AuthContext';
import { useBranding } from '../shared/BrandingContext';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Student Registry', icon: Users },
  { to: '/admin/internships', label: 'Internship Reviews', icon: Briefcase },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/academic-queries', label: 'Academic Queries', icon: MessageSquare },
  { to: '/admin/programmes', label: 'Programmes', icon: BookOpen },
  { to: '/admin/branding', label: 'System Branding', icon: Palette },
  { to: '/admin/audit', label: 'Audit Logs', icon: FileText },
];

export function AdminLayout() {
  const { signOut, user } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : ''}`}>
      {/* Header */}
      <div className="px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className={`flex items-center gap-3 ${collapsed && !mobile ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,163,61,0.2)' }}>
            <GraduationCap size={20} style={{ color: '#D4A33D' }} />
          </div>
          {(!collapsed || mobile) && (
            <div>
              <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                {branding.shortName}
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              } ${collapsed && !mobile ? 'justify-center' : ''}`
            }>
            <Icon size={17} className="flex-shrink-0" />
            {(!collapsed || mobile) && <span className="text-sm">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + sign out */}
      <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#D4A33D', color: '#1E3A5F' }}>
              {user?.user_metadata?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.user_metadata?.name || 'Admin'}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.email}</p>
            </div>
          </div>
        )}
        <button onClick={handleSignOut}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-white/50 hover:text-white hover:bg-white/5 ${collapsed && !mobile ? 'justify-center' : ''}`}>
          <LogOut size={15} />
          {(!collapsed || mobile) && 'Sign out'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}
        style={{ background: '#1E3A5F' }}>
        <Sidebar />
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 flex items-center justify-center w-5 h-5 rounded-full text-white/60 hover:text-white transition-colors"
          style={{ top: '20px', left: collapsed ? '52px' : '228px', background: '#1E3A5F', border: '1px solid rgba(255,255,255,0.15)' }}>
          <ChevronLeft size={12} style={{ transform: collapsed ? 'rotate(180deg)' : '' }} />
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col h-full" style={{ background: '#1E3A5F' }}>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-white flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <Link to="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <GraduationCap size={13} /> Student View
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
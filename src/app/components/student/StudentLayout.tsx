import { useState } from 'react';
import { Link, NavLink, useNavigate, Outlet } from 'react-router';
import {
  GraduationCap, LayoutDashboard, MessageSquare, Link2,
  HelpCircle, Briefcase, User, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '../shared/AuthContext';
import { useBranding } from '../shared/BrandingContext';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/forum', icon: MessageSquare, label: 'Forum' },
  { to: '/affiliations', icon: Link2, label: 'Affiliations' },
  { to: '/academic-query', icon: HelpCircle, label: 'Academic Query' },
  { to: '/internship', icon: Briefcase, label: 'Internship' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function StudentLayout() {
  const { user, signOut } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            {branding.logo ? (
              <img src={branding.logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1E3A5F' }}>
                <GraduationCap size={18} className="text-white" />
              </div>
            )}
            <span className="font-bold text-sm hidden sm:block" style={{ color: '#1E3A5F', fontFamily: 'Playfair Display, serif' }}>
              {branding.shortName}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`
              }>
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
<div className="flex items-center gap-3">
  {/* Admin button (if admin) */}
  {user && (
    <Link 
      to="/admin" 
      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
    >
      ← Back to Admin
    </Link>
  )}
  
  <div className="hidden sm:flex items-center gap-2">
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#D4A33D' }}>
      {user?.user_metadata?.name?.[0]?.toUpperCase() || '?'}
    </div>
    <span className="text-sm font-medium text-foreground hidden md:block max-w-[120px] truncate">
      {user?.user_metadata?.name || user?.email}
    </span>
  </div>
  <button onClick={handleSignOut} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-red-50 transition-all hidden sm:flex">
    <LogOut size={15} />
    <span className="hidden md:inline">Sign out</span>
  </button>
  {/* Mobile hamburger */}
  <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
    {menuOpen ? <X size={20} /> : <Menu size={20} />}
  </button>
</div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-border bg-white px-4 py-3 space-y-1">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                }`
              }>
                <Icon size={16} />{label}
              </NavLink>
            ))}
            {/* Admin link for mobile */}
{user && (
  <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
    ← Back to Admin
  </Link>
)}
            <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-red-50 transition-all">
              <LogOut size={16} />Sign out
            </button>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground">
        {branding.footerText}
      </footer>
    </div>
  );
}

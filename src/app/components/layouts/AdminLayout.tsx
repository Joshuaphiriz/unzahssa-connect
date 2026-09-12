import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../lib/auth";
import {
  LayoutDashboard, Users, ClipboardList, BarChart2, ScrollText,
  GraduationCap, LogOut, Menu, X, ChevronLeft, ChevronRight,
  CreditCard, HelpCircle, BookOpen, Palette, ShieldCheck, Eye
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin/dashboard", page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/registry", page: "registry", label: "Student Registry", icon: Users },
  { to: "/admin/reviews", page: "reviews", label: "Internship Reviews", icon: ClipboardList },
  { to: "/admin/payments", page: "payments", label: "Payments", icon: CreditCard },
  { to: "/admin/academic-queries", page: "academic_queries", label: "Academic Queries", icon: HelpCircle },
  { to: "/admin/programmes", page: "programmes", label: "Programmes", icon: BookOpen },
  { to: "/admin/analytics", page: "analytics", label: "Analytics", icon: BarChart2 },
  { to: "/admin/branding", page: "branding", label: "System Branding", icon: Palette },
  { to: "/admin/users", page: "users", label: "Admin Users", icon: ShieldCheck },
  { to: "/admin/audit-log", page: "audit_log", label: "Audit Log", icon: ScrollText },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, setViewAsStudent, hasAdminPage } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = NAV_ITEMS.filter(item => hasAdminPage(item.page));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const enterStudentView = () => {
    setViewAsStudent(true);
    setMobileOpen(false);
    navigate("/");
  };

  const isActive = (to: string) => location.pathname === to;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 border-2 border-sidebar-primary flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <div className="leading-tight overflow-hidden">
              <div className="text-sidebar-foreground font-semibold truncate" style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem" }}>UNZAHSSA</div>
              <div className="text-sidebar-foreground/50 text-xs">Admin Panel</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {!collapsed && (
          <div className="px-3 py-1">
            <p className="text-sidebar-foreground text-sm font-medium truncate">{user?.name}</p>
            <p className="text-sidebar-foreground/50 text-xs truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={enterStudentView}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sidebar-primary hover:bg-sidebar-accent transition-colors text-sm"
        >
          <Eye className="w-4 h-4 shrink-0" />
          {!collapsed && <span>View as student</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-sm"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg w-full text-sidebar-foreground/40 hover:text-sidebar-foreground/70 text-sm transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-sidebar transition-all duration-200 shrink-0 ${collapsed ? "w-16" : "w-60"}`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 bg-sidebar flex flex-col h-full">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-40 bg-sidebar h-14 flex items-center px-4 gap-3">
          <button onClick={() => setMobileOpen(true)} className="text-sidebar-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sidebar-foreground font-semibold" style={{ fontFamily: "var(--font-display)" }}>UNZAHSSA Admin</span>
          <button onClick={() => setMobileOpen(false)} className="ml-auto text-sidebar-foreground/50 lg:hidden">
            {mobileOpen && <X className="w-5 h-5" />}
          </button>
        </div>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

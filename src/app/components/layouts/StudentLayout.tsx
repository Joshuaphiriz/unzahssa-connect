import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../lib/auth";
import { useBranding } from "../shared/BrandingContext";
import { Menu, X, LogOut, GraduationCap, ArrowLeft } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/forum", label: "Forum" },
  { to: "/affiliations", label: "Affiliations" },
  { to: "/academic-query", label: "Academic Query" },
  { to: "/internship", label: "Internship" },
  { to: "/profile", label: "Profile" },
];

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin, setViewAsStudent } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { branding } = useBranding();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const returnToAdmin = () => {
    setViewAsStudent(false);
    navigate("/admin/dashboard");
  };

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isAdmin && (
        <div className="bg-accent text-accent-foreground text-sm px-4 py-2 flex items-center justify-center gap-3">
          <span className="font-medium">Viewing as a student — inline admin controls are enabled.</span>
          <button onClick={returnToAdmin} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to admin
          </button>
        </div>
      )}
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-primary shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo + Title */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 border-2 border-accent flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-accent" />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-primary-foreground font-semibold tracking-wide" style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem" }}>{branding.short_name}</div>
              <div className="text-primary-foreground/60 text-xs">Student Portal</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  isActive(link.to)
                    ? "bg-white/20 text-white font-medium"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:block text-white/60 text-sm">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="p-2 rounded text-white/75 hover:text-white hover:bg-white/15 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              className="md:hidden p-2 rounded text-white/75 hover:text-white hover:bg-white/15"
              onClick={() => setMobileOpen(v => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-primary border-t border-white/10 px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  isActive(link.to)
                    ? "bg-white/20 text-white font-medium"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-muted-foreground text-sm">
        {branding.footer_text}
      </footer>
    </div>
  );
}

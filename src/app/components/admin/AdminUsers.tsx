import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { AdminUsers as Store, AdminPositions, AuditLogs } from "../../lib/data";
import type { AdminUser, AdminPosition } from "../../lib/types";
import { ShieldCheck, UserPlus, Trash2, Mail } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROTECTED_EMAIL = "phirijoshua784@gmail.com";

export function AdminUsers() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [positions, setPositions] = useState<AdminPosition[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => { void Store.list().then(setAdmins); };
  useEffect(load, []);
  useEffect(() => { void AdminPositions.list().then(setPositions); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!EMAIL_RE.test(v)) { setError("Enter a valid email address."); return; }
    if (admins.some(a => a.email.toLowerCase() === v)) { setError("That email is already an admin."); return; }
    setBusy(true); setError("");
    try {
      await Store.add(v, user?.email || "");
      if (user) await AuditLogs.create({
        user_name: user.name, user_email: user.email,
        action: "ADMIN_ADDED", details: `Granted admin access to ${v}`, page: "/admin/users",
      });
      setEmail("");
      load();
    } catch (err: any) {
      setError(err?.message || "Could not add that admin.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a: AdminUser) => {
    if (a.is_self || a.email.toLowerCase() === PROTECTED_EMAIL) return;
    if (!confirm(`Remove admin access for ${a.email}?`)) return;
    try {
      await Store.remove(a.email);
      if (user) await AuditLogs.create({
        user_name: user.name, user_email: user.email,
        action: "ADMIN_REMOVED", details: `Revoked admin access from ${a.email}`, page: "/admin/users",
      });
      load();
    } catch (err: any) {
      setError(err?.message || "Could not remove that admin.");
    }
  };

  const changePosition = async (a: AdminUser, positionId: string) => {
    if (!a.profile_id) return;
    setBusy(true);
    try {
      await Store.setPosition(a.profile_id, positionId || null);
      if (user) await AuditLogs.create({
        user_name: user.name, user_email: user.email,
        action: "ADMIN_POSITION_CHANGED",
        details: `Set ${a.email}'s position to ${positionId || "(none)"}`,
        page: "/admin/users",
      });
      load();
    } catch (err: any) {
      setError(err?.message || "Could not update that admin's position.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Admin Users</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Grant portal admin access by email. New admins take effect on their next sign-in;
          people who haven't registered yet become admins automatically when they sign up.
          Assign a position once they've registered to control which pages they can see.
        </p>
      </div>

      <form onSubmit={add} className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
            placeholder="name@example.com" type="email"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        </div>
        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
          <UserPlus className="w-4 h-4" /> Add admin
        </button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <ul className="divide-y divide-border">
          {admins.map(a => {
            const protectedAdmin = a.email.toLowerCase() === PROTECTED_EMAIL;
            const removeDisabled = a.is_self || protectedAdmin;
            return (
              <li key={a.email} className="flex items-center gap-3 px-4 py-3 flex-wrap">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-medium truncate">
                    {a.name || a.email}{a.is_self && <span className="text-muted-foreground font-normal"> (you)</span>}
                  </p>
                  <p className="text-muted-foreground text-xs truncate">{a.email}</p>
                </div>
                {!a.registered && (
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                    pending sign-up
                  </span>
                )}
                {a.registered && protectedAdmin && (
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    Full system access
                  </span>
                )}
                {a.registered && !protectedAdmin && (
                  <select
                    value={a.position_id ?? ""}
                    disabled={busy}
                    onChange={e => changePosition(a, e.target.value)}
                    className="shrink-0 px-2.5 py-1.5 rounded-md border border-border bg-input-background text-xs focus:outline-none focus:ring-2 focus:ring-ring/50">
                    <option value="">No position assigned</option>
                    {positions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                )}
                <button onClick={() => remove(a)} disabled={removeDisabled}
                  title={a.is_self ? "You can't remove your own admin access" : protectedAdmin ? "This admin cannot be removed" : "Remove admin"}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
          {admins.length === 0 && (
            <li className="px-4 py-10 text-center text-muted-foreground text-sm">No admins listed.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

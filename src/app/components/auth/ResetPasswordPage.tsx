import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../lib/auth";
import { GraduationCap, CheckCircle } from "lucide-react";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, logout } = useAuth();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const result = await updatePassword(form.password);
    setLoading(false);
    if (!result.ok) { setError(result.error!); return; }
    setDone(true);
    await logout();
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
              <GraduationCap className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-primary" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700 }}>UNZAHSSA</h1>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-8">
            {done ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-foreground mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem" }}>Password Reset!</h2>
                <p className="text-muted-foreground text-sm">Redirecting you to sign in…</p>
              </div>
            ) : (
              <>
                <h2 className="text-foreground mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600 }}>Reset Password</h2>
                <p className="text-muted-foreground text-sm mb-6">Enter your new password below.</p>
                {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">New Password</label>
                    <input type="password" required value={form.password} onChange={set("password")}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                    <input type="password" required value={form.confirm} onChange={set("confirm")}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                    {loading ? "Saving…" : "Reset Password"}
                  </button>
                </form>
                <div className="mt-5 text-center text-sm">
                  <Link to="/login" className="text-primary hover:underline">Back to Sign In</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

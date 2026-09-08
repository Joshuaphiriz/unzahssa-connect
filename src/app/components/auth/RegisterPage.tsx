import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../lib/auth";
import { GraduationCap } from "lucide-react";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
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
    const result = await register(form.name, form.email, form.password);
    setLoading(false);
    if (!result.ok) { setError(result.error!); return; }
    navigate("/");
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
            <p className="text-muted-foreground text-sm mt-1">Create your student account</p>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-8">
            <h2 className="text-foreground mb-6" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600 }}>Register</h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input type="text" required value={form.name} onChange={set("name")} placeholder="Chanda Mwale"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email Address</label>
                <input type="email" required value={form.email} onChange={set("email")} placeholder="student@unza.zm"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <input type="password" required value={form.password} onChange={set("password")} placeholder="At least 6 characters"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                <input type="password" required value={form.confirm} onChange={set("confirm")} placeholder="Repeat password"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

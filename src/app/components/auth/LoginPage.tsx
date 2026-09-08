import React, { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../lib/auth";
import { GraduationCap, Eye, EyeOff } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    // On success the auth state updates and this route redirects automatically.
    if (!result.ok) setError(result.error!);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
              <GraduationCap className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-primary" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700 }}>
              UNZAHSSA
            </h1>
            <p className="text-muted-foreground text-sm mt-1">University of Zambia · Humanities &amp; Social Sciences</p>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-8">
            <h2 className="text-foreground mb-6" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600 }}>
              Sign in to your account
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="student@unza.zm"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1.5 text-right">
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

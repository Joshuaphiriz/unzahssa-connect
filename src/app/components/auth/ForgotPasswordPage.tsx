import React, { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../lib/auth";
import { GraduationCap, CheckCircle } from "lucide-react";

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await requestPasswordReset(email);
    setLoading(false);
    setSent(true); // always show the same confirmation (don't reveal whether the account exists)
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
            {sent ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-foreground mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 600 }}>Check your email</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  If an account exists for <strong>{email}</strong>, we've sent password reset instructions to that address.
                </p>
                <Link to="/login" className="text-primary font-medium hover:underline text-sm">Back to Sign In</Link>
              </div>
            ) : (
              <>
                <h2 className="text-foreground mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600 }}>Forgot Password</h2>
                <p className="text-muted-foreground text-sm mb-6">Enter your email and we'll send you reset instructions.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email Address</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="student@unza.zm"
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                    {loading ? "Sending…" : "Send Reset Link"}
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

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, GraduationCap, Lock, Mail } from 'lucide-react';
import { useAuth } from '../shared/AuthContext';
import { useBranding } from '../shared/BrandingContext';
import { api } from '../shared/api';

export function LoginPage() {
  const { signIn, refreshUser, user } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminModal, setAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [adminMsg, setAdminMsg] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      // Wait for the session and admin check to complete
      setTimeout(async () => {
        await refreshUser();          // force fresh session & admin status
        navigate('/admin');           // go directly to admin panel
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/admin/setup', { method: 'POST', body: JSON.stringify({ email: adminEmail, setupKey: adminKey }) });
      setAdminMsg('Admin access granted. Please sign out and sign in again to activate admin privileges.');
      setTimeout(() => { setAdminModal(false); setAdminMsg(''); }, 3000);
    } catch (err: any) {
      setAdminMsg(err.message || 'Setup failed');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #F7F8FC 0%, #EDF1F7 100%)' }}>
      {/* Left hero panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1E3A5F 0%, #152D4A 60%, #0D1F33 100%)' }}
      >
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute border border-white rounded-full" style={{
              width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`,
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            }} />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            {branding.logo ? (
              <img src={branding.logo} alt="Logo" className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1" />
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,163,61,0.2)' }}>
                <GraduationCap size={26} style={{ color: '#D4A33D' }} />
              </div>
            )}
            <div>
              <p className="text-white/60 text-xs font-medium tracking-widest uppercase">Portal OS</p>
              <p className="text-white font-semibold text-sm">{branding.shortName}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            {branding.heroTitle}
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-10">{branding.heroSubtitle}</p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Affiliated Members', value: '2,400+' },
              { label: 'Internship Placements', value: '180+' },
              { label: 'Academic Programmes', value: '14' },
              { label: 'Partner Organisations', value: '28' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
                <p className="text-2xl font-bold" style={{ color: '#D4A33D', fontFamily: 'Playfair Display, serif' }}>{stat.value}</p>
                <p className="text-white/50 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-xs">{branding.footerText}</p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1E3A5F' }}>
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: '#1E3A5F' }}>{branding.name}</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-navy-100/20 p-8 border border-border">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>Welcome back</h2>
              <p className="text-muted-foreground text-sm mt-1">Sign in to your student account</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#C0392B', border: '1px solid #FECACA' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required placeholder="student@unza.zm"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 text-sm bg-input-background"
                    style={{ '--tw-ring-color': 'rgba(30,58,95,0.3)' } as any}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    required placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 text-sm bg-input-background"
                    style={{ '--tw-ring-color': 'rgba(30,58,95,0.3)' } as any}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="rounded" />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <button type="button" className="text-sm font-medium transition-colors" style={{ color: '#1E3A5F' }}>
                  Forgot password?
                </button>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                style={{ background: loading ? '#6B7A8D' : 'linear-gradient(135deg, #1E3A5F, #2A4F7A)' }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold transition-colors" style={{ color: '#1E3A5F' }}>
                Create account
              </Link>
            </p>
          </div>

          {/* HIDDEN FOR BETA TESTERS - Admin setup link
<p className="text-center text-xs text-muted-foreground mt-6">
  System administrators:{' '}
  <button onClick={() => setAdminModal(true)} className="underline" style={{ color: '#1E3A5F' }}>
    Admin setup
  </button>
</p>
*/}
        </div>
      </div>

      {/* Admin setup modal */}
      {adminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Admin Setup</h3>
            <p className="text-sm text-muted-foreground mb-6">Enter your email and a setup key to grant admin access.</p>
            <form onSubmit={handleAdminSetup} className="space-y-4">
              <input
                type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                placeholder="Admin email" required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none"
              />
              <input
                type="text" value={adminKey} onChange={e => setAdminKey(e.target.value)}
                placeholder="Setup key (choose one — first use sets it)" required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none"
              />
              {adminMsg && <p className="text-sm" style={{ color: adminMsg.includes('granted') ? '#2E7D55' : '#C0392B' }}>{adminMsg}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setAdminModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#1E3A5F' }}>
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
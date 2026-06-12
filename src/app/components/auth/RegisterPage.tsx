import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, IdCard, BookOpen, Calendar } from 'lucide-react';
import { api } from '../shared/api';   // ✅ correct import (no /TS/app)
import { useAuth } from '../shared/AuthContext';
import { useBranding } from '../shared/BrandingContext';

const STEPS = ['Personal Details', 'Academic Info', 'Security'];
const PROGRAMMES = [
  'BA History', 'BA Sociology', 'BA Political Science', 'BA Philosophy',
  'BA Mass Communication', 'BA Social Work', 'BA Psychology', 'BA Economics',
  'BA English', 'BA Linguistics', 'BA Geography', 'BA Development Studies',
  'MA History', 'MA Sociology', 'PhD Political Science',
];

export function RegisterPage() {
  const { signIn } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', studentId: '',
    programme: '', yearOfStudy: '',
    password: '', confirmPassword: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 2) { handleSubmit(); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const payload = {
        email: form.email,
        password: form.password,
        name: form.name,
        studentId: form.studentId,
        programme: form.programme,
        yearOfStudy: form.yearOfStudy,
      };

      console.log('Calling api with:', payload);
      await api('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await signIn(form.email, form.password);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #F7F8FC 0%, #EDF1F7 100%)' }}>
      <div className="w-full max-w-[480px]">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#1E3A5F' }}>
            <GraduationCap size={24} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-lg leading-tight" style={{ color: '#1E3A5F' }}>{branding.name}</p>
            <p className="text-xs text-muted-foreground">Student Registration</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          {/* Stepper */}
          <div className="flex items-center mb-8">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step ? 'bg-green-500 text-white' : i === step ? 'text-white' : 'bg-muted text-muted-foreground'
                  }`} style={i === step ? { background: '#1E3A5F' } : {}}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] mt-1 text-muted-foreground whitespace-nowrap hidden sm:block">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all ${i < step ? 'bg-green-400' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#C0392B', border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          <form onSubmit={nextStep} className="space-y-4">
            {step === 0 && (
              <>
                <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>
                  Personal Details
                </h2>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required
                      placeholder="e.g. Mwansa Banda"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">UNZA Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                      placeholder="student@unza.zm"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>
                  Academic Information
                </h2>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Student ID</label>
                  <div className="relative">
                    <IdCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" value={form.studentId} onChange={e => set('studentId', e.target.value)} required
                      placeholder="e.g. 2021123456"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Programme</label>
                  <div className="relative">
                    <BookOpen size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <select value={form.programme} onChange={e => set('programme', e.target.value)} required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none appearance-none">
                      <option value="">Select programme…</option>
                      {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Year of Study</label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <select value={form.yearOfStudy} onChange={e => set('yearOfStudy', e.target.value)} required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none appearance-none">
                      <option value="">Select year…</option>
                      {['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Postgraduate'].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>
                  Create Password
                </h2>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} required minLength={8}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required
                      placeholder="Re-enter your password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  By creating an account you agree to the UNZAHSSA terms of use.
                </p>
              </>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                  Back
                </button>
              )}
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #1E3A5F, #2A4F7A)' }}>
                {loading ? 'Creating account…' : step < 2 ? 'Continue' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold" style={{ color: '#1E3A5F' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
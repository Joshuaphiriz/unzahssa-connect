import { useState } from 'react';
import { User, Mail, IdCard, BookOpen, Calendar, Save, Check } from 'lucide-react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';

const PROGRAMMES = [
  'BA History', 'BA Sociology', 'BA Political Science', 'BA Philosophy',
  'BA Mass Communication', 'BA Social Work', 'BA Psychology', 'BA Economics',
  'BA English', 'BA Linguistics', 'BA Geography', 'BA Development Studies',
  'MA History', 'MA Sociology', 'PhD Political Science',
];

export function Profile() {
  const { user, token, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.user_metadata?.name || '',
    studentId: user?.user_metadata?.studentId || '',
    programme: user?.user_metadata?.programme || '',
    yearOfStudy: user?.user_metadata?.yearOfStudy || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api('/auth/profile', { method: 'PUT', body: JSON.stringify(form) }, token);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to save.');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your personal and academic information</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8 p-5 bg-white rounded-2xl border border-border">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1E3A5F, #2A4F7A)' }}>
          {form.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-bold text-lg text-foreground">{form.name || 'Student'}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          {form.programme && <p className="text-xs font-medium mt-0.5" style={{ color: '#D4A33D' }}>{form.programme} · {form.yearOfStudy}</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-bold text-lg mb-5" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Edit Profile</h2>

        {error && <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#C0392B' }}>{error}</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="email" value={user?.email || ''} disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Student ID</label>
            <div className="relative">
              <IdCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={form.studentId} onChange={e => set('studentId', e.target.value)}
                placeholder="e.g. 2021123456"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Programme</label>
            <div className="relative">
              <BookOpen size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select value={form.programme} onChange={e => set('programme', e.target.value)}
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
              <select value={form.yearOfStudy} onChange={e => set('yearOfStudy', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none appearance-none">
                <option value="">Select year…</option>
                {['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Postgraduate'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold disabled:opacity-60 transition-all hover:opacity-90 mt-2"
            style={{ background: saved ? '#2E7D55' : 'linear-gradient(135deg, #1E3A5F, #2A4F7A)' }}>
            {saved ? <><Check size={15} /> Changes Saved</> : saving ? 'Saving…' : <><Save size={15} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}

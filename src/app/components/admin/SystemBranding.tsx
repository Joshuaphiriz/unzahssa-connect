import { useEffect, useState } from 'react';
import { Save, Check, GraduationCap, Eye } from 'lucide-react';
import { useAuth } from '../shared/AuthContext';
import { useBranding } from '../shared/BrandingContext';
import { api } from '../shared/api';

export function SystemBranding() {
  const { token } = useAuth();
  const { branding, refresh } = useBranding();
  const [form, setForm] = useState({ ...branding });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => { setForm({ ...branding }); }, [branding]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/branding', { method: 'PUT', body: JSON.stringify(form) }, token);
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>System Branding</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Customise the portal appearance for your association</p>
        </div>
        <button onClick={() => setPreview(!preview)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
          <Eye size={14} /> {preview ? 'Hide' : 'Live'} Preview
        </button>
      </div>

      <div className={`grid gap-6 ${preview ? 'lg:grid-cols-2' : ''}`}>
        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-bold text-sm mb-4" style={{ color: '#1E3A5F' }}>Association Identity</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Portal Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Association Name</label>
                <input value={form.associationName} onChange={e => set('associationName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Short Name / Acronym</label>
                <input value={form.shortName} onChange={e => set('shortName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Contact Email</label>
                <input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-bold text-sm mb-4" style={{ color: '#1E3A5F' }}>Colours</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5" />
                  <input type="text" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.accentColor} onChange={e => set('accentColor', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5" />
                  <input type="text" value={form.accentColor} onChange={e => set('accentColor', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none font-mono" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-bold text-sm mb-4" style={{ color: '#1E3A5F' }}>Dashboard Content</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Hero Title</label>
                <input value={form.heroTitle} onChange={e => set('heroTitle', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Hero Subtitle</label>
                <textarea value={form.heroSubtitle} onChange={e => set('heroSubtitle', e.target.value)} rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Footer Text</label>
                <input value={form.footerText} onChange={e => set('footerText', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Affiliation Fee (ZMW)</label>
                <input type="number" value={form.affiliationFee} onChange={e => set('affiliationFee', parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: saved ? '#2E7D55' : `linear-gradient(135deg, ${form.primaryColor}, ${form.primaryColor}CC)` }}>
            {saved ? <><Check size={15} /> Changes Saved</> : saving ? 'Saving…' : <><Save size={15} /> Save Branding</>}
          </button>
        </form>

        {/* Preview */}
        {preview && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live Preview</p>

            {/* Nav preview */}
            <div className="rounded-2xl overflow-hidden border border-border">
              <div className="h-12 flex items-center px-4 gap-3 bg-white border-b border-border">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: form.primaryColor }}>
                  <GraduationCap size={15} className="text-white" />
                </div>
                <span className="font-bold text-sm" style={{ color: form.primaryColor, fontFamily: 'Playfair Display, serif' }}>{form.shortName}</span>
              </div>
              <div className="p-5 text-white" style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.primaryColor}CC)` }}>
                <p className="text-xs opacity-60 mb-1">Welcome back</p>
                <p className="text-xl font-bold leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>{form.heroTitle}</p>
                <p className="text-xs opacity-60 mt-2 leading-relaxed">{form.heroSubtitle}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: form.accentColor, color: form.primaryColor }}>
                  Internship Portal →
                </div>
              </div>
              <div className="px-4 py-2 border-t border-border bg-white">
                <p className="text-xs text-muted-foreground">{form.footerText}</p>
              </div>
            </div>

            {/* Color swatches */}
            <div className="bg-white rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Color Palette</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="w-full h-12 rounded-xl mb-1.5" style={{ background: form.primaryColor }} />
                  <p className="text-xs text-muted-foreground text-center">{form.primaryColor}</p>
                  <p className="text-xs font-medium text-center">Primary</p>
                </div>
                <div className="flex-1">
                  <div className="w-full h-12 rounded-xl mb-1.5" style={{ background: form.accentColor }} />
                  <p className="text-xs text-muted-foreground text-center">{form.accentColor}</p>
                  <p className="text-xs font-medium text-center">Accent</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { BrandingStore, DEFAULT_BRANDING, AuditLogs } from "../../lib/data";
import { useBranding } from "../shared/BrandingContext";
import type { Branding } from "../../lib/types";
import { Save, RotateCcw, Eye, GraduationCap } from "lucide-react";

export function SystemBranding() {
  const { user } = useAuth();
  const { refresh } = useBranding();
  const [form, setForm] = useState<Branding>(DEFAULT_BRANDING);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    let active = true;
    BrandingStore.get().then(b => { if (active) setForm(b); });
    return () => { active = false; };
  }, []);

  const set = (k: keyof Branding) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [k]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await BrandingStore.save(form);
      await refresh();
      if (user) await AuditLogs.create({
        user_name: user.name, user_email: user.email,
        action: "BRANDING_UPDATE", details: "Updated system branding settings", page: "/admin/branding",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm("Reset branding to defaults?")) return;
    setForm(await BrandingStore.reset());
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>System Branding</h1>
          <p className="text-muted-foreground text-sm mt-1">Customise how the portal presents your association.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreview(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition-colors">
            <Eye className="w-4 h-4" /> {preview ? "Hide" : "Show"} Preview
          </button>
          <button onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition-colors">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          Branding saved. Changes apply on next page load.
        </div>
      )}

      <div className={`grid gap-6 ${preview ? "lg:grid-cols-[1fr_360px]" : ""}`}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Identity">
            <TextField label="Portal Name" value={form.portal_name} onChange={set("portal_name")} />
            <TextField label="Full Association Name" value={form.association_name} onChange={set("association_name")} />
            <TextField label="Short Name / Acronym" value={form.short_name} onChange={set("short_name")} />
            <TextField label="Contact Email" type="email" value={form.contact_email} onChange={set("contact_email")} />
          </Section>

          <Section title="Colours">
            <div className="grid grid-cols-2 gap-4">
              <ColorField label="Primary" value={form.primary_color} onChange={set("primary_color")} />
              <ColorField label="Accent" value={form.accent_color} onChange={set("accent_color")} />
            </div>
          </Section>

          <Section title="Dashboard & Footer">
            <TextField label="Hero Title" value={form.hero_title} onChange={set("hero_title")} />
            <div>
              <label className="block text-sm font-medium mb-1.5">Hero Subtitle</label>
              <textarea rows={2} value={form.hero_subtitle} onChange={set("hero_subtitle")} className={`${inputCls} resize-none`} />
            </div>
            <TextField label="Footer Text" value={form.footer_text} onChange={set("footer_text")} />
            <TextField label="Affiliation Fee (ZMW)" type="number" value={String(form.affiliation_fee)} onChange={set("affiliation_fee")} />
          </Section>

          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Branding"}
          </button>
        </form>

        {preview && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live Preview</p>
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="h-12 flex items-center px-4 gap-2" style={{ background: form.primary_color }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center border-2" style={{ borderColor: form.accent_color }}>
                  <GraduationCap className="w-4 h-4" style={{ color: form.accent_color }} />
                </div>
                <span className="text-white font-semibold text-sm" style={{ fontFamily: "var(--font-display)" }}>{form.short_name}</span>
              </div>
              <div className="p-5" style={{ background: form.primary_color }}>
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-3"
                  style={{ background: `${form.accent_color}33`, color: form.accent_color }}>
                  {form.short_name}
                </span>
                <p className="text-white font-bold leading-tight" style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem" }}>{form.hero_title}</p>
                <p className="text-white/70 text-xs mt-2 leading-relaxed">{form.hero_subtitle}</p>
              </div>
              <div className="px-4 py-2 bg-card border-t border-border">
                <p className="text-xs text-muted-foreground">{form.footer_text}</p>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 flex gap-3">
              {[["Primary", form.primary_color], ["Accent", form.accent_color]].map(([name, c]) => (
                <div key={name} className="flex-1">
                  <div className="w-full h-10 rounded-lg mb-1.5" style={{ background: c }} />
                  <p className="text-xs font-medium text-center text-foreground">{name}</p>
                  <p className="text-xs text-center text-muted-foreground font-mono">{c}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <h2 className="font-semibold text-foreground text-sm">{title}</h2>
      {children}
    </div>
  );
}

function TextField({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} value={value} onChange={onChange} className={inputCls} />
    </div>
  );
}

function ColorField({ label, value, onChange }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={onChange} className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 shrink-0" />
        <input type="text" value={value} onChange={onChange} className={`${inputCls} font-mono`} />
      </div>
    </div>
  );
}

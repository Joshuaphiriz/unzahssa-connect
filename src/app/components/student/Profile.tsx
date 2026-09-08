import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { StudentProfiles, Programmes, AuditLogs } from "../../lib/data";
import type { StudentProfile } from "../../lib/types";
import { User, Mail, IdCard, Phone, BookOpen, GraduationCap, CheckCircle, Save } from "lucide-react";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Postgraduate"];

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    computer_number: "",
    year_of_study: "",
    academic_programme: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    let active = true;
    Programmes.list().then(list => { if (active) setProgrammes(list); });
    if (!user) return;
    StudentProfiles.findByUser(user.id).then(p => {
      if (!active) return;
      setProfile(p ?? null);
      setForm({
        full_name: p?.full_name || user.name,
        computer_number: p?.computer_number || "",
        year_of_study: p?.year_of_study || "",
        academic_programme: p?.academic_programme || "",
        phone: p?.phone || "",
        email: p?.email || user.email,
      });
    });
    return () => { active = false; };
  }, [user]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const next = profile
        ? await StudentProfiles.update(profile.id, { ...form })
        : await StudentProfiles.create({ ...form });
      setProfile(next);
      await AuditLogs.create({
        user_name: user.name, user_email: user.email,
        action: "PROFILE_UPDATE", details: "Updated personal profile", page: "/profile",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.full_name || "?").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your personal and academic information.</p>
      </div>

      {/* Identity card */}
      <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-foreground font-semibold text-lg truncate">{form.full_name || "Student"}</p>
          <p className="text-muted-foreground text-sm truncate">{form.email}</p>
          {form.academic_programme && (
            <p className="text-xs font-medium mt-0.5 text-accent">
              {form.academic_programme}{form.year_of_study ? ` · ${form.year_of_study}` : ""}
            </p>
          )}
        </div>
        {profile?.affiliation && (
          <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            <CheckCircle className="w-3 h-3" /> Affiliated
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Edit Details</h2>

        {saved && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            Profile saved.
          </div>
        )}

        <Field label="Full Name" icon={User}>
          <input value={form.full_name} onChange={set("full_name")} required className={inputCls} />
        </Field>

        <Field label="Email Address" icon={Mail}>
          <input type="email" value={form.email} disabled className={`${inputCls} bg-muted text-muted-foreground cursor-not-allowed`} />
        </Field>

        <Field label="Computer / Student Number" icon={IdCard}>
          <input value={form.computer_number} onChange={set("computer_number")} placeholder="e.g. 21-1-00234" className={inputCls} />
        </Field>

        <Field label="Phone Number" icon={Phone}>
          <input value={form.phone} onChange={set("phone")} placeholder="+260..." className={inputCls} />
        </Field>

        <Field label="Academic Programme" icon={BookOpen}>
          <select value={form.academic_programme} onChange={set("academic_programme")} className={inputCls}>
            <option value="">Select programme…</option>
            {programmes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>

        <Field label="Year of Study" icon={GraduationCap}>
          <select value={form.year_of_study} onChange={set("year_of_study")} className={inputCls}>
            <option value="">Select year…</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>

        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors">
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors";

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" /> {label}
      </label>
      {children}
    </div>
  );
}

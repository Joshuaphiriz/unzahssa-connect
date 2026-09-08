import React, { useState, useEffect } from "react";
import { useAuth } from "../../../lib/auth";
import { StudentProfiles, InternshipApplications, Programmes } from "../../../lib/data";
import type { StudentProfile, InternshipApplication } from "../../../lib/types";
import { X, Plus, CheckCircle } from "lucide-react";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Postgraduate"];

interface Props {
  profile: StudentProfile | null;
  application: InternshipApplication;
  onProfileSaved: (p: StudentProfile) => void;
  onAppSaved: (a: InternshipApplication) => void;
}

export function RegistrationStep({ profile, application, onProfileSaved, onAppSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? user?.name ?? "",
    computer_number: profile?.computer_number ?? "",
    year_of_study: profile?.year_of_study ?? "",
    academic_programme: profile?.academic_programme ?? "",
    email: profile?.email ?? user?.email ?? "",
    phone: profile?.phone ?? "",
  });
  const [orgs, setOrgs] = useState<string[]>(application.target_organisations ?? []);
  const [orgInput, setOrgInput] = useState("");
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    Programmes.list().then(list => { if (active) setProgrammes(list); });
    return () => { active = false; };
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const addOrg = () => {
    const t = orgInput.trim();
    if (t && !orgs.includes(t)) setOrgs(o => [...o, t]);
    setOrgInput("");
  };
  const removeOrg = (o: string) => setOrgs(prev => prev.filter(x => x !== o));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const savedProfile = profile
        ? await StudentProfiles.update(profile.id, form)
        : await StudentProfiles.create(form);
      onProfileSaved(savedProfile);
      const savedApp = await InternshipApplications.update(application.id, { target_organisations: orgs });
      onAppSaved(savedApp);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const field = "w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors";

  return (
    <div>
      <h2 className="text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>Step 1 — Details</h2>
      <p className="text-muted-foreground text-sm mb-6">Confirm your student details and the organisations you're targeting for this application.</p>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name *</label>
            <input required value={form.full_name} onChange={set("full_name")} className={field} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Computer / Student Number *</label>
            <input required value={form.computer_number} onChange={set("computer_number")} placeholder="21-1-00234" className={field} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Year of Study *</label>
            <select required value={form.year_of_study} onChange={set("year_of_study")} className={field}>
              <option value="">Select year…</option>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Academic Programme *</label>
            <select required value={form.academic_programme} onChange={set("academic_programme")} className={field}>
              <option value="">Select programme…</option>
              {programmes.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email Address *</label>
            <input type="email" required value={form.email} onChange={set("email")} className={field} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Phone Number</label>
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+260977…" className={field} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Target Organisations</label>
          <div className="flex gap-2 mb-2">
            <input value={orgInput} onChange={e => setOrgInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOrg(); } }}
              placeholder="Type an organisation and press Enter"
              className={`${field} text-sm`} />
            <button type="button" onClick={addOrg} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-muted text-foreground text-sm hover:bg-border transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {orgs.map(o => (
              <span key={o} className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {o}
                <button type="button" onClick={() => removeOrg(o)} className="hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {saving ? "Saving…" : "Save & Continue"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

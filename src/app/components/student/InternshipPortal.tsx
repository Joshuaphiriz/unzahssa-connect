import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth";
import { StudentProfiles, InternshipApplications } from "../../lib/data";
import type { StudentProfile, InternshipApplication } from "../../lib/types";
import { InternshipApplicationsList } from "./InternshipApplicationsList";
import { RegistrationStep } from "./internship/RegistrationStep";
import { CVLetterStep } from "./internship/CVLetterStep";
import { DocumentsStep } from "./internship/DocumentsStep";
import { CheckCircle, ArrowLeft } from "lucide-react";

const STEPS = [
  { label: "Details", num: 1 },
  { label: "CV & Letter", num: 2 },
  { label: "Documents", num: 3 },
];

export function InternshipPortal() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [apps, setApps] = useState<InternshipApplication[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);

  const active = apps.find(a => a.id === activeId) ?? null;

  const loadApps = useCallback(async (uid: string) => {
    setApps(await InternshipApplications.listByProfile(uid));
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const p = await StudentProfiles.findByUser(user.id);
      if (alive) setProfile(p ?? null);
      await loadApps(user.id);
    })();
    return () => { alive = false; };
  }, [user, loadApps]);

  const createApp = async () => {
    if (!user) return;
    setCreating(true);
    try {
      // ensure a profile row exists so the FK is satisfiable
      let p = profile;
      if (!p) { p = await StudentProfiles.create({ full_name: user.name, email: user.email }); setProfile(p); }
      const app = await InternshipApplications.create(p.id);
      setApps(prev => [app, ...prev]);
      setActiveId(app.id);
      setStep(1);
    } finally {
      setCreating(false);
    }
  };

  const deleteApp = async (id: string) => {
    await InternshipApplications.remove(id);
    setApps(prev => prev.filter(a => a.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const patchActive = (updated: InternshipApplication) =>
    setApps(prev => prev.map(a => (a.id === updated.id ? updated : a)));

  if (!active) {
    return (
      <InternshipApplicationsList
        applications={apps}
        creating={creating}
        onOpen={id => { setActiveId(id); setStep(1); }}
        onCreate={createApp}
        onDelete={deleteApp}
      />
    );
  }

  const canGoTo = (n: number) => n === 1 || (!!profile && !!active);

  return (
    <div className="space-y-6">
      <button onClick={() => setActiveId(null)} className="flex items-center gap-2 text-primary hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" /> All applications
      </button>

      <div>
        <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Internship Application</h1>
        <p className="text-muted-foreground text-sm mt-1">Complete the three steps for this application.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STEPS.map(s => {
          const isActive = step === s.num;
          const done = step > s.num
            || (s.num === 1 && active.target_organisations.length > 0)
            || (s.num === 2 && !!active.cv_data);
          return (
            <button key={s.num} onClick={() => canGoTo(s.num) && setStep(s.num)} disabled={!canGoTo(s.num)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive ? "bg-primary text-primary-foreground"
                  : done ? "bg-accent/20 text-accent-foreground border border-accent/40"
                  : "bg-muted text-muted-foreground"
              } disabled:cursor-not-allowed`}>
              {done && !isActive ? <CheckCircle className="w-4 h-4" /> : <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center">{s.num}</span>}
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        {step === 1 && (
          <RegistrationStep
            profile={profile}
            application={active}
            onProfileSaved={setProfile}
            onAppSaved={patchActive}
          />
        )}
        {step === 2 && profile && (
          <CVLetterStep profile={profile} application={active} onSaved={patchActive} />
        )}
        {step === 2 && !profile && <NeedStep1 onGo={() => setStep(1)} />}
        {step === 3 && profile && (
          <DocumentsStep profile={profile} application={active} />
        )}
        {step === 3 && !profile && <NeedStep1 onGo={() => setStep(1)} />}
      </div>

      <div className="flex justify-between">
        <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
          className="px-5 py-2.5 rounded-lg border border-border text-foreground text-sm hover:bg-muted disabled:opacity-40 transition-colors">
          Previous
        </button>
        <button onClick={() => setStep(s => Math.min(3, s + 1))} disabled={step === 3 || !canGoTo(step + 1)}
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors">
          {step === 3 ? "Done" : "Next Step"}
        </button>
      </div>
    </div>
  );
}

function NeedStep1({ onGo }: { onGo: () => void }) {
  return (
    <div className="text-center py-10 text-muted-foreground">
      <p>Please complete Step 1 first.</p>
      <button onClick={onGo} className="mt-3 text-primary underline text-sm">Go to Step 1</button>
    </div>
  );
}

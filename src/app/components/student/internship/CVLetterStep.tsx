import { useState, useRef } from "react";
import { InternshipApplications } from "../../../lib/data";
import type { StudentProfile, InternshipApplication, CVData, LetterData, CVEntry } from "../../../lib/types";
import { downloadCV, downloadLetter } from "../../../lib/pdf";
import { useAiAssistant } from "../../shared/AiAssistant";
import { Plus, Trash2, Save, Download, X, Sparkles } from "lucide-react";

const DEFAULT_CV: CVData = {
  personal: { name: "", email: "", phone: "", address: "", linkedin: "", summary: "" },
  objective: "",
  education: [],
  skills: [],
  experience: [],
  custom_sections: [],
  references: [],
  font: "Inter",
  theme: "Navy & Gold",
};

const DEFAULT_LETTER: LetterData = {
  your_name: "", date: new Date().toLocaleDateString(), your_email: "", your_phone: "",
  your_address: "", recipient_name: "", recipient_title: "", org_name: "", org_address: "",
  subject: "", body: "", font: "Inter", theme: "Formal",
};

function TagInput({ tags, onAdd, onRemove, placeholder }: { tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void; placeholder: string }) {
  const [v, setV] = useState("");
  const add = () => { if (v.trim()) { onAdd(v.trim()); setV(""); } };
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
        <button type="button" onClick={add} className="px-3 py-2 rounded-lg bg-muted hover:bg-border text-foreground text-sm transition-colors"><Plus className="w-4 h-4" /></button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {t}<button type="button" onClick={() => onRemove(t)}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

function EntryList({ entries, onAdd, onRemove, onUpdate, fields }: {
  entries: CVEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, k: string, v: string) => void;
  fields: { key: keyof CVEntry; label: string; textarea?: boolean }[];
}) {
  return (
    <div className="space-y-3">
      {entries.map(e => (
        <div key={e.id} className="border border-border rounded-lg p-4 relative">
          <button type="button" onClick={() => onRemove(e.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid sm:grid-cols-2 gap-3 pr-8">
            {fields.map(f => (
              <div key={f.key} className={f.textarea ? "sm:col-span-2" : ""}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                {f.textarea ? (
                  <textarea rows={2} value={(e as unknown as Record<string, string>)[f.key as string] ?? ""} onChange={ev => onUpdate(e.id, f.key as string, ev.target.value)}
                    className="w-full px-2.5 py-2 rounded-md border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none transition-colors" />
                ) : (
                  <input value={(e as unknown as Record<string, string>)[f.key as string] ?? ""} onChange={ev => onUpdate(e.id, f.key as string, ev.target.value)}
                    className="w-full px-2.5 py-2 rounded-md border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={onAdd}
        className="flex items-center gap-1.5 text-primary text-sm hover:underline">
        <Plus className="w-4 h-4" /> Add entry
      </button>
    </div>
  );
}

const genId = () => Math.random().toString(36).slice(2);

function CVPreview({ cv }: { cv: CVData }) {
  return (
    <div className="bg-white text-gray-900 p-8 rounded-lg shadow-inner border border-border print:shadow-none print:p-0 min-h-[800px]" style={{ fontFamily: cv.font === "Times New Roman Formal" ? "Georgia, serif" : "Inter, sans-serif" }}>
      <div className="border-b-4 pb-4 mb-6" style={{ borderColor: "hsl(220, 60%, 25%)" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, color: "hsl(220, 60%, 25%)" }}>{cv.personal.name || "Your Name"}</h1>
        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
          {cv.personal.email && <span>{cv.personal.email}</span>}
          {cv.personal.phone && <span>{cv.personal.phone}</span>}
          {cv.personal.address && <span>{cv.personal.address}</span>}
        </div>
      </div>
      {cv.objective && <div className="mb-6"><h2 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2 uppercase text-xs tracking-wider">Objective</h2><p className="text-sm text-gray-700 leading-relaxed">{cv.objective}</p></div>}
      {cv.education.length > 0 && <div className="mb-6"><h2 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-3 uppercase text-xs tracking-wider">Education</h2>{cv.education.map(e => <div key={e.id} className="mb-2"><div className="flex justify-between"><span className="font-medium text-sm">{e.institution}</span><span className="text-xs text-gray-500">{e.year}</span></div><div className="text-sm text-gray-600">{e.degree}</div></div>)}</div>}
      {cv.skills.length > 0 && <div className="mb-6"><h2 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2 uppercase text-xs tracking-wider">Skills</h2><div className="flex flex-wrap gap-2">{cv.skills.map(s => <span key={s} className="px-2 py-0.5 rounded bg-gray-100 text-sm text-gray-700">{s}</span>)}</div></div>}
      {cv.experience.length > 0 && <div className="mb-6"><h2 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-3 uppercase text-xs tracking-wider">Experience</h2>{cv.experience.map(e => <div key={e.id} className="mb-3"><div className="flex justify-between"><span className="font-medium text-sm">{e.company}</span><span className="text-xs text-gray-500">{e.duration}</span></div><div className="text-sm text-gray-600 mb-1">{e.role}</div>{e.description && <p className="text-sm text-gray-500 leading-relaxed">{e.description}</p>}</div>)}</div>}
      {cv.references.length > 0 && <div className="mb-6"><h2 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-3 uppercase text-xs tracking-wider">References</h2>{cv.references.map(r => <div key={r.id} className="mb-2 text-sm"><div className="font-medium">{r.title}</div><div className="text-gray-600">{r.institution}</div><div className="text-gray-500">{r.description}</div></div>)}</div>}
    </div>
  );
}

function LetterPreview({ letter }: { letter: LetterData }) {
  return (
    <div className="bg-white text-gray-900 p-10 rounded-lg shadow-inner border border-border min-h-[800px]" style={{ fontFamily: "Georgia, serif" }}>
      <div className="mb-8 text-sm leading-relaxed">
        <p className="font-semibold">{letter.your_name}</p>
        <p>{letter.your_address}</p>
        <p>{letter.your_email} · {letter.your_phone}</p>
        <p className="mt-2">{letter.date}</p>
      </div>
      <div className="mb-6 text-sm leading-relaxed">
        <p className="font-semibold">{letter.recipient_name}{letter.recipient_title && `, ${letter.recipient_title}`}</p>
        <p>{letter.org_name}</p>
        <p>{letter.org_address}</p>
      </div>
      {letter.subject && <p className="font-bold text-sm mb-4">Re: {letter.subject}</p>}
      <div className="text-sm leading-relaxed whitespace-pre-wrap">{letter.body || "Dear Sir/Madam,\n\nI am writing to express my interest in…"}</div>
      <div className="mt-8 text-sm"><p>Yours sincerely,</p><p className="mt-4 font-semibold">{letter.your_name}</p></div>
    </div>
  );
}

interface Props {
  profile: StudentProfile;
  application: InternshipApplication;
  onSaved: (a: InternshipApplication) => void;
}

export function CVLetterStep({ profile, application, onSaved }: Props) {
  const { open: openAssistant } = useAiAssistant();
  const [tab, setTab] = useState<"cv" | "letter">("cv");
  const [cvMode, setCvMode] = useState<"edit" | "preview">("edit");
  const [cvTab, setCvTab] = useState("personal");
  const [letterMode, setLetterMode] = useState<"edit" | "preview">("edit");
  const [cv, setCv] = useState<CVData>(application.cv_data ?? { ...DEFAULT_CV, personal: { ...DEFAULT_CV.personal, name: profile.full_name, email: profile.email, phone: profile.phone } });
  const [letter, setLetter] = useState<LetterData>(application.letter_data ?? { ...DEFAULT_LETTER, your_name: profile.full_name, your_email: profile.email, your_phone: profile.phone });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cvRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);

  const askAi = () => openAssistant({
    context: `CURRICULUM VITAE\n${JSON.stringify(cv, null, 2)}\n\nAPPLICATION LETTER\n${JSON.stringify(letter, null, 2)}`,
    seed: tab === "cv" ? "Please review my CV and suggest specific improvements." : "Please review my application letter and suggest improvements.",
  });

  const dlCv = async () => {
    if (!cvRef.current) return;
    setDownloading(true);
    try { await downloadCV(cvRef.current, cv.personal.name || profile.full_name); }
    finally { setDownloading(false); }
  };
  const dlLetter = async () => {
    if (!letterRef.current) return;
    setDownloading(true);
    try { await downloadLetter(letterRef.current, letter.your_name || profile.full_name); }
    finally { setDownloading(false); }
  };

  const updateCVPersonal = (k: string, v: string) => setCv(c => ({ ...c, personal: { ...c.personal, [k]: v } }));

  const addEntry = (field: keyof CVData) => {
    setCv(c => ({ ...c, [field]: [...(c[field] as CVEntry[]), { id: genId() }] }));
  };
  const removeEntry = (field: keyof CVData, id: string) => {
    setCv(c => ({ ...c, [field]: (c[field] as CVEntry[]).filter((e: CVEntry) => e.id !== id) }));
  };
  const updateEntry = (field: keyof CVData, id: string, k: string, v: string) => {
    setCv(c => ({ ...c, [field]: (c[field] as CVEntry[]).map((e: CVEntry) => e.id === id ? { ...e, [k]: v } : e) }));
  };

  const updateLetter = (k: keyof LetterData, v: string) => setLetter(l => ({ ...l, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await InternshipApplications.update(application.id, { cv_data: cv, letter_data: letter });
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const CV_TABS = [
    { id: "personal", label: "Personal" }, { id: "objective", label: "Objective" },
    { id: "education", label: "Education" }, { id: "skills", label: "Skills" },
    { id: "experience", label: "Experience" }, { id: "custom", label: "Custom" },
    { id: "references", label: "References" },
  ];

  return (
    <div>
      <h2 className="text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>Step 2 — CV &amp; Application Letter</h2>
      <p className="text-muted-foreground text-sm mb-6">Build your professional CV and application letter.</p>

      <div className="flex gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* CV / Letter tab switcher */}
          <div className="flex gap-2 mb-5">
            {(["cv", "letter"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {t === "cv" ? "Curriculum Vitae" : "Application Letter"}
              </button>
            ))}
          </div>

          {tab === "cv" && (
            <div>
              {/* Edit / Preview toggle */}
              <div className="flex gap-2 mb-4">
                {(["edit", "preview"] as const).map(m => (
                  <button key={m} onClick={() => setCvMode(m)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${cvMode === m ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {m === "edit" ? "Edit" : "Preview & Download"}
                  </button>
                ))}
              </div>

              {cvMode === "edit" ? (
                <div>
                  <div className="flex flex-wrap gap-1 mb-4 border-b border-border pb-3">
                    {CV_TABS.map(t => (
                      <button key={t.id} onClick={() => setCvTab(t.id)}
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${cvTab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {cvTab === "personal" && (
                      <>
                        {[["name","Full Name"],["email","Email"],["phone","Phone"],["address","Address"],["linkedin","LinkedIn"]].map(([k,l]) => (
                          <div key={k}>
                            <label className="block text-sm font-medium mb-1.5">{l}</label>
                            <input value={(cv.personal as Record<string,string>)[k] ?? ""} onChange={e => updateCVPersonal(k, e.target.value)}
                              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
                          </div>
                        ))}
                        <div>
                          <label className="block text-sm font-medium mb-1.5">Professional Summary</label>
                          <textarea rows={3} value={cv.personal.summary} onChange={e => updateCVPersonal("summary", e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none transition-colors" />
                        </div>
                      </>
                    )}
                    {cvTab === "objective" && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Career Objective</label>
                        <textarea rows={4} value={cv.objective} onChange={e => setCv(c => ({ ...c, objective: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none transition-colors" />
                      </div>
                    )}
                    {cvTab === "education" && (
                      <EntryList entries={cv.education} onAdd={() => addEntry("education")} onRemove={id => removeEntry("education", id)} onUpdate={(id,k,v) => updateEntry("education",id,k,v)}
                        fields={[{key:"institution",label:"Institution"},{key:"degree",label:"Qualification/Degree"},{key:"year",label:"Year"}]} />
                    )}
                    {cvTab === "skills" && (
                      <TagInput tags={cv.skills} onAdd={s => setCv(c => ({...c, skills: [...c.skills, s]}))} onRemove={s => setCv(c => ({...c, skills: c.skills.filter(x => x !== s)}))} placeholder="Add a skill and press Enter" />
                    )}
                    {cvTab === "experience" && (
                      <EntryList entries={cv.experience} onAdd={() => addEntry("experience")} onRemove={id => removeEntry("experience",id)} onUpdate={(id,k,v) => updateEntry("experience",id,k,v)}
                        fields={[{key:"company",label:"Organisation/Employer"},{key:"role",label:"Role/Title"},{key:"duration",label:"Duration"},{key:"description",label:"Description",textarea:true}]} />
                    )}
                    {cvTab === "custom" && (
                      <EntryList entries={cv.custom_sections} onAdd={() => addEntry("custom_sections")} onRemove={id => removeEntry("custom_sections",id)} onUpdate={(id,k,v) => updateEntry("custom_sections",id,k,v)}
                        fields={[{key:"title",label:"Section Title"},{key:"content",label:"Content",textarea:true}]} />
                    )}
                    {cvTab === "references" && (
                      <EntryList entries={cv.references} onAdd={() => addEntry("references")} onRemove={id => removeEntry("references",id)} onUpdate={(id,k,v) => updateEntry("references",id,k,v)}
                        fields={[{key:"title",label:"Full Name"},{key:"institution",label:"Organisation & Title"},{key:"description",label:"Contact (phone/email)"}]} />
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-end mb-3 gap-2">
                    <button onClick={dlCv} disabled={downloading} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors">
                      <Download className="w-4 h-4" /> {downloading ? "Preparing…" : "Download PDF"}
                    </button>
                  </div>
                  <div ref={cvRef}><CVPreview cv={cv} /></div>
                </div>
              )}
            </div>
          )}

          {tab === "letter" && (
            <div>
              <div className="flex gap-2 mb-4">
                {(["edit","preview"] as const).map(m => (
                  <button key={m} onClick={() => setLetterMode(m)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${letterMode === m ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {m === "edit" ? "Edit" : "Preview & Download"}
                  </button>
                ))}
              </div>

              {letterMode === "edit" ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {([["your_name","Your Full Name"],["date","Date"],["your_email","Your Email"],["your_phone","Your Phone"],["your_address","Your Address"],["recipient_name","Recipient Name"],["recipient_title","Recipient Title"],["org_name","Organisation"],["org_address","Organisation Address"],["subject","Subject"]] as [keyof LetterData, string][]).map(([k,l]) => (
                    <div key={k}>
                      <label className="block text-sm font-medium mb-1.5">{l}</label>
                      <input value={letter[k] as string} onChange={e => updateLetter(k, e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Letter Body</label>
                    <textarea rows={8} value={letter.body} onChange={e => updateLetter("body", e.target.value)} placeholder="Dear Hiring Manager,\n\nI am writing to express my interest in…"
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none transition-colors" />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-end mb-3">
                    <button onClick={dlLetter} disabled={downloading} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors">
                      <Download className="w-4 h-4" /> {downloading ? "Preparing…" : "Download PDF"}
                    </button>
                  </div>
                  <div ref={letterRef}><LetterPreview letter={letter} /></div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors">
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
            </button>
            {saved && <span className="text-green-600 text-sm font-medium">Saved!</span>}
          </div>
        </div>

        {/* AI Assistant */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="bg-card rounded-xl border border-border p-5 sticky top-6">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-accent" />
              <h4 className="font-semibold text-foreground text-sm" style={{ fontFamily: "var(--font-display)" }}>AI Assistant</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Get specific, AI-powered feedback on this CV and letter, or ask anything about internship applications.
            </p>
            <button onClick={askAi}
              className="w-full py-2 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 transition-colors">
              Review my {tab === "cv" ? "CV" : "letter"} with AI
            </button>
          </div>
        </div>
      </div>

      {/* Mobile AI button */}
      <button onClick={askAi}
        className="lg:hidden mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 transition-colors">
        <Sparkles className="w-4 h-4" /> Review with AI Assistant
      </button>
    </div>
  );
}

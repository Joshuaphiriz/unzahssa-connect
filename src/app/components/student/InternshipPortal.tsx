import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronRight, ChevronLeft, Check, FileText, Upload, X,
  Plus, Trash2, Eye, Download, Lightbulb, User as UserIcon,
  GraduationCap, Briefcase, Star, Globe, BookOpen, Sparkles, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../shared/AuthContext';
import { api, apiForm } from '../shared/api';

const STEPS = [
  { label: 'Registration', icon: UserIcon },
  { label: 'CV & Letter', icon: FileText },
  { label: 'Documents', icon: Upload },
];

const PROGRAMMES = [
  'BA History', 'BA Sociology', 'BA Political Science', 'BA Philosophy',
  'BA Mass Communication', 'BA Social Work', 'BA Psychology', 'BA Economics',
  'BA English', 'BA Linguistics', 'BA Geography', 'BA Development Studies',
];

const DOC_TYPES = [
  { key: 'nrc', label: 'NRC (National Registration Card)', required: true },
  { key: 'transcript', label: 'Academic Transcript', required: true },
  { key: 'certificate', label: 'Certificate / Award', required: false },
  { key: 'recommendation', label: 'Recommendation Letter', required: true },
  { key: 'medical', label: 'Medical Certificate', required: false },
  { key: 'other', label: 'Other Document', required: false },
];

interface Education { institution: string; degree: string; field: string; startYear: string; endYear: string; grade: string; }
interface Experience { company: string; role: string; startDate: string; endDate: string; current: boolean; description: string; }
interface Skill { name: string; level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'; }

const defaultCV = {
  personal: { name: '', email: '', phone: '', address: '', city: '', linkedin: '', website: '' },
  summary: '',
  education: [] as Education[],
  experience: [] as Experience[],
  skills: [] as Skill[],
  languages: [] as { language: string; level: string }[],
  references: [] as { name: string; title: string; company: string; phone: string; email: string }[],
};

const defaultLetter = {
  date: new Date().toLocaleDateString('en-ZM', { day: 'numeric', month: 'long', year: 'numeric' }),
  recipientName: '',
  recipientTitle: '',
  company: '',
  companyAddress: '',
  subject: 'Application for Internship Position',
  opening: 'I write to express my sincere interest in an internship opportunity at your esteemed organisation.',
  body: 'As a student of [Programme] at the University of Zambia, I have developed strong analytical, research, and communication skills that I am eager to apply in a professional setting. I am particularly drawn to your organisation because of its commitment to [mention a specific aspect]. I believe that an internship at [Company] will provide me with invaluable practical experience that complements my academic training.',
  closing: 'I would welcome the opportunity to discuss how my background and skills can contribute to your organisation. I have attached my curriculum vitae for your consideration. I look forward to hearing from you.',
  senderName: '',
  senderTitle: '',
  senderContact: '',
};

type CvTab = 'personal' | 'summary' | 'education' | 'experience' | 'skills' | 'languages' | 'references';

export function InternshipPortal() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Step 1: Registration
  const [regForm, setRegForm] = useState({
    studentId: user?.user_metadata?.studentId || '',
    programme: user?.user_metadata?.programme || '',
    yearOfStudy: user?.user_metadata?.yearOfStudy || '',
    phone: '', address: '', city: 'Lusaka',
    organisations: ['', '', ''],
    availability: 'Full-time',
    startDate: '',
    duration: '3 months',
    motivation: '',
  });

  // Step 2: CV
  const [cvData, setCvData] = useState(defaultCV);
  const [cvTab, setCvTab] = useState<CvTab>('personal');
  const [cvPreview, setCvPreview] = useState(false);
  const [letterData, setLetterData] = useState(defaultLetter);
  const [letterPreview, setLetterPreview] = useState(false);
  const [activeDoc, setActiveDoc] = useState<'cv' | 'letter'>('cv');

  // Step 3: Documents
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; url: string }>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState('');

  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    // Pre-fill CV with user data
    setCvData(d => ({
      ...d,
      personal: {
        ...d.personal,
        name: user?.user_metadata?.name || '',
        email: user?.email || '',
      }
    }));
    setLetterData(d => ({ ...d, senderName: user?.user_metadata?.name || '' }));
    // Load existing application
    if (token) {
      api('/internship/my', {}, token).then(data => {
        if (data) {
          if (data.registration) setRegForm(d => ({ ...d, ...data.registration }));
          if (data.cvData) setCvData(d => ({ ...d, ...data.cvData }));
          if (data.letterData) setLetterData(d => ({ ...d, ...data.letterData }));
          if (data.documents) setUploadedDocs(data.documents);
          if (data.status === 'pending' || data.status === 'submitted') setSubmitted(true);
        }
      }).catch(() => {});
    }
  }, [user, token]);

  const save = async (additionalData = {}) => {
    setSaving(true);
    try {
      await api('/internship', {
        method: 'POST',
        body: JSON.stringify({ registration: regForm, cvData, letterData, documents: uploadedDocs, ...additionalData }),
      }, token);
    } catch (e) { console.log(e); }
    setSaving(false);
  };

  const handleUpload = async (docType: string, file: File) => {
    setUploading(prev => ({ ...prev, [docType]: true }));
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', docType);
      const res = await apiForm('/documents/upload', form, token!);
      const newDocs = { ...uploadedDocs, [docType]: { name: res.name || file.name, url: res.url } };
      setUploadedDocs(newDocs);
      await api('/internship', { method: 'POST', body: JSON.stringify({ documents: newDocs }) }, token);
    } catch (e: any) { alert(e.message); }
    setUploading(prev => ({ ...prev, [docType]: false }));
  };

  const handleSubmitAll = async () => {
    await save({ submit: true });
    setSubmitted(true);
  };

  const printCV = () => {
    const d = cvData;
    const html = `
      <div>
        <div style="border-bottom: 2px solid #1E3A5F; padding-bottom: 16px; margin-bottom: 24px;">
          <h1>${d.personal.name || 'Your Name'}</h1>
          <p class="contact">${[d.personal.email, d.personal.phone, d.personal.city, d.personal.linkedin].filter(Boolean).join(' · ')}</p>
        </div>
        ${d.summary ? `<h2>Profile</h2><p style="font-size:10.5pt;margin-bottom:16px">${d.summary}</p>` : ''}
        ${d.education.length ? `<h2>Education</h2>${d.education.map(e => `<div class="edu-item"><div class="edu-header"><span>${e.institution}</span><span class="date">${e.startYear}–${e.endYear}</span></div><div>${e.degree}${e.field ? ` in ${e.field}` : ''}${e.grade ? ` · ${e.grade}` : ''}</div></div>`).join('')}` : ''}
        ${d.experience.length ? `<h2>Experience</h2>${d.experience.map(e => `<div class="exp-item"><div class="exp-header"><span>${e.role}</span><span class="date">${e.startDate}–${e.endDate}</span></div><div style="color:#555;font-size:10pt">${e.company}</div>${e.description ? `<div style="margin-top:4px;font-size:10pt">${e.description.split('\n').map(l => `<div>${l}</div>`).join('')}</div>` : ''}</div>`).join('')}` : ''}
        ${d.skills.length ? `<h2>Skills</h2><div class="skills">${d.skills.map(s => `<span class="skill-tag">${s.name}${s.level ? ` — ${s.level}` : ''}</span>`).join('')}</div>` : ''}
        ${d.languages.length ? `<h2>Languages</h2><div class="skills">${d.languages.map(l => `<span class="skill-tag">${l.language} — ${l.level}</span>`).join('')}</div>` : ''}
        ${d.references.length ? `<h2>References</h2>${d.references.map(r => `<div class="edu-item"><strong>${r.name}</strong><div style="font-size:10pt;color:#555">${r.title}${r.company ? `, ${r.company}` : ''}</div><div style="font-size:10pt">${[r.phone, r.email].filter(Boolean).join(' · ')}</div></div>`).join('')}` : ''}
      </div>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${d.personal.name} — Curriculum Vitae</title><style>${cvPrintCSS()}</style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  const printLetter = () => {
    const l = letterData;
    const html = `
      <div>
        <p>${l.date}</p>
        <br/>
        <p>${l.recipientName || 'The Human Resources Manager'}</p>
        ${l.recipientTitle ? `<p>${l.recipientTitle}</p>` : ''}
        ${l.company ? `<p>${l.company}</p>` : ''}
        ${l.companyAddress ? `<p>${l.companyAddress}</p>` : ''}
        <br/>
        <p><strong>Re: ${l.subject}</strong></p>
        <br/>
        <p>Dear ${l.recipientName ? l.recipientName.split(' ')[0] : 'Sir/Madam'},</p>
        <br/>
        <p>${l.opening}</p>
        <br/>
        <p>${l.body}</p>
        <br/>
        <p>${l.closing}</p>
        <br/><br/>
        <p>Yours sincerely,</p>
        <br/><br/><br/>
        <p><strong>${l.senderName || 'Your Name'}</strong></p>
        ${l.senderTitle ? `<p>${l.senderTitle}</p>` : ''}
        ${l.senderContact ? `<p>${l.senderContact}</p>` : ''}
      </div>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Application Letter — ${l.senderName}</title><style>${letterPrintCSS()}</style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#F0FDF4' }}>
          <Check size={36} style={{ color: '#2E7D55' }} />
        </div>
        <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Application Submitted!</h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Your internship application has been received. The Internship Coordinator will review your documents
          and contact you within 5–7 working days.
        </p>
        <button onClick={() => navigate('/dashboard')} className="px-8 py-3 rounded-xl text-white font-semibold" style={{ background: '#1E3A5F' }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Internship Application</h1>
        <p className="text-muted-foreground text-sm mt-1">Complete all three steps to submit your application</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-8 bg-white rounded-2xl border border-border p-4">
        {STEPS.map(({ label, icon: Icon }, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <button onClick={() => i < step && setStep(i)} className={`flex items-center gap-2 ${i < step ? 'cursor-pointer' : 'cursor-default'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'text-white' : 'bg-muted text-muted-foreground'
              }`} style={i === step ? { background: '#1E3A5F' } : {}}>
                {i < step ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </button>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-green-400' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {step === 0 && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Student Registration</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Student ID" value={regForm.studentId} onChange={v => setRegForm(f => ({ ...f, studentId: v }))} placeholder="2021123456" />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Programme</label>
                  <select value={regForm.programme} onChange={e => setRegForm(f => ({ ...f, programme: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none">
                    <option value="">Select programme…</option>
                    {PROGRAMMES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Year of Study</label>
                  <select value={regForm.yearOfStudy} onChange={e => setRegForm(f => ({ ...f, yearOfStudy: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none">
                    <option value="">Select year…</option>
                    {['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Postgraduate'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <Field label="Phone Number" value={regForm.phone} onChange={v => setRegForm(f => ({ ...f, phone: v }))} placeholder="+260 9XX XXX XXX" />
                <Field label="City" value={regForm.city} onChange={v => setRegForm(f => ({ ...f, city: v }))} placeholder="Lusaka" />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Availability</label>
                  <select value={regForm.availability} onChange={e => setRegForm(f => ({ ...f, availability: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none">
                    {['Full-time', 'Part-time', 'Weekends only'].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <Field label="Preferred Start Date" type="date" value={regForm.startDate} onChange={v => setRegForm(f => ({ ...f, startDate: v }))} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Duration</label>
                  <select value={regForm.duration} onChange={e => setRegForm(f => ({ ...f, duration: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none">
                    {['1 month', '2 months', '3 months', '6 months'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1.5">Target Organisations (up to 3)</label>
                <div className="space-y-2">
                  {regForm.organisations.map((org, i) => (
                    <input key={i} value={org} onChange={e => setRegForm(f => ({ ...f, organisations: f.organisations.map((o, j) => j === i ? e.target.value : o) }))}
                      placeholder={`Organisation ${i + 1}`}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1.5">Motivation Statement</label>
                <textarea value={regForm.motivation} onChange={e => setRegForm(f => ({ ...f, motivation: e.target.value }))}
                  rows={4} placeholder="Why are you applying for this internship programme? What do you hope to gain?"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none resize-none" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {/* CV / Letter toggle */}
              <div className="flex gap-2 bg-white rounded-2xl border border-border p-1.5">
                {(['cv', 'letter'] as const).map(t => (
                  <button key={t} onClick={() => setActiveDoc(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeDoc === t ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
                    style={activeDoc === t ? { background: '#1E3A5F' } : {}}>
                    {t === 'cv' ? '📄 Curriculum Vitae' : '✉️ Application Letter'}
                  </button>
                ))}
              </div>

              {activeDoc === 'cv' && (
                <div className="bg-white rounded-2xl border border-border overflow-hidden">
                  {/* CV tabs */}
                  <div className="flex overflow-x-auto border-b border-border px-4 pt-3 gap-1">
                    {(['personal', 'summary', 'education', 'experience', 'skills', 'languages', 'references'] as CvTab[]).map(tab => (
                      <button key={tab} onClick={() => setCvTab(tab)}
                        className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${cvTab === tab ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    {cvTab === 'personal' && (
                      <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Full Name" value={cvData.personal.name} onChange={v => setCvData(d => ({ ...d, personal: { ...d.personal, name: v } }))} />
                        <Field label="Email" value={cvData.personal.email} onChange={v => setCvData(d => ({ ...d, personal: { ...d.personal, email: v } }))} />
                        <Field label="Phone" value={cvData.personal.phone} onChange={v => setCvData(d => ({ ...d, personal: { ...d.personal, phone: v } }))} />
                        <Field label="City" value={cvData.personal.city} onChange={v => setCvData(d => ({ ...d, personal: { ...d.personal, city: v } }))} />
                        <Field label="LinkedIn" value={cvData.personal.linkedin} onChange={v => setCvData(d => ({ ...d, personal: { ...d.personal, linkedin: v } }))} placeholder="linkedin.com/in/..." />
                        <Field label="Website / Portfolio" value={cvData.personal.website} onChange={v => setCvData(d => ({ ...d, personal: { ...d.personal, website: v } }))} />
                      </div>
                    )}

                    {cvTab === 'summary' && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Professional Summary</label>
                        <textarea value={cvData.summary} onChange={e => setCvData(d => ({ ...d, summary: e.target.value }))}
                          rows={6} placeholder="A concise 3-4 sentence summary highlighting your key skills, experience, and career objectives…"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none resize-none" />
                      </div>
                    )}

                    {cvTab === 'education' && (
                      <div className="space-y-4">
                        {cvData.education.map((edu, i) => (
                          <div key={i} className="p-4 rounded-xl border border-border relative">
                            <button onClick={() => setCvData(d => ({ ...d, education: d.education.filter((_, j) => j !== i) }))}
                              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
                            <div className="grid md:grid-cols-2 gap-3 pr-6">
                              <Field label="Institution" value={edu.institution} onChange={v => setCvData(d => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, institution: v } : e) }))} />
                              <Field label="Degree" value={edu.degree} onChange={v => setCvData(d => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, degree: v } : e) }))} />
                              <Field label="Field of Study" value={edu.field} onChange={v => setCvData(d => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, field: v } : e) }))} />
                              <Field label="Grade / GPA" value={edu.grade} onChange={v => setCvData(d => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, grade: v } : e) }))} />
                              <Field label="Start Year" value={edu.startYear} onChange={v => setCvData(d => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, startYear: v } : e) }))} placeholder="2020" />
                              <Field label="End Year" value={edu.endYear} onChange={v => setCvData(d => ({ ...d, education: d.education.map((e, j) => j === i ? { ...e, endYear: v } : e) }))} placeholder="2024 / Present" />
                            </div>
                          </div>
                        ))}
                        <button onClick={() => setCvData(d => ({ ...d, education: [...d.education, { institution: '', degree: '', field: '', startYear: '', endYear: '', grade: '' }] }))}
                          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border border-dashed border-border hover:bg-muted transition-colors text-muted-foreground">
                          <Plus size={14} /> Add Education
                        </button>
                      </div>
                    )}

                    {cvTab === 'experience' && (
                      <div className="space-y-4">
                        {cvData.experience.map((exp, i) => (
                          <div key={i} className="p-4 rounded-xl border border-border relative">
                            <button onClick={() => setCvData(d => ({ ...d, experience: d.experience.filter((_, j) => j !== i) }))}
                              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
                            <div className="grid md:grid-cols-2 gap-3 pr-6">
                              <Field label="Company / Organisation" value={exp.company} onChange={v => setCvData(d => ({ ...d, experience: d.experience.map((e, j) => j === i ? { ...e, company: v } : e) }))} />
                              <Field label="Role / Title" value={exp.role} onChange={v => setCvData(d => ({ ...d, experience: d.experience.map((e, j) => j === i ? { ...e, role: v } : e) }))} />
                              <Field label="Start Date" value={exp.startDate} onChange={v => setCvData(d => ({ ...d, experience: d.experience.map((e, j) => j === i ? { ...e, startDate: v } : e) }))} placeholder="Jan 2022" />
                              <Field label="End Date" value={exp.endDate} onChange={v => setCvData(d => ({ ...d, experience: d.experience.map((e, j) => j === i ? { ...e, endDate: v } : e) }))} placeholder="Dec 2022 / Present" />
                            </div>
                            <div className="mt-3">
                              <label className="block text-xs font-medium mb-1">Key Responsibilities & Achievements</label>
                              <textarea value={exp.description} onChange={e => setCvData(d => ({ ...d, experience: d.experience.map((ex, j) => j === i ? { ...ex, description: e.target.value } : ex) }))}
                                rows={3} placeholder="• Describe key responsibilities and achievements (use bullet points)"
                                className="w-full px-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none resize-none" />
                            </div>
                          </div>
                        ))}
                        <button onClick={() => setCvData(d => ({ ...d, experience: [...d.experience, { company: '', role: '', startDate: '', endDate: '', current: false, description: '' }] }))}
                          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border border-dashed border-border hover:bg-muted transition-colors text-muted-foreground">
                          <Plus size={14} /> Add Experience
                        </button>
                      </div>
                    )}

                    {cvTab === 'skills' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {cvData.skills.map((skill, i) => (
                            <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl border border-border">
                              <input value={skill.name} onChange={e => setCvData(d => ({ ...d, skills: d.skills.map((s, j) => j === i ? { ...s, name: e.target.value } : s) }))}
                                placeholder="Skill name" className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none" />
                              <select value={skill.level} onChange={e => setCvData(d => ({ ...d, skills: d.skills.map((s, j) => j === i ? { ...s, level: e.target.value as any } : s) }))}
                                className="text-xs bg-transparent focus:outline-none">
                                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(l => <option key={l} value={l}>{l}</option>)}
                              </select>
                              <button onClick={() => setCvData(d => ({ ...d, skills: d.skills.filter((_, j) => j !== i) }))} className="text-muted-foreground hover:text-destructive"><X size={12} /></button>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => setCvData(d => ({ ...d, skills: [...d.skills, { name: '', level: 'Intermediate' }] }))}
                          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border border-dashed border-border hover:bg-muted transition-colors text-muted-foreground">
                          <Plus size={14} /> Add Skill
                        </button>
                      </div>
                    )}

                    {cvTab === 'languages' && (
                      <div className="space-y-3">
                        {cvData.languages.map((lang, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <input value={lang.language} onChange={e => setCvData(d => ({ ...d, languages: d.languages.map((l, j) => j === i ? { ...l, language: e.target.value } : l) }))}
                              placeholder="Language" className="flex-1 px-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
                            <select value={lang.level} onChange={e => setCvData(d => ({ ...d, languages: d.languages.map((l, j) => j === i ? { ...l, level: e.target.value } : l) }))}
                              className="px-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none">
                              {['Native', 'Fluent', 'Intermediate', 'Basic'].map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <button onClick={() => setCvData(d => ({ ...d, languages: d.languages.filter((_, j) => j !== i) }))} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={13} /></button>
                          </div>
                        ))}
                        <button onClick={() => setCvData(d => ({ ...d, languages: [...d.languages, { language: '', level: 'Intermediate' }] }))}
                          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border border-dashed border-border hover:bg-muted transition-colors text-muted-foreground">
                          <Plus size={14} /> Add Language
                        </button>
                      </div>
                    )}

                    {cvTab === 'references' && (
                      <div className="space-y-4">
                        {cvData.references.map((ref, i) => (
                          <div key={i} className="p-4 rounded-xl border border-border relative">
                            <button onClick={() => setCvData(d => ({ ...d, references: d.references.filter((_, j) => j !== i) }))}
                              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
                            <div className="grid md:grid-cols-2 gap-3 pr-6">
                              <Field label="Full Name" value={ref.name} onChange={v => setCvData(d => ({ ...d, references: d.references.map((r, j) => j === i ? { ...r, name: v } : r) }))} />
                              <Field label="Job Title" value={ref.title} onChange={v => setCvData(d => ({ ...d, references: d.references.map((r, j) => j === i ? { ...r, title: v } : r) }))} />
                              <Field label="Company" value={ref.company} onChange={v => setCvData(d => ({ ...d, references: d.references.map((r, j) => j === i ? { ...r, company: v } : r) }))} />
                              <Field label="Phone" value={ref.phone} onChange={v => setCvData(d => ({ ...d, references: d.references.map((r, j) => j === i ? { ...r, phone: v } : r) }))} />
                              <Field label="Email" value={ref.email} onChange={v => setCvData(d => ({ ...d, references: d.references.map((r, j) => j === i ? { ...r, email: v } : r) }))} />
                            </div>
                          </div>
                        ))}
                        <button onClick={() => setCvData(d => ({ ...d, references: [...d.references, { name: '', title: '', company: '', phone: '', email: '' }] }))}
                          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border border-dashed border-border hover:bg-muted transition-colors text-muted-foreground">
                          <Plus size={14} /> Add Reference
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="px-5 pb-4 flex gap-3 border-t border-border pt-4">
                    <button onClick={() => setCvPreview(!cvPreview)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                      <Eye size={14} /> {cvPreview ? 'Hide Preview' : 'Preview CV'}
                    </button>
                    <button onClick={printCV}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                      style={{ background: '#D4A33D' }}>
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                </div>
              )}

              {activeDoc === 'letter' && (
                <div className="bg-white rounded-2xl border border-border p-5">
                  <h3 className="font-bold text-lg mb-5" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Application Letter Editor</h3>
                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <Field label="Date" value={letterData.date} onChange={v => setLetterData(d => ({ ...d, date: v }))} />
                    <Field label="Subject Line" value={letterData.subject} onChange={v => setLetterData(d => ({ ...d, subject: v }))} />
                    <Field label="Recipient Name" value={letterData.recipientName} onChange={v => setLetterData(d => ({ ...d, recipientName: v }))} placeholder="The Human Resources Manager" />
                    <Field label="Recipient Title" value={letterData.recipientTitle} onChange={v => setLetterData(d => ({ ...d, recipientTitle: v }))} />
                    <Field label="Company / Organisation" value={letterData.company} onChange={v => setLetterData(d => ({ ...d, company: v }))} />
                    <Field label="Company Address" value={letterData.companyAddress} onChange={v => setLetterData(d => ({ ...d, companyAddress: v }))} />
                  </div>
                  {[
                    { key: 'opening', label: 'Opening Paragraph', rows: 3 },
                    { key: 'body', label: 'Body Paragraph(s)', rows: 6 },
                    { key: 'closing', label: 'Closing Paragraph', rows: 3 },
                  ].map(({ key, label, rows }) => (
                    <div key={key} className="mb-3">
                      <label className="block text-sm font-medium mb-1.5">{label}</label>
                      <textarea value={(letterData as any)[key]} onChange={e => setLetterData(d => ({ ...d, [key]: e.target.value }))}
                        rows={rows} className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none resize-none" />
                    </div>
                  ))}
                  <div className="grid md:grid-cols-2 gap-3 mt-4">
                    <Field label="Your Full Name" value={letterData.senderName} onChange={v => setLetterData(d => ({ ...d, senderName: v }))} />
                    <Field label="Your Title / Programme" value={letterData.senderTitle} onChange={v => setLetterData(d => ({ ...d, senderTitle: v }))} placeholder="Final Year BA Sociology" />
                    <Field label="Contact Information" value={letterData.senderContact} onChange={v => setLetterData(d => ({ ...d, senderContact: v }))} />
                  </div>
                  <div className="flex gap-3 mt-5 pt-4 border-t border-border">
                    <button onClick={() => setLetterPreview(!letterPreview)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                      <Eye size={14} /> {letterPreview ? 'Hide' : 'Preview'}
                    </button>
                    <button onClick={printLetter}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
                      style={{ background: '#D4A33D' }}>
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                </div>
              )}

              {/* CV Preview */}
              {cvPreview && activeDoc === 'cv' && (
                <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">CV Preview</p>
                  <div className="border border-border rounded-xl overflow-hidden" style={{ maxHeight: 500, overflowY: 'auto' }}>
                    <div className="p-8" style={{ fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.6 }}>
                      <div className="border-b-2 pb-4 mb-6" style={{ borderColor: '#1E3A5F' }}>
                        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1E3A5F' }}>{cvData.personal.name || 'Your Name'}</h1>
                        <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                          {[cvData.personal.email, cvData.personal.phone, cvData.personal.city].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      {cvData.summary && <><h2 style={{ color: '#1E3A5F', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Profile</h2><p style={{ fontSize: 13, color: '#374151', marginBottom: 20 }}>{cvData.summary}</p></>}
                      {cvData.education.length > 0 && <><h2 style={{ color: '#1E3A5F', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Education</h2>{cvData.education.map((e, i) => <div key={i} style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{e.institution}</strong><span style={{ color: '#64748B', fontSize: 12 }}>{e.startYear}–{e.endYear}</span></div><div style={{ color: '#374151', fontSize: 13 }}>{e.degree}{e.field && ` in ${e.field}`}{e.grade && ` · ${e.grade}`}</div></div>)}</>}
                    </div>
                  </div>
                </div>
              )}

              {/* Letter Preview */}
              {letterPreview && activeDoc === 'letter' && (
                <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Letter Preview</p>
                  <div className="border border-border rounded-xl p-8 text-sm" style={{ fontFamily: 'Georgia, serif', lineHeight: 1.8, maxHeight: 500, overflowY: 'auto' }}>
                    <p style={{ marginBottom: 24 }}>{letterData.date}</p>
                    <p>{letterData.recipientName || 'The Human Resources Manager'}</p>
                    {letterData.recipientTitle && <p>{letterData.recipientTitle}</p>}
                    {letterData.company && <p>{letterData.company}</p>}
                    {letterData.companyAddress && <p>{letterData.companyAddress}</p>}
                    <p style={{ marginTop: 24, marginBottom: 8 }}><strong>Re: {letterData.subject}</strong></p>
                    <p style={{ marginBottom: 16 }}>Dear {letterData.recipientName ? `${letterData.recipientName.split(' ')[0]}` : 'Sir/Madam'},</p>
                    <p style={{ marginBottom: 16 }}>{letterData.opening}</p>
                    <p style={{ marginBottom: 16 }}>{letterData.body}</p>
                    <p style={{ marginBottom: 24 }}>{letterData.closing}</p>
                    <p>Yours sincerely,</p>
                    <p style={{ marginTop: 24, fontWeight: 'bold' }}>{letterData.senderName || 'Your Name'}</p>
                    {letterData.senderTitle && <p>{letterData.senderTitle}</p>}
                    {letterData.senderContact && <p>{letterData.senderContact}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Document Upload</h2>
              <p className="text-sm text-muted-foreground mb-6">Upload all required documents. Accepted formats: PDF, JPG, PNG (max 5MB each)</p>

              <div className="space-y-3">
                {DOC_TYPES.map(({ key, label, required }) => {
                  const uploaded = uploadedDocs[key];
                  return (
                    <div key={key} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${uploaded ? 'border-green-200 bg-green-50/50' : 'border-border hover:border-primary/30'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${uploaded ? 'bg-green-100' : 'bg-muted'}`}>
                          {uploaded ? <Check size={16} style={{ color: '#2E7D55' }} /> : <FileText size={16} className="text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          {required && !uploaded && <p className="text-xs text-red-500">Required</p>}
                          {uploaded && <p className="text-xs" style={{ color: '#2E7D55' }}>{uploaded.name}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {uploaded && (
                          <button onClick={() => { const d = { ...uploadedDocs }; delete d[key]; setUploadedDocs(d); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive transition-colors">
                            <X size={13} />
                          </button>
                        )}
                        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${uploading[key] ? 'opacity-50' : 'hover:opacity-90'}`}
                          style={{ background: '#1E3A5F', color: '#fff' }}>
                          {uploading[key] ? 'Uploading…' : uploaded ? 'Replace' : <><Upload size={12} /> Upload</>}
                          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(key, f); e.target.value = ''; }}
                            disabled={uploading[key]} />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Completion check */}
              {(() => {
                const required = DOC_TYPES.filter(d => d.required);
                const done = required.filter(d => uploadedDocs[d.key]);
                const pct = Math.round((done.length / required.length) * 100);
                return (
                  <div className="mt-6 p-4 rounded-xl" style={{ background: pct === 100 ? '#F0FDF4' : '#FFFBEB' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{done.length}/{required.length} required documents uploaded</span>
                      <span className="text-sm font-bold" style={{ color: pct === 100 ? '#2E7D55' : '#D4A33D' }}>{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? '#2E7D55' : '#D4A33D' }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* AI Assistant sidebar */}
        <div className="w-72 flex-shrink-0 hidden xl:block">
          <div className="bg-white rounded-2xl border border-border overflow-hidden sticky top-24">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2" style={{ background: '#1E3A5F' }}>
              <Lightbulb size={16} style={{ color: '#D4A33D' }} />
              <span className="text-sm font-semibold text-white">AI Assistant</span>
            </div>
            <div className="p-4 space-y-3">
              {AI_TIPS[step]?.map((tip, i) => (
                <div key={i} className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: '#F7F8FC', color: '#374151' }}>
                  <span className="font-semibold block mb-1" style={{ color: '#1E3A5F' }}>{tip.title}</span>
                  {tip.body}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        {step > 0 ? (
          <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            <ChevronLeft size={15} /> Back
          </button>
        ) : <div />}

        <div className="flex gap-3">
          <button onClick={() => save()} disabled={saving} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          {step < 2 ? (
            <button onClick={() => { save(); setStep(s => s + 1); }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
              style={{ background: '#1E3A5F' }}>
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={handleSubmitAll}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
              style={{ background: '#2E7D55' }}>
              <Check size={15} /> Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
    </div>
  );
}

const AI_TIPS: Record<number, { title: string; body: string }[]> = {
  0: [
    { title: '💡 Target Organisations', body: 'Research each organisation before listing them. Mention specific programmes or departments that match your field of study.' },
    { title: '✍️ Motivation Statement', body: 'Your motivation statement should answer: Why this field? What skills will you bring? What do you hope to learn?' },
  ],
  1: [
    { title: '📄 CV Length', body: 'As a student, aim for a 1–2 page CV. Use clear sections and bullet points. Quantify achievements where possible.' },
    { title: '✉️ Cover Letter Tip', body: 'Address the letter to a specific person when possible. Research the organisation\'s recent work and reference it in the body.' },
    { title: '⭐ Professional Summary', body: 'Open with a 3-sentence summary: who you are, your key skills, and your career objective for the internship.' },
  ],
  2: [
    { title: '📋 Document Quality', body: 'Ensure all documents are clearly scanned or photographed. PDFs are preferred for text documents.' },
    { title: '🎓 Transcript', body: 'If your transcript is not yet available, upload the most recent one you have and note the academic year.' },
    { title: '📝 Recommendation Letter', body: 'Ask a lecturer or employer who can speak specifically to your academic or professional abilities. Give them at least 2 weeks.' },
  ],
};

// eslint-disable-next-line
function cvPrintCSS() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; padding: 20mm; }
    h1 { font-size: 22pt; color: #1E3A5F; margin-bottom: 4px; }
    h2 { font-size: 9pt; color: #1E3A5F; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; margin: 18px 0 6px 0; border-bottom: 1.5px solid #1E3A5F; padding-bottom: 3px; }
    .contact { color: #555; font-size: 10pt; margin-bottom: 18px; }
    .edu-item, .exp-item { margin-bottom: 10px; }
    .edu-header, .exp-header { display: flex; justify-content: space-between; font-weight: bold; }
    .date { color: #666; font-size: 10pt; }
    .skills { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill-tag { background: #EDF1F7; color: #1E3A5F; padding: 2px 8px; border-radius: 100px; font-size: 9pt; font-family: Arial, sans-serif; }
    @page { margin: 0; } @media print { body { padding: 15mm 20mm; } }
  `;
}

function letterPrintCSS() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.8; color: #1a1a1a; padding: 25mm 30mm; }
    p { margin-bottom: 14px; } strong { font-weight: bold; }
    @page { margin: 0; } @media print { body { padding: 20mm 25mm; } }
  `;
}
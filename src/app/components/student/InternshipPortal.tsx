import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronRight, ChevronLeft, Check, FileText, Upload, X,
  Plus, Trash2, Eye, Download, User as UserIcon,
  GraduationCap, Briefcase, BookOpen, Sparkles, ArrowLeft
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
  customSection: { title: '', content: '' },
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
  body: 'As a student at the University of Zambia, I have developed strong analytical, research, and communication skills that I am eager to apply in a professional setting.',
  closing: 'I would welcome the opportunity to discuss how my background and skills can contribute to your organisation.',
  senderName: '',
  senderTitle: '',
  senderContact: '',
};

type CvTab = 'personal' | 'summary' | 'education' | 'experience' | 'skills' | 'custom' | 'languages' | 'references';

interface Application {
  appId: string;
  userId: string;
  registration: any;
  cvData: any;
  letterData: any;
  documents: Record<string, { name: string; url: string }>;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  submittedAt: string | null;
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
    </div>
  );
}

function cvPrintCSS() {
  return `body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; padding: 20px; }
    h1 { font-size: 20pt; margin: 0 0 4pt 0; color: #1E3A5F; }
    .contact { font-size: 10pt; color: #666; margin: 4pt 0 16pt 0; }
    h2 { font-size: 11pt; font-weight: bold; margin: 12pt 0 8pt 0; color: #1E3A5F; border-bottom: 1px solid #ddd; padding-bottom: 4pt; }
    .item { margin-bottom: 10pt; }
    .header { display: flex; justify-content: space-between; font-weight: 600; font-size: 10.5pt; }
    .date { color: #666; font-weight: normal; }
    .tags { display: flex; flex-wrap: wrap; gap: 8pt; margin: 8pt 0; }
    .tag { display: inline-block; background: #f0f0f0; padding: 3pt 8pt; border-radius: 12pt; font-size: 9pt; }`;
}

function letterPrintCSS() {
  return `body { font-family: 'Calibri', 'Segoe UI', sans-serif; line-height: 1.5; color: #333; padding: 40px; max-width: 600px; }
    p { margin: 0 0 12pt 0; font-size: 11pt; }
    strong { color: #1E3A5F; }`;
}

export function InternshipPortal() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [view, setView] = useState<'list' | 'form' | 'success'>('list');
  const [applications, setApplications] = useState<Application[]>([]);
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);
  const [loadingApps, setLoadingApps] = useState(true);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

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

  const [cvData, setCvData] = useState(defaultCV);
  const [cvTab, setCvTab] = useState<CvTab>('personal');
  const [letterData, setLetterData] = useState(defaultLetter);
  const [activeDoc, setActiveDoc] = useState<'cv' | 'letter'>('cv');
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; url: string }>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState('');

  useEffect(() => {
    if (token) {
      api('/internship/my', {}, token).then(data => {
        setApplications(Array.isArray(data) ? data : []);
        setLoadingApps(false);
      }).catch(() => setLoadingApps(false));
    }
  }, [token]);

  const reloadApplications = async () => {
    if (token) {
      const data = await api('/internship/my', {}, token);
      setApplications(Array.isArray(data) ? data : []);
    }
  };

  const newApplication = () => {
    setCurrentAppId(null);
    setStep(0);
    setRegForm({
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
    setCvData(defaultCV);
    setLetterData(defaultLetter);
    setUploadedDocs({});
    setView('form');
  };

  const editApplication = (app: Application) => {
    setCurrentAppId(app.appId);
    setRegForm(app.registration || regForm);
    setCvData(app.cvData || cvData);
    setLetterData(app.letterData || letterData);
    setUploadedDocs(app.documents || {});
    setView('form');
    setStep(0);
  };

  const save = async (additionalData = {}) => {
    setSaving(true);
    try {
      await api('/internship', {
        method: 'POST',
        body: JSON.stringify({ appId: currentAppId, registration: regForm, cvData, letterData, documents: uploadedDocs, ...additionalData }),
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
      await api('/internship', { method: 'POST', body: JSON.stringify({ appId: currentAppId, documents: newDocs }) }, token);
    } catch (e: any) { alert(e.message); }
    setUploading(prev => ({ ...prev, [docType]: false }));
  };

  const handleSubmitAll = async () => {
    await save({ submit: true });
    setView('success');
    setTimeout(() => reloadApplications(), 1000);
  };

  const printCV = () => {
    const d = cvData;
    const html = `<div>
      <div style="border-bottom: 2px solid #1E3A5F; padding-bottom: 16px; margin-bottom: 24px;">
        <h1>${d.personal.name || 'Your Name'}</h1>
        <p class="contact">${[d.personal.email, d.personal.phone, d.personal.city].filter(Boolean).join(' · ')}</p>
      </div>
      ${d.summary ? `<h2>Profile</h2><p style="font-size:10.5pt;margin-bottom:16px">${d.summary}</p>` : ''}
      ${d.education.length ? `<h2>Education</h2>${d.education.map(e => `<div class="item"><div class="header"><span>${e.institution}</span><span class="date">${e.startYear}–${e.endYear}</span></div><div>${e.degree}${e.field ? ` in ${e.field}` : ''}${e.grade ? ` · ${e.grade}` : ''}</div></div>`).join('')}` : ''}
      ${d.experience.length ? `<h2>Experience</h2>${d.experience.map(e => `<div class="item"><div class="header"><span>${e.role}</span><span class="date">${e.startDate}–${e.current ? 'Present' : e.endDate}</span></div><div style="color:#555;font-size:10pt">${e.company}</div>${e.description ? `<div style="margin-top:4px;font-size:10pt">${e.description}</div>` : ''}</div>`).join('')}` : ''}
      ${d.skills.length ? `<h2>Skills</h2><div class="tags">${d.skills.map(s => `<span class="tag">${s.name}${s.level ? ` — ${s.level}` : ''}</span>`).join('')}</div>` : ''}
      ${d.customSection.title ? `<h2>${d.customSection.title}</h2><p style="font-size:10.5pt">${d.customSection.content}</p>` : ''}
      ${d.languages.length ? `<h2>Languages</h2><div class="tags">${d.languages.map(l => `<span class="tag">${l.language} — ${l.level}</span>`).join('')}</div>` : ''}
      ${d.references.length ? `<h2>References</h2>${d.references.map(r => `<div class="item"><strong>${r.name}</strong><div style="font-size:10pt;color:#555">${r.title}${r.company ? `, ${r.company}` : ''}</div></div>`).join('')}` : ''}
    </div>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>CV</title><style>${cvPrintCSS()}</style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const printLetter = () => {
    const l = letterData;
    const html = `<div><p>${l.date}</p><br/><p>${l.recipientName || 'HR Manager'}</p>${l.recipientTitle ? `<p>${l.recipientTitle}</p>` : ''}${l.company ? `<p>${l.company}</p>` : ''}<br/><p><strong>Re: ${l.subject}</strong></p><br/><p>Dear ${l.recipientName ? l.recipientName.split(' ')[0] : 'Sir/Madam'},</p><br/><p>${l.opening}</p><br/><p>${l.body}</p><br/><p>${l.closing}</p><br/><br/><p>Yours sincerely,</p><br/><br/><br/><p><strong>${l.senderName}</strong></p></div>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Letter</title><style>${letterPrintCSS()}</style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  // Success screen
  if (view === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#F0FDF4' }}>
          <Check size={36} style={{ color: '#2E7D55' }} />
        </div>
        <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Application Submitted!</h2>
        <p className="text-muted-foreground leading-relaxed mb-8">Your internship application has been received. The Internship Coordinator will review your documents and contact you within 5–7 working days.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => { setView('list'); reloadApplications(); }} className="px-8 py-3 rounded-xl text-white font-semibold" style={{ background: '#1E3A5F' }}>
            View My Applications
          </button>
          <button onClick={() => navigate('/dashboard')} className="px-8 py-3 rounded-xl border border-border font-semibold text-foreground hover:bg-muted">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Applications list
  if (view === 'list') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Internship Applications</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and create new applications</p>
        </div>

        {loadingApps ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-6">No applications yet. Create your first one!</p>
            <button onClick={newApplication} className="px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2 mx-auto" style={{ background: '#1E3A5F' }}>
              <Plus size={18} /> New Application
            </button>
          </div>
        ) : (
          <div>
            <div className="grid gap-4 mb-8">
              {applications.map((app) => (
                <div key={app.appId} className="border rounded-2xl p-6 bg-white hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{app.registration?.programme || 'Application'}</h3>
                      <p className="text-sm text-muted-foreground">Created {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      app.status === 'approved' ? 'bg-green-100 text-green-700' :
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>{app.status}</span>
                  </div>
                  <button onClick={() => editApplication(app)} className="w-full px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">
                    {app.status === 'draft' ? 'Continue' : 'View'}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={newApplication} className="w-full px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2 justify-center" style={{ background: '#1E3A5F' }}>
              <Plus size={18} /> New Application
            </button>
          </div>
        )}
      </div>
    );
  }

  // Form view
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => setView('list')} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Internship Application</h1>
          <p className="text-muted-foreground text-sm mt-1">Complete all steps</p>
        </div>
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
        <div className="flex-1">
          {/* Step 0: Registration */}
          {step === 0 && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Student Registration</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Student ID" value={regForm.studentId} onChange={v => setRegForm(f => ({ ...f, studentId: v }))} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Programme</label>
                  <select value={regForm.programme} onChange={e => setRegForm(f => ({ ...f, programme: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none">
                    <option value="">Select…</option>
                    {PROGRAMMES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Year</label>
                  <select value={regForm.yearOfStudy} onChange={e => setRegForm(f => ({ ...f, yearOfStudy: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none">
                    <option value="">Select…</option>
                    {['Year 2', 'Year 3', 'Year 4'].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <Field label="Phone" value={regForm.phone} onChange={v => setRegForm(f => ({ ...f, phone: v }))} />
                <Field label="Address" value={regForm.address} onChange={v => setRegForm(f => ({ ...f, address: v }))} />
                <Field label="City" value={regForm.city} onChange={v => setRegForm(f => ({ ...f, city: v }))} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Availability</label>
                  <select value={regForm.availability} onChange={e => setRegForm(f => ({ ...f, availability: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none">
                    {['Full-time', 'Part-time', 'Weekends only'].map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <Field label="Start Date" type="date" value={regForm.startDate} onChange={v => setRegForm(f => ({ ...f, startDate: v }))} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Duration</label>
                  <select value={regForm.duration} onChange={e => setRegForm(f => ({ ...f, duration: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none">
                    {['1 month', '2 months', '3 months', '6 months'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Target Organisations</label>
                <div className="space-y-2">
                  {regForm.organisations.map((org, i) => (
                    <input key={i} value={org} onChange={e => setRegForm(f => ({ ...f, organisations: f.organisations.map((o, j) => j === i ? e.target.value : o) }))}
                      placeholder={`Organisation ${i + 1}`}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(1)} className="flex-1 px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2 justify-center" style={{ background: '#1E3A5F' }}>
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 1: CV & Letter */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="flex gap-2 mb-6 border-b pb-2">
                <button onClick={() => setActiveDoc('cv')} className={`px-4 py-2 font-medium border-b-2 ${activeDoc === 'cv' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
                  CV
                </button>
                <button onClick={() => setActiveDoc('letter')} className={`px-4 py-2 font-medium border-b-2 ${activeDoc === 'letter' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
                  Letter
                </button>
              </div>

              {activeDoc === 'cv' && (
                <div>
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {(['personal', 'summary', 'education', 'experience', 'skills', 'custom', 'languages', 'references'] as CvTab[]).map(t => (
                      <button key={t} onClick={() => setCvTab(t)} className={`px-3 py-1.5 text-sm font-medium rounded whitespace-nowrap ${cvTab === t ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>

                  {cvTab === 'personal' && (
                    <div className="grid gap-4">
                      <Field label="Name" value={cvData.personal.name} onChange={v => setCvData(d => ({ ...d, personal: { ...d.personal, name: v } }))} />
                      <Field label="Email" value={cvData.personal.email} onChange={v => setCvData(d => ({ ...d, personal: { ...d.personal, email: v } }))} />
                      <Field label="Phone" value={cvData.personal.phone} onChange={v => setCvData(d => ({ ...d, personal: { ...d.personal, phone: v } }))} />
                      <Field label="City" value={cvData.personal.city} onChange={v => setCvData(d => ({ ...d, personal: { ...d.personal, city: v } }))} />
                      <Field label="LinkedIn" value={cvData.personal.linkedin} onChange={v => setCvData(d => ({ ...d, personal: { ...d.personal, linkedin: v } }))} />
                    </div>
                  )}

                  {cvTab === 'summary' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Professional Summary</label>
                      <textarea value={cvData.summary} onChange={e => setCvData(d => ({ ...d, summary: e.target.value }))}
                        rows={4} className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
                    </div>
                  )}

                  {cvTab === 'education' && (
                    <div className="space-y-4">
                      {cvData.education.map((e, i) => (
                        <div key={i} className="border p-3 rounded-lg">
                          <Field label="Institution" value={e.institution} onChange={v => setCvData(d => ({ ...d, education: d.education.map((x, j) => j === i ? { ...x, institution: v } : x) }))} />
                          <Field label="Degree" value={e.degree} onChange={v => setCvData(d => ({ ...d, education: d.education.map((x, j) => j === i ? { ...x, degree: v } : x) }))} />
                          <button onClick={() => setCvData(d => ({ ...d, education: d.education.filter((_, j) => j !== i) }))} className="text-red-600 text-sm mt-2">Remove</button>
                        </div>
                      ))}
                      <button onClick={() => setCvData(d => ({ ...d, education: [...d.education, { institution: '', degree: '', field: '', startYear: '', endYear: '', grade: '' }] }))} className="px-4 py-2 border rounded-lg text-sm">
                        <Plus size={14} className="inline mr-1" /> Add Education
                      </button>
                    </div>
                  )}

                  {cvTab === 'experience' && (
                    <div className="space-y-4">
                      {cvData.experience.map((e, i) => (
                        <div key={i} className="border p-3 rounded-lg">
                          <Field label="Company" value={e.company} onChange={v => setCvData(d => ({ ...d, experience: d.experience.map((x, j) => j === i ? { ...x, company: v } : x) }))} />
                          <Field label="Role" value={e.role} onChange={v => setCvData(d => ({ ...d, experience: d.experience.map((x, j) => j === i ? { ...x, role: v } : x) }))} />
                          <button onClick={() => setCvData(d => ({ ...d, experience: d.experience.filter((_, j) => j !== i) }))} className="text-red-600 text-sm mt-2">Remove</button>
                        </div>
                      ))}
                      <button onClick={() => setCvData(d => ({ ...d, experience: [...d.experience, { company: '', role: '', startDate: '', endDate: '', current: false, description: '' }] }))} className="px-4 py-2 border rounded-lg text-sm">
                        <Plus size={14} className="inline mr-1" /> Add Experience
                      </button>
                    </div>
                  )}

                  {cvTab === 'skills' && (
                    <div className="space-y-4">
                      {cvData.skills.map((s, i) => (
                        <div key={i} className="border p-3 rounded-lg flex gap-2">
                          <Field label="Skill" value={s.name} onChange={v => setCvData(d => ({ ...d, skills: d.skills.map((x, j) => j === i ? { ...x, name: v } : x) }))} />
                          <button onClick={() => setCvData(d => ({ ...d, skills: d.skills.filter((_, j) => j !== i) }))} className="text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => setCvData(d => ({ ...d, skills: [...d.skills, { name: '', level: 'Intermediate' }] }))} className="px-4 py-2 border rounded-lg text-sm">
                        <Plus size={14} className="inline mr-1" /> Add Skill
                      </button>
                    </div>
                  )}

                  {cvTab === 'custom' && (
                    <div className="space-y-4">
                      <Field label="Section Title" value={cvData.customSection.title} onChange={v => setCvData(d => ({ ...d, customSection: { ...d.customSection, title: v } }))} placeholder="e.g., Certifications" />
                      <div>
                        <label className="block text-sm font-medium mb-2">Content</label>
                        <textarea value={cvData.customSection.content} onChange={e => setCvData(d => ({ ...d, customSection: { ...d.customSection, content: e.target.value } }))}
                          rows={4} className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
                      </div>
                    </div>
                  )}

                  {cvTab === 'languages' && (
                    <div className="space-y-4">
                      {cvData.languages.map((l, i) => (
                        <div key={i} className="border p-3 rounded-lg flex gap-2">
                          <Field label="Language" value={l.language} onChange={v => setCvData(d => ({ ...d, languages: d.languages.map((x, j) => j === i ? { ...x, language: v } : x) }))} />
                          <button onClick={() => setCvData(d => ({ ...d, languages: d.languages.filter((_, j) => j !== i) }))} className="text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => setCvData(d => ({ ...d, languages: [...d.languages, { language: '', level: 'Fluent' }] }))} className="px-4 py-2 border rounded-lg text-sm">
                        <Plus size={14} className="inline mr-1" /> Add Language
                      </button>
                    </div>
                  )}

                  {cvTab === 'references' && (
                    <div className="space-y-4">
                      {cvData.references.map((r, i) => (
                        <div key={i} className="border p-3 rounded-lg">
                          <Field label="Name" value={r.name} onChange={v => setCvData(d => ({ ...d, references: d.references.map((x, j) => j === i ? { ...x, name: v } : x) }))} />
                          <button onClick={() => setCvData(d => ({ ...d, references: d.references.filter((_, j) => j !== i) }))} className="text-red-600 text-sm mt-2">Remove</button>
                        </div>
                      ))}
                      <button onClick={() => setCvData(d => ({ ...d, references: [...d.references, { name: '', title: '', company: '', phone: '', email: '' }] }))} className="px-4 py-2 border rounded-lg text-sm">
                        <Plus size={14} className="inline mr-1" /> Add Reference
                      </button>
                    </div>
                  )}

                  <button onClick={printCV} className="w-full px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted mt-6 flex items-center gap-2 justify-center">
                    <Download size={14} /> Preview CV
                  </button>
                </div>
              )}

              {activeDoc === 'letter' && (
                <div className="space-y-4">
                  <Field label="Recipient Name" value={letterData.recipientName} onChange={v => setLetterData(d => ({ ...d, recipientName: v }))} />
                  <Field label="Company" value={letterData.company} onChange={v => setLetterData(d => ({ ...d, company: v }))} />
                  <div>
                    <label className="block text-sm font-medium mb-2">Letter Body</label>
                    <textarea value={letterData.body} onChange={e => setLetterData(d => ({ ...d, body: e.target.value }))}
                      rows={4} className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
                  </div>
                  <button onClick={printLetter} className="w-full px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted flex items-center gap-2 justify-center">
                    <Download size={14} /> Preview Letter
                  </button>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(0)} className="px-6 py-3 rounded-xl border border-border text-foreground font-semibold flex items-center gap-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={() => { save(); setStep(2); }} className="flex-1 px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2 justify-center" style={{ background: '#1E3A5F' }}>
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Upload Documents</h2>
              <div className="space-y-4">
                {DOC_TYPES.map(({ key, label, required }) => (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-sm">{label} {required && <span className="text-red-500">*</span>}</label>
                      {uploadedDocs[key] && <Check size={16} className="text-green-500" />}
                    </div>
                    {uploadedDocs[key] ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText size={14} /> {uploadedDocs[key].name}
                        <button onClick={() => { const d = { ...uploadedDocs }; delete d[key]; setUploadedDocs(d); }} className="ml-auto text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setActiveUploadType(key); fileInputRef.current?.click(); }} disabled={uploading[key]}
                        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border hover:border-primary text-sm font-medium text-muted-foreground">
                        <Upload size={14} /> {uploading[key] ? 'Uploading...' : 'Choose file'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <input ref={fileInputRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(activeUploadType, e.target.files[0]); }} />

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-border text-foreground font-semibold flex items-center gap-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={handleSubmitAll} disabled={saving} className="flex-1 px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2 justify-center" style={{ background: '#1E3A5F' }}>
                  {saving ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
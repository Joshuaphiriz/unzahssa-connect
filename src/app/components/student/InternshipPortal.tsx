import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import { 
  CheckCircle, Upload, FileText, Download, Edit, 
  Eye, User, BookOpen, Calendar, Phone, Mail, 
  Building, Award, Check, ChevronRight, ChevronLeft,
  X, Plus
} from 'lucide-react';

export function InternshipPortal() {
  const { user, token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [application, setApplication] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Registration form
  const [regForm, setRegForm] = useState({
    fullName: '',
    studentNumber: '',
    programme: '',
    yearOfStudy: '',
    email: '',
    phone: '',
    affiliation: 'Non-Affiliated',
    affiliationNumber: '',
    targetInstitutions: [] as string[],
    institutionInput: '',
  });
  
  // CV & Letter
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [cvPreview, setCvPreview] = useState<string>('');
  const [letterPreview, setLetterPreview] = useState<string>('');
  
  // Documents
  const [documents, setDocuments] = useState<any[]>([]);
  const [docType, setDocType] = useState('NATIONAL_REGISTRATION_CARD');
  const [docFile, setDocFile] = useState<File | null>(null);

  const DOC_TYPES = [
    'NATIONAL_REGISTRATION_CARD',
    'ACADEMIC_TRANSCRIPT',
    'PROFESSIONAL_CERTIFICATE',
    'LETTER_OF_RECOMMENDATION',
    'OTHER'
  ];

  const DOC_LABELS: Record<string, string> = {
    'NATIONAL_REGISTRATION_CARD': 'National Registration Card (NRC)',
    'ACADEMIC_TRANSCRIPT': 'Academic Transcript',
    'PROFESSIONAL_CERTIFICATE': 'Professional Certificate',
    'LETTER_OF_RECOMMENDATION': 'Letter of Recommendation',
    'OTHER': 'Other Document'
  };

  useEffect(() => {
    Promise.all([
      api('/programmes', { method: 'GET' }),
      api('/internship/my', {}, token),
    ]).then(([progs, app]) => {
      setProgrammes(progs || []);
      setApplication(app);
      if (app && app.status !== 'draft') {
        setRegForm({
          fullName: app.fullName || user?.user_metadata?.name || '',
          studentNumber: app.studentNumber || '',
          programme: app.programme || '',
          yearOfStudy: app.yearOfStudy || '',
          email: app.email || user?.email || '',
          phone: app.phone || '',
          affiliation: app.affiliation || 'Non-Affiliated',
          affiliationNumber: app.affiliationNumber || '',
          targetInstitutions: app.targetInstitutions || [],
          institutionInput: '',
        });
        setDocuments(app.documents || []);
      }
      setLoading(false);
    }).catch(console.error);
  }, [token, user]);

  const setReg = (k: string, v: any) => setRegForm(f => ({ ...f, [k]: v }));

  const addInstitution = () => {
    if (regForm.institutionInput.trim() && !regForm.targetInstitutions.includes(regForm.institutionInput.trim())) {
      setRegForm(f => ({
        ...f,
        targetInstitutions: [...f.targetInstitutions, f.institutionInput.trim()],
        institutionInput: ''
      }));
    }
  };

  const removeInstitution = (inst: string) => {
    setRegForm(f => ({
      ...f,
      targetInstitutions: f.targetInstitutions.filter(i => i !== inst)
    }));
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...regForm, submit: false };
    await api('/internship', { method: 'POST', body: JSON.stringify(payload) }, token);
    setIsEditing(false);
    const updated = await api('/internship/my', {}, token);
    setApplication(updated);
    setStep(2);
  };

  const handleCVLetterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Upload CV and Letter
    // For now, mark as complete
    setStep(3);
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;
    const formData = new FormData();
    formData.append('file', docFile);
    formData.append('type', docType);
    await api('/documents/upload', { method: 'POST', body: formData }, token);
    const updated = await api('/internship/my', {}, token);
    setDocuments(updated.documents || []);
    setDocFile(null);
  };

  const isStepComplete = (stepNum: number) => {
    if (stepNum === 1) {
      return regForm.fullName && regForm.studentNumber && regForm.programme && regForm.yearOfStudy;
    }
    if (stepNum === 2) {
      return application?.cv || cvFile;
    }
    if (stepNum === 3) {
      return documents.length >= 2; // At least 2 documents
    }
    return false;
  };

  const allStepsComplete = isStepComplete(1) && isStepComplete(2) && isStepComplete(3);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Student Internship Portal</h1>
      <p className="text-gray-500 mb-6">Complete all three sections to submit your internship application.</p>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s < step ? 'bg-green-500 text-white' : 
                s === step ? 'bg-blue-600 text-white' : 
                'bg-gray-200 text-gray-500'
              }`}>
                {s < step ? <Check size={18} /> : s}
              </div>
              <span className="text-[10px] mt-1 text-gray-500">
                {s === 1 ? 'Register' : s === 2 ? 'CV & Letter' : 'Documents'}
              </span>
            </div>
            {s < 3 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all ${s < step ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Register */}
      {step === 1 && (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Student Registration</h2>
          <form onSubmit={handleRegistrationSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={regForm.fullName}
                  onChange={e => setReg('fullName', e.target.value)}
                  required
                  placeholder="e.g. Grace Tembo"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Computer / Student Number</label>
                <input
                  type="text"
                  value={regForm.studentNumber}
                  onChange={e => setReg('studentNumber', e.target.value)}
                  required
                  placeholder="e.g. 2022010000"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Academic Programme</label>
                <select
                  value={regForm.programme}
                  onChange={e => setReg('programme', e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select programme</option>
                  {programmes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year of Study</label>
                <select
                  value={regForm.yearOfStudy}
                  onChange={e => setReg('yearOfStudy', e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select year</option>
                  <option>Year 1</option><option>Year 2</option><option>Year 3</option>
                  <option>Year 4</option><option>Year 5</option><option>Postgraduate</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={regForm.email}
                  onChange={e => setReg('email', e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={regForm.phone}
                  onChange={e => setReg('phone', e.target.value)}
                  placeholder="+260 9XX XXX XXX"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">UNZAHSSA Affiliation</label>
                <select
                  value={regForm.affiliation}
                  onChange={e => setReg('affiliation', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Non-Affiliated">Non-Affiliated</option>
                  <option value="Affiliated Member">Affiliated Member</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Affiliation Number (optional)</label>
                <input
                  type="text"
                  value={regForm.affiliationNumber}
                  onChange={e => setReg('affiliationNumber', e.target.value)}
                  placeholder="UNZAHSSA-2024-001"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Institutions / Organisations</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={regForm.institutionInput}
                  onChange={e => setReg('institutionInput', e.target.value)}
                  placeholder="Type an organisation name and press Enter"
                  className="flex-1 px-3 py-2 border rounded-lg"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInstitution())}
                />
                <button type="button" onClick={addInstitution} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {regForm.targetInstitutions.map(inst => (
                  <span key={inst} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-sm">
                    {inst}
                    <button type="button" onClick={() => removeInstitution(inst)} className="text-red-500"><X size={14} /></button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!isStepComplete(1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: CV & Letter */}
      {step === 2 && (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">CV & Application Letter</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Upload CV</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="cv-upload"
                />
                <label htmlFor="cv-upload" className="cursor-pointer">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload CV</p>
                  {cvFile && <p className="text-sm text-green-600 mt-2">{cvFile.name}</p>}
                  {application?.cv && !cvFile && <p className="text-sm text-gray-400 mt-2">Current: {application.cv}</p>}
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Upload Application Letter</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setLetterFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="letter-upload"
                />
                <label htmlFor="letter-upload" className="cursor-pointer">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload Letter</p>
                  {letterFile && <p className="text-sm text-green-600 mt-2">{letterFile.name}</p>}
                  {application?.applicationLetter && !letterFile && <p className="text-sm text-gray-400 mt-2">Current: {application.applicationLetter}</p>}
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!isStepComplete(2)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Documents */}
      {step === 3 && (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Documents</h2>
          
          {/* Required documents checklist */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="font-medium mb-2">All required documents uploaded!</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className={documents.some(d => d.type === 'NATIONAL_REGISTRATION_CARD') ? 'text-green-500' : 'text-gray-300'} />
                <span className={documents.some(d => d.type === 'NATIONAL_REGISTRATION_CARD') ? 'text-gray-700' : 'text-gray-400'}>
                  National Registration Card (NRC)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className={documents.some(d => d.type === 'ACADEMIC_TRANSCRIPT') ? 'text-green-500' : 'text-gray-300'} />
                <span className={documents.some(d => d.type === 'ACADEMIC_TRANSCRIPT') ? 'text-gray-700' : 'text-gray-400'}>
                  Academic Transcript
                </span>
              </div>
            </div>
          </div>

          {/* Upload new document */}
          <form onSubmit={handleDocumentUpload} className="mb-6 p-4 border rounded-lg">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {DOC_TYPES.map(type => (
                    <option key={type} value={type}>{DOC_LABELS[type]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select File</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.png,.doc"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <button
                    type="submit"
                    disabled={!docFile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  >
                    <Upload size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Files are automatically named: [Your_Name]-[DOC_TYPE]. Accepted formats: PDF, JPG, PNG, DOC.
                </p>
              </div>
            </div>
          </form>

          {/* Uploaded documents list */}
          <div>
            <h3 className="font-semibold mb-3">Uploaded Documents ({documents.length})</h3>
            <div className="space-y-2">
              {documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{doc.name || `${regForm.fullName.replace(/\s+/g, '_')}-${doc.type}`}</p>
                    <p className="text-sm text-gray-500">{DOC_LABELS[doc.type] || doc.type}</p>
                  </div>
                  <a href={doc.url} download className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                    <Download size={14} /> Download
                  </a>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-gray-400 text-center py-4">No documents uploaded yet</p>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2"
            >
              <ChevronLeft size={16} /> Back
            </button>
            {allStepsComplete && (
              <button
                type="button"
                onClick={() => alert('Application submitted successfully!')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
              >
                <Check size={16} /> Submit Application
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
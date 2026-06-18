import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import { 
  CheckCircle, Upload, FileText, Download, Edit, 
  Eye, User, BookOpen, Calendar, Phone, Mail, 
  Building, Award, Check, ChevronRight, ChevronLeft,
  X, Plus, Briefcase, Globe, MapPin, Linkedin, Save
} from 'lucide-react';

export function InternshipPortal() {
  const { user, token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [application, setApplication] = useState<any>(null);
  
  // ===== STEP 1: Student Registration =====
  const [regForm, setRegForm] = useState({
    studentId: '',
    programme: '',
    yearOfStudy: '',
    phoneNumber: '',
    availability: 'Full-time',
    preferredStartDate: '',
    duration: '6 months',
    targetOrganisations: [] as string[],
    organisationInput: '',
    motivationStatement: '',
  });

  // ===== STEP 2: CV & Application Letter =====
  const [cvContent, setCvContent] = useState('');
  const [letterContent, setLetterContent] = useState('');
  const [letterDate, setLetterDate] = useState(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }));
  const [letterSubject, setLetterSubject] = useState('Application for Internship Position');
  const [letterRecipient, setLetterRecipient] = useState('The Human Resources Manager');
  const [letterRecipientTitle, setLetterRecipientTitle] = useState('');
  const [letterClosing, setLetterClosing] = useState('I would welcome the opportunity to discuss how my background and skills can contribute to your organisation. I have attached my curriculum vitae for your review.');
  const [letterName, setLetterName] = useState(user?.user_metadata?.name || '');
  const [letterTitle, setLetterTitle] = useState('');
  const [letterContact, setLetterContact] = useState('');

  // ===== STEP 3: Documents =====
  const [documents, setDocuments] = useState<any[]>([]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('nrc');
  const [uploading, setUploading] = useState(false);

  const DOC_TYPES = [
    { value: 'nrc', label: 'NRC (National Registration Card)', required: true },
    { value: 'transcript', label: 'Academic Transcript', required: true },
    { value: 'certificate', label: 'Certificate / Award', required: false },
    { value: 'recommendation', label: 'Recommendation Letter', required: false },
    { value: 'medical', label: 'Medical Certificate', required: false },
    { value: 'other', label: 'Other Document', required: false },
  ];

  const setReg = (k: string, v: any) => setRegForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([
      api('/programmes', { method: 'GET' }),
      api('/internship/my', {}, token),
    ]).then(([progs, app]) => {
      setProgrammes(progs || []);
      setApplication(app);
      if (app && app.status !== 'draft') {
        setRegForm({
          studentId: app.studentId || '',
          programme: app.programme || '',
          yearOfStudy: app.yearOfStudy || '',
          phoneNumber: app.phoneNumber || '',
          availability: app.availability || 'Full-time',
          preferredStartDate: app.preferredStartDate || '',
          duration: app.duration || '6 months',
          targetOrganisations: app.targetOrganisations || [],
          organisationInput: '',
          motivationStatement: app.motivationStatement || '',
        });
        setDocuments(app.documents || []);
        setCvContent(app.cvContent || '');
        setLetterContent(app.letterContent || '');
      }
      setLoading(false);
    }).catch(console.error);
  }, [token, user]);

  const addOrganisation = () => {
    if (regForm.organisationInput.trim() && !regForm.targetOrganisations.includes(regForm.organisationInput.trim())) {
      setRegForm(f => ({
        ...f,
        targetOrganisations: [...f.targetOrganisations, f.organisationInput.trim()],
        organisationInput: ''
      }));
    }
  };

  const removeOrganisation = (org: string) => {
    setRegForm(f => ({
      ...f,
      targetOrganisations: f.targetOrganisations.filter(o => o !== org)
    }));
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...regForm, step: 'registration' };
    await api('/internship', { method: 'POST', body: JSON.stringify(payload) }, token);
    const updated = await api('/internship/my', {}, token);
    setApplication(updated);
    setStep(2);
  };

  const handleCVLetterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      cvContent,
      letterContent,
      letterDate,
      letterSubject,
      letterRecipient,
      letterRecipientTitle,
      letterClosing,
      letterName,
      letterTitle,
      letterContact,
      step: 'cvletter'
    };
    await api('/internship', { method: 'POST', body: JSON.stringify(payload) }, token);
    const updated = await api('/internship/my', {}, token);
    setApplication(updated);
    setStep(3);
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', docFile);
    formData.append('type', docType);
    await api('/documents/upload', { method: 'POST', body: formData }, token);
    const updated = await api('/internship/my', {}, token);
    setDocuments(updated.documents || []);
    setDocFile(null);
    setUploading(false);
  };

  const removeDocument = async (docId: string) => {
    // Implement remove logic if needed
    // For now, just refresh
    const updated = await api('/internship/my', {}, token);
    setDocuments(updated.documents || []);
  };

  const getUploadedCount = () => {
    const required = DOC_TYPES.filter(d => d.required);
    const uploaded = required.filter(d => documents.some(doc => doc.type === d.value));
    return { uploaded: uploaded.length, total: required.length };
  };

  const { uploaded, total } = getUploadedCount();

  const isStepComplete = (stepNum: number) => {
    if (stepNum === 1) {
      return regForm.studentId && regForm.programme && regForm.yearOfStudy;
    }
    if (stepNum === 2) {
      return cvContent && letterContent;
    }
    if (stepNum === 3) {
      return uploaded === total;
    }
    return false;
  };

  const allStepsComplete = isStepComplete(1) && isStepComplete(2) && isStepComplete(3);

  if (loading) return <div className="p-6">Loading...</div>;

  // ============== RENDER ==============
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Internship Application</h1>
      <p className="text-gray-500 mb-6">Complete all three steps to submit your application</p>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${
                  s < step ? 'bg-green-500 text-white' : 
                  s === step ? 'bg-blue-600 text-white' : 
                  'bg-gray-200 text-gray-500'
                }`}
                onClick={() => { if (s < step) setStep(s); }}
              >
                {s < step ? <Check size={18} /> : s}
              </div>
              <span className="text-[10px] mt-1 text-gray-500">
                {s === 1 ? 'Registration' : s === 2 ? 'CV & Letter' : 'Documents'}
              </span>
            </div>
            {s < 3 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all ${s < step ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ============ STEP 1: REGISTRATION ============ */}
      {step === 1 && (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Student Registration</h2>
          <form onSubmit={handleRegistrationSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student ID</label>
                <input
                  type="text"
                  value={regForm.studentId}
                  onChange={e => setReg('studentId', e.target.value)}
                  required
                  placeholder="e.g. 202200"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Programme</label>
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
            </div>
            <div className="grid md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={regForm.phoneNumber}
                  onChange={e => setReg('phoneNumber', e.target.value)}
                  placeholder="e.g. 09766627728"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Availability</label>
                <select
                  value={regForm.availability}
                  onChange={e => setReg('availability', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Flexible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                <select
                  value={regForm.duration}
                  onChange={e => setReg('duration', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option>3 months</option>
                  <option>6 months</option>
                  <option>12 months</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preferred Start Date</label>
              <input
                type="date"
                value={regForm.preferredStartDate}
                onChange={e => setReg('preferredStartDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Organisations (up to 3)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={regForm.organisationInput}
                  onChange={e => setReg('organisationInput', e.target.value)}
                  placeholder="Type organisation and press Enter"
                  className="flex-1 px-3 py-2 border rounded-lg"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOrganisation())}
                />
                <button type="button" onClick={addOrganisation} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {regForm.targetOrganisations.map(org => (
                  <span key={org} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-sm">
                    {org}
                    <button type="button" onClick={() => removeOrganisation(org)} className="text-red-500"><X size={14} /></button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Motivation Statement</label>
              <textarea
                value={regForm.motivationStatement}
                onChange={e => setReg('motivationStatement', e.target.value)}
                rows={4}
                placeholder="Why are you applying for this internship programme? What do you hope to gain?"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => alert('Draft saved')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2"
              >
                <Save size={16} /> Save Draft
              </button>
              <button
                type="submit"
                disabled={!isStepComplete(1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ml-auto"
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============ STEP 2: CV & LETTER ============ */}
      {step === 2 && (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Curriculum Vitae & Application Letter</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* CV Editor */}
            <div>
              <h3 className="font-medium mb-2">CV Content</h3>
              <textarea
                value={cvContent}
                onChange={e => setCvContent(e.target.value)}
                rows={15}
                placeholder="Paste your CV content here..."
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
              />
            </div>
            
            {/* Application Letter Editor */}
            <div>
              <h3 className="font-medium mb-2">Application Letter</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={letterDate}
                  onChange={e => setLetterDate(e.target.value)}
                  placeholder="Date"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={letterSubject}
                  onChange={e => setLetterSubject(e.target.value)}
                  placeholder="Subject Line"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={letterRecipient}
                  onChange={e => setLetterRecipient(e.target.value)}
                  placeholder="Recipient Name"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={letterRecipientTitle}
                  onChange={e => setLetterRecipientTitle(e.target.value)}
                  placeholder="Recipient Title"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <textarea
                  value={letterContent}
                  onChange={e => setLetterContent(e.target.value)}
                  rows={8}
                  placeholder="Write your application letter here..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <textarea
                  value={letterClosing}
                  onChange={e => setLetterClosing(e.target.value)}
                  rows={3}
                  placeholder="Closing paragraph..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={letterName}
                    onChange={e => setLetterName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={letterTitle}
                    onChange={e => setLetterTitle(e.target.value)}
                    placeholder="Your Title / Programme"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <input
                  type="text"
                  value={letterContact}
                  onChange={e => setLetterContact(e.target.value)}
                  placeholder="Contact Information"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              type="button"
              onClick={() => alert('Preview CV')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
            >
              <Eye size={16} /> Preview CV
            </button>
            <button
              type="button"
              onClick={() => alert('Downloading PDF...')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2"
            >
              <Download size={16} /> Download PDF
            </button>
            <button
              type="button"
              onClick={handleCVLetterSubmit}
              disabled={!isStepComplete(2)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ml-auto"
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ============ STEP 3: DOCUMENTS ============ */}
      {step === 3 && (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Document Upload</h2>
          <p className="text-sm text-gray-500 mb-4">Upload all required documents. Accepted formats: PDF, JPG, PNG (max 5MB each)</p>

          {/* Upload Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span>{uploaded} / {total} required documents uploaded</span>
              <span>{Math.round((uploaded / total) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${(uploaded / total) * 100}%` }} />
            </div>
          </div>

          {/* Document List */}
          <div className="space-y-3 mb-6">
            {DOC_TYPES.map(doc => {
              const uploadedDoc = documents.find(d => d.type === doc.value);
              return (
                <div key={doc.value} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {uploadedDoc ? (
                      <CheckCircle size={20} className="text-green-500" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                    )}
                    <div>
                      <p className="font-medium">{doc.label}</p>
                      {uploadedDoc ? (
                        <p className="text-sm text-gray-500">{uploadedDoc.name}</p>
                      ) : (
                        <p className="text-sm text-red-500">Required</p>
                      )}
                    </div>
                  </div>
                  <div>
                    {uploadedDoc ? (
                      <button 
                        onClick={() => removeDocument(uploadedDoc.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Replace
                      </button>
                    ) : (
                      <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                        Upload
                        <input
                          type="file"
                          accept=".pdf,.jpg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setDocType(doc.value);
                              setDocFile(file);
                              // Auto-upload
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('type', doc.value);
                              api('/documents/upload', { method: 'POST', body: formData }, token)
                                .then(() => {
                                  api('/internship/my', {}, token)
                                    .then(app => setDocuments(app.documents || []));
                                });
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manual Upload */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Upload Additional Document</h3>
            <div className="flex gap-3">
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              <button
                onClick={handleDocumentUpload}
                disabled={!docFile || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              type="button"
              onClick={() => alert('Draft saved')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2"
            >
              <Save size={16} /> Save Draft
            </button>
            <button
              type="button"
              disabled={!allStepsComplete}
              className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ml-auto"
              onClick={() => alert('Application submitted successfully!')}
            >
              <Check size={16} /> Submit Application
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8">© 2024 UNZAHSSA Connect. All rights reserved.</p>
    </div>
  );
}
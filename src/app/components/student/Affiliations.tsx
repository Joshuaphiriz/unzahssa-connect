import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Clock, CreditCard, Smartphone, X, DollarSign } from 'lucide-react';
import { useAuth } from '../shared/AuthContext';
import { useBranding } from '../shared/BrandingContext';
import { api } from '../shared/api';

interface Payment { id: string; method: string; reference: string; amount: number; status: string; submittedAt: string; }

const STATUS_DISPLAY: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  approved: { label: 'Affiliated Member', color: '#2E7D55', bg: '#F0FDF4', icon: CheckCircle },
  pending: { label: 'Pending Approval', color: '#D4A33D', bg: '#FFFBEB', icon: Clock },
  not_affiliated: { label: 'Not Affiliated', color: '#C0392B', bg: '#FEF2F2', icon: AlertTriangle },
  rejected: { label: 'Payment Rejected', color: '#C0392B', bg: '#FEF2F2', icon: AlertTriangle },
};

export function Affiliations() {
  const { user, token } = useAuth();
  const { branding } = useBranding();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [method, setMethod] = useState<'mtn' | 'airtel' | 'cash'>('mtn');
  const [reference, setReference] = useState('');
  const [payerNumber, setPayerNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadPayments = async () => {
    try { setPayments(await api('/payments', {}, token)); } catch (e) { console.log(e); }
    setLoading(false);
  };

  useEffect(() => { if (token) loadPayments(); }, [token]);

  const latestApproved = payments.find(p => p.status === 'approved');
  const latestPending = payments.find(p => p.status === 'pending');
  const overallStatus = latestApproved ? 'approved' : latestPending ? 'pending' : 'not_affiliated';
  const statusInfo = STATUS_DISPLAY[overallStatus];
  const StatusIcon = statusInfo.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!reference.trim()) { setError('Please enter a transaction reference.'); return; }
    if ((method === 'mtn' || method === 'airtel') && !payerNumber.trim()) { setError('Please enter the payer number.'); return; }
    setSubmitting(true);
    try {
      await api('/payments', { method: 'POST', body: JSON.stringify({ method, reference, payerNumber: method !== 'cash' ? payerNumber : null }) }, token);
      await loadPayments();
      setShowModal(false);
      setReference(''); setPayerNumber('');
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    }
    setSubmitting(false);
  };

  const formatDate = (ts: string) => new Date(ts).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusBadge = (s: string) => {
    const d = STATUS_DISPLAY[s] || STATUS_DISPLAY.not_affiliated;
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: d.bg, color: d.color }}>
        {d.label}
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Affiliation Status</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your UNZAHSSA membership and affiliation</p>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-6" style={{ borderLeft: `4px solid ${statusInfo.color}` }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: statusInfo.bg }}>
              <StatusIcon size={28} style={{ color: statusInfo.color }} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-0.5">Affiliation Status</p>
              <p className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: statusInfo.color }}>
                {statusInfo.label}
              </p>
              {overallStatus === 'approved' && latestApproved && (
                <p className="text-xs text-muted-foreground mt-0.5">Approved on {formatDate(latestApproved.submittedAt)}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Affiliation Fee</p>
            <p className="text-2xl font-bold" style={{ color: '#1E3A5F', fontFamily: 'Playfair Display, serif' }}>
              ZMW {branding.affiliationFee}
            </p>
          </div>
        </div>

        {overallStatus === 'approved' && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            {['Academic Support', 'Career Guidance', 'Event Access'].map(b => (
              <div key={b} className="text-center p-3 rounded-xl" style={{ background: '#F0FDF4' }}>
                <CheckCircle size={18} className="mx-auto mb-1" style={{ color: '#2E7D55' }} />
                <p className="text-xs font-medium" style={{ color: '#2E7D55' }}>{b}</p>
              </div>
            ))}
          </div>
        )}

        {(overallStatus === 'not_affiliated' || overallStatus === 'rejected') && (
          <div className="mt-5">
            <button onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1E3A5F, #2A4F7A)' }}>
              Pay Affiliation Fee — ZMW {branding.affiliationFee}
            </button>
          </div>
        )}

        {overallStatus === 'pending' && (
          <div className="mt-4 p-4 rounded-xl text-sm" style={{ background: '#FFFBEB', color: '#92400E' }}>
            Your payment is under review. The treasurer will verify your payment within 24–48 hours.
          </div>
        )}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>Payment History</h2>
          </div>
          <div className="divide-y divide-border">
            {payments.map(p => (
              <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground capitalize">{p.method === 'mtn' ? 'MTN Mobile Money' : p.method === 'airtel' ? 'Airtel Money' : 'Cash Payment'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Ref: {p.reference} · {formatDate(p.submittedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">ZMW {p.amount}</span>
                  {statusBadge(p.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif', color: '#1E3A5F' }}>Pay Affiliation Fee</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-muted"><X size={16} /></button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl mb-5" style={{ background: '#EDF1F7' }}>
              <span className="text-sm font-medium text-muted-foreground">Amount Due</span>
              <span className="text-xl font-bold" style={{ color: '#1E3A5F' }}>ZMW {branding.affiliationFee}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: 'mtn', label: 'MTN Money', icon: '📱' },
                    { key: 'airtel', label: 'Airtel Money', icon: '📱' },
                    { key: 'cash', label: 'Cash', icon: '💵' },
                  ] as const).map(m => (
                    <button key={m.key} type="button" onClick={() => setMethod(m.key)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${method === m.key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                      <span className="text-xl block mb-1">{m.icon}</span>
                      <span className="text-xs font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(method === 'mtn' || method === 'airtel') && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Mobile Number Used</label>
                  <div className="relative">
                    <Smartphone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="tel" value={payerNumber} onChange={e => setPayerNumber(e.target.value)}
                      placeholder="+260 9XX XXX XXX"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {method === 'cash' ? 'Receipt / Cash Reference' : 'Transaction Reference Number'}
                </label>
                <div className="relative">
                  <CreditCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={reference} onChange={e => setReference(e.target.value)}
                    placeholder={method === 'cash' ? 'e.g. RCPT-20240315-001' : 'e.g. P250316ABCD12'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none" />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <p className="text-xs text-muted-foreground bg-muted p-3 rounded-xl">
                After submission, your payment will be verified by the treasurer. You will be notified once your affiliation is approved.
              </p>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                  style={{ background: '#1E3A5F' }}>
                  {submitting ? 'Submitting…' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

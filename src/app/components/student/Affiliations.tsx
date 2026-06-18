import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import { useBranding } from '../shared/BrandingContext';
import { CheckCircle, Clock, XCircle, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Affiliations() {
  const { user, token } = useAuth();
  const { branding } = useBranding();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    method: 'MTN',
    reference: '',
    payerNumber: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const fetchPayments = () => {
    api('/payments', {}, token)
      .then(setPayments)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) fetchPayments();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api('/payments', { method: 'POST', body: JSON.stringify(form) }, token);
      setSuccess('Payment submitted successfully! Awaiting confirmation.');
      setForm({ method: 'MTN', reference: '', payerNumber: '' });
      fetchPayments();
    } catch (err: any) {
      setError(err.message || 'Payment submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="flex items-center gap-1 text-green-600"><CheckCircle size={16} /> Approved</span>;
      case 'pending': return <span className="flex items-center gap-1 text-yellow-600"><Clock size={16} /> Pending</span>;
      case 'rejected': return <span className="flex items-center gap-1 text-red-600"><XCircle size={16} /> Rejected</span>;
      default: return <span className="text-gray-400">{status}</span>;
    }
  };

  const generateReceiptNumber = () => {
    const prefix = 'UNZ';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const downloadReceipt = (payment: any) => {
    const receiptNo = generateReceiptNumber();
    const doc = new jsPDF();

    // Add logo (UNZAHSSA logo) – top right corner
    try {
      const logoUrl = '/unzahssa-logo.jpg';
      doc.addImage(logoUrl, 'JPEG', 160, 10, 35, 20);
    } catch (e) {
      console.log('Logo not found, continuing without it');
    }

    doc.setFontSize(18);
    doc.text('UNZAHSSA Connect – Payment Receipt', 14, 20);
    doc.setFontSize(10);
    doc.text(`Receipt No: ${receiptNo}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 36);
    doc.text(`Student: ${payment.userName} (${payment.userEmail})`, 14, 42);
    doc.text(`Student ID: ${payment.studentId || 'N/A'}`, 14, 48);
    doc.text(`Programme: ${payment.programme || 'N/A'}`, 14, 54);
    autoTable(doc, {
      head: [['Description', 'Amount']],
      body: [
        ['Affiliation Fee', `ZMW ${payment.amount}`],
        ['Reference', payment.reference],
        ['Payment Method', payment.method],
      ],
      startY: 62,
    });
    const finalY = (doc as any).lastAutoTable?.finalY || 70;
    doc.text('Thank you for affiliating with UNZAHSSA.', 14, finalY + 10);
    doc.save(`receipt_${receiptNo}.pdf`);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const latestPayment = payments.length > 0 ? payments[0] : null;
  const isAffiliated = latestPayment?.status === 'approved';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Affiliations</h1>
      <p className="text-gray-500 mb-6">
        Affiliation Fee: <span className="font-semibold">ZMW {branding.affiliationFee || 50}</span>
      </p>

      {/* Status Card */}
      {latestPayment && (
        <div className={`p-4 rounded-xl mb-6 border ${
          isAffiliated ? 'bg-green-50 border-green-200' : 
          latestPayment.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : 
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium">Current Affiliation Status</p>
              <div className="mt-1">{getStatusBadge(latestPayment.status)}</div>
            </div>
            {isAffiliated && (
              <button 
                onClick={() => downloadReceipt(latestPayment)} 
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                <Download size={14} /> Download Receipt
              </button>
            )}
          </div>
          {latestPayment.status === 'approved' && (
            <p className="text-sm text-green-600 mt-2">You are affiliated. You can download your receipt above.</p>
          )}
          {latestPayment.status === 'pending' && (
            <p className="text-sm text-yellow-600 mt-2">Your payment is being reviewed. You will receive a receipt once approved.</p>
          )}
          {latestPayment.status === 'rejected' && (
            <p className="text-sm text-red-600 mt-2">Your payment was rejected. Please submit a new payment.</p>
          )}
        </div>
      )}

      {/* Submit Payment Form */}
      {!isAffiliated && (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Submit Affiliation Payment</h2>
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <select value={form.method} onChange={e => set('method', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                <option value="MTN">MTN Mobile Money</option>
                <option value="AIRTEL">Airtel Money</option>
                <option value="ZANACO">ZANACO</option>
                <option value="CASH">Cash (in person)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reference Number</label>
              <input
                type="text"
                value={form.reference}
                onChange={e => set('reference', e.target.value)}
                required
                placeholder="e.g. MTN-2026-001"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payer Phone Number</label>
              <input
                type="text"
                value={form.payerNumber}
                onChange={e => set('payerNumber', e.target.value)}
                placeholder="e.g. 0977123456"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting} 
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </form>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Payment History</h2>
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Method</th>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">ZMW {p.amount}</td>
                    <td className="px-4 py-2">{p.method}</td>
                    <td className="px-4 py-2 text-sm">{p.reference}</td>
                    <td className="px-4 py-2">{getStatusBadge(p.status)}</td>
                    <td className="px-4 py-2 text-sm">{new Date(p.submittedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      {p.status === 'approved' && (
                        <button onClick={() => downloadReceipt(p)} className="text-blue-600 hover:text-blue-800 text-sm">
                          <Download size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
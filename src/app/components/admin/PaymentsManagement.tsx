import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PaymentsManagement() {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPayments = () => {
    api('/payments', {}, token)
      .then(setPayments)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) fetchPayments();
  }, [token]);

  const updateStatus = async (id: string, status: string) => {
    setProcessing(id);
    try {
      await api(`/payments/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }, token);
      if (status === 'approved') {
        alert('Receipt sent to student email (demo).');
      }
      fetchPayments();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const downloadPaymentsCSV = () => {
    const headers = ['Student', 'Amount', 'Method', 'Reference', 'Status', 'Submitted At'];
    const rows = payments.map((p: any) => [
      p.userName,
      `ZMW ${p.amount}`,
      p.method,
      p.reference,
      p.status,
      new Date(p.submittedAt).toLocaleString()
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPaymentsPDF = () => {
    const doc = new jsPDF();
    doc.text('Payment Submissions', 14, 10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 18);
    autoTable(doc, {
      head: [['Student', 'Amount', 'Method', 'Reference', 'Status', 'Submitted']],
      body: payments.map((p: any) => [
        p.userName,
        `ZMW ${p.amount}`,
        p.method,
        p.reference,
        p.status,
        new Date(p.submittedAt).toLocaleString()
      ]),
      startY: 25,
    });
    doc.save(`payments_${new Date().toISOString().slice(0, 19)}.pdf`);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const pendingCount = payments.filter((p: any) => p.status === 'pending').length;
  const approvedCount = payments.filter((p: any) => p.status === 'approved').length;
  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.status === 'approved' ? p.amount : 0), 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Payment Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendingCount} pending · {approvedCount} approved · Total Revenue: ZMW {totalRevenue}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadPaymentsCSV} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
            📄 CSV
          </button>
          <button onClick={downloadPaymentsPDF} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">
            📑 PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-sm text-gray-500">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.userName} <span className="text-xs text-gray-400 block">{p.userEmail}</span></td>
                <td className="px-4 py-3 font-semibold">ZMW {p.amount}</td>
                <td className="px-4 py-3">{p.method}</td>
                <td className="px-4 py-3 text-sm">{p.reference}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.status === 'approved' ? 'bg-green-100 text-green-700' :
                    p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.submittedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {p.status === 'pending' && (
                    <button 
                      onClick={() => updateStatus(p.id, 'approved')} 
                      disabled={processing === p.id} 
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {processing === p.id ? '...' : 'Confirm & Send Receipt'}
                    </button>
                  )}
                  {p.status !== 'pending' && (
                    <span className="text-xs text-gray-400">Processed</span>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No payment submissions found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
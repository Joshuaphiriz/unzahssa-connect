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
  const [searchReceipt, setSearchReceipt] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [resetMessage, setResetMessage] = useState('');

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
      fetchPayments();
      if (status === 'rejected') {
        setResetMessage('Affiliation reset. Please affiliate again.');
        setTimeout(() => setResetMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const resetSelected = async () => {
    if (selectedPayments.length === 0) return;
    if (!confirm(`Reset ${selectedPayments.length} payment(s) to rejected?`)) return;
    for (const id of selectedPayments) {
      await api(`/payments/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'rejected' }) }, token);
    }
    setSelectedPayments([]);
    setResetMessage(`${selectedPayments.length} affiliation(s) reset. Please affiliate again.`);
    setTimeout(() => setResetMessage(''), 3000);
    fetchPayments();
  };

  const resetAll = async () => {
    if (!confirm('⚠️ Reset ALL affiliations to rejected? This cannot be undone.')) return;
    const allPayments = payments.filter((p: any) => p.status === 'approved' || p.status === 'pending');
    for (const p of allPayments) {
      await api(`/payments/${p.id}`, { method: 'PUT', body: JSON.stringify({ status: 'rejected' }) }, token);
    }
    setResetMessage(`All affiliations reset. Please affiliate again.`);
    setTimeout(() => setResetMessage(''), 3000);
    fetchPayments();
  };

  const filteredPayments = payments.filter((p: any) => {
    const matchReceipt = p.receiptNumber?.toLowerCase().includes(searchReceipt.toLowerCase()) || false;
    const matchMonth = monthFilter === '' || new Date(p.submittedAt).getMonth() === parseInt(monthFilter);
    return matchReceipt || matchMonth;
  });

  const downloadPaymentsCSV = () => {
    const headers = ['Student', 'Amount', 'Method', 'Reference', 'Receipt No', 'Status', 'Submitted At'];
    const rows = filteredPayments.map((p: any) => [p.userName, `ZMW ${p.amount}`, p.method, p.reference, p.receiptNumber || 'N/A', p.status, new Date(p.submittedAt).toLocaleString()]);
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
      head: [['Student', 'Amount', 'Method', 'Reference', 'Receipt No', 'Status', 'Submitted']],
      body: filteredPayments.map((p: any) => [p.userName, `ZMW ${p.amount}`, p.method, p.reference, p.receiptNumber || 'N/A', p.status, new Date(p.submittedAt).toLocaleString()]),
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
          <button onClick={downloadPaymentsCSV} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">📄 CSV</button>
          <button onClick={downloadPaymentsPDF} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">📑 PDF</button>
        </div>
      </div>

      {resetMessage && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">
          {resetMessage}
        </div>
      )}

      {/* Reset buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={resetSelected}
          disabled={selectedPayments.length === 0}
          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm disabled:opacity-50"
        >
          Reset Selected ({selectedPayments.length})
        </button>
        <button onClick={resetAll} className="px-3 py-1 bg-red-600 text-white rounded text-sm">
          Reset All
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by receipt number..."
          value={searchReceipt}
          onChange={(e) => setSearchReceipt(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm w-64"
        />
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">All Months</option>
          <option value="0">January</option>
          <option value="1">February</option>
          <option value="2">March</option>
          <option value="3">April</option>
          <option value="4">May</option>
          <option value="5">June</option>
          <option value="6">July</option>
          <option value="7">August</option>
          <option value="8">September</option>
          <option value="9">October</option>
          <option value="10">November</option>
          <option value="11">December</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-sm text-gray-500">
              <th className="px-4 py-3">
                <input type="checkbox" onChange={(e) => e.target.checked ? setSelectedPayments(payments.map((p: any) => p.id)) : setSelectedPayments([])} />
              </th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Receipt No</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((p: any) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedPayments.includes(p.id)}
                    onChange={(e) => e.target.checked ? setSelectedPayments([...selectedPayments, p.id]) : setSelectedPayments(selectedPayments.filter(id => id !== p.id))}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{p.userName} <span className="text-xs text-gray-400 block">{p.userEmail}</span></td>
                <td className="px-4 py-3 font-semibold">ZMW {p.amount}</td>
                <td className="px-4 py-3">{p.method}</td>
                <td className="px-4 py-3 text-sm">{p.reference}</td>
                <td className="px-4 py-3 text-sm font-mono">{p.receiptNumber || 'N/A'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.status === 'approved' ? 'bg-green-100 text-green-700' :
                    p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.submittedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {p.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateStatus(p.id, 'approved')}
                        disabled={processing === p.id}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {processing === p.id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => updateStatus(p.id, 'rejected')}
                        disabled={processing === p.id}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        {processing === p.id ? '...' : 'Reset'}
                      </button>
                    </div>
                  )}
                  {p.status !== 'pending' && (
                    <span className="text-xs text-gray-400">Processed</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-400">No payment submissions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
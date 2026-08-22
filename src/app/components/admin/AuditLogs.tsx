import { useState, useEffect } from 'react';
import { useAuth } from '../shared/AuthContext';
import { api } from '../shared/api';

export function AuditLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api('/audit', {}, token).then(setLogs).catch(console.error).finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-sm text-gray-500">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Page</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">{log.userEmail}</td>
                <td className="px-4 py-3 text-sm">{log.action}</td>
                <td className="px-4 py-3 text-sm">{log.details}</td>
                <td className="px-4 py-3 text-sm text-gray-400">—</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No audit logs found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
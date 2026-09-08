import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { Payments as PaymentsStore, StudentProfiles, Affiliations, AuditLogs } from "../../lib/data";
import { useBranding } from "../shared/BrandingContext";
import { downloadAffiliationReceipt } from "../../lib/receipt";
import type { Payment, StudentProfile } from "../../lib/types";
import { CreditCard, Download, Search, Check, X, RotateCcw } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
};

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function Payments() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, StudentProfile>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = () => {
    void Promise.all([PaymentsStore.list(), StudentProfiles.list()]).then(([pays, profs]) => {
      setPayments(pays);
      setProfiles(Object.fromEntries(profs.map(p => [p.id, p])));
    });
  };
  useEffect(load, []);

  const audit = (action: string, details: string) => {
    if (user) return AuditLogs.create({ user_name: user.name, user_email: user.email, action, details, page: "/admin/payments" });
  };

  const confirm = async (p: Payment) => {
    await PaymentsStore.confirm(p);
    await audit("PAYMENT_CONFIRMED", `Confirmed ${p.reference_number} for ${p.student_name} (ZMW ${p.amount}, ${p.year})`);
    load();
  };
  const reject = async (p: Payment) => {
    await PaymentsStore.reject(p);
    await audit("PAYMENT_REJECTED", `Rejected ${p.reference_number} for ${p.student_name}`);
    load();
  };

  const resetOne = async (p: Payment) => {
    const prof = profiles[p.profile_id];
    if (!confirmDialog(`Reset ${prof?.full_name ?? p.student_name}'s affiliation? They will need to pay again for the current year.`)) return;
    await Affiliations.reset(p.profile_id);
    await audit("AFFILIATION_RESET", `Reset affiliation for ${prof?.full_name ?? p.student_name}`);
    load();
  };

  const resetAll = async () => {
    if (!confirmDialog(`Reset affiliation for ALL students? Use this at the start of a new academic year — every student will need to pay again. This cannot be undone.`)) return;
    if (!confirmDialog(`Are you sure? This affects every student.`)) return;
    await Affiliations.resetAll();
    await audit("AFFILIATION_RESET_ALL", "Reset affiliation for all students (new academic year)");
    load();
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" });

  const filtered = payments.filter(p => {
    const matchSearch = !search ||
      p.reference_number.toLowerCase().includes(search.toLowerCase()) ||
      p.student_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pending = payments.filter(p => p.status === "pending").length;
  const confirmedRevenue = payments.filter(p => p.status === "confirmed").reduce((s, p) => s + p.amount, 0);

  const exportCSV = () => downloadCSV(
    "unzahssa-payments.csv",
    ["Student", "Email", "Computer No.", "Year", "Amount", "Method", "Reference", "Receipt No.", "Status", "Date"],
    filtered.map(p => [p.student_name, p.student_email, p.computer_number, String(p.year), `ZMW ${p.amount}`, p.payment_method, p.reference_number, p.receipt_number, p.status, fmt(p.created_date)]),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Payments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pending} pending · ZMW {confirmedRevenue.toLocaleString()} confirmed revenue
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={resetAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">
            <RotateCcw className="w-4 h-4" /> Reset all affiliations
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or reference…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No payments found.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Year</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reference</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const prof = profiles[p.profile_id];
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-foreground font-medium">{p.student_name}</p>
                        <p className="text-muted-foreground text-xs">{p.student_email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.year}</td>
                      <td className="px-4 py-3 text-foreground">{p.payment_method}</td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{p.reference_number}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">ZMW {p.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status] ?? "bg-muted text-muted-foreground"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center items-center gap-2">
                          {p.status === "pending" && (
                            <>
                              <button onClick={() => confirm(p)} title="Confirm"
                                className="p-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => reject(p)} title="Reject"
                                className="p-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {p.status === "confirmed" && prof && (
                            <>
                              <button onClick={() => downloadAffiliationReceipt(p, prof, branding)} title="Download receipt"
                                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Download className="w-4 h-4" />
                              </button>
                              {prof.affiliation && (
                                <button onClick={() => resetOne(p)} title="Reset this student's affiliation"
                                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// small wrapper so lint doesn't flag window.confirm shadowing
function confirmDialog(msg: string): boolean {
  return window.confirm(msg);
}

import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { StudentProfiles, Payments, AuditLogs } from "../../lib/data";
import { useBranding } from "../shared/BrandingContext";
import { downloadAffiliationReceipt } from "../../lib/receipt";
import type { StudentProfile, Payment } from "../../lib/types";
import { CheckCircle, AlertTriangle, X, BookOpen, Briefcase, Award, Download } from "lucide-react";

const YEAR = new Date().getFullYear();

function PaymentModal({ profile, fee, onClose, onPaid }: {
  profile: StudentProfile;
  fee: number;
  onClose: () => void;
  onPaid: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({ method: "Mobile Money" as Payment["payment_method"], reference: "" });
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Payments.create({
        profile_id: profile.id,
        student_name: profile.full_name,
        student_email: profile.email,
        computer_number: profile.computer_number,
        amount: fee,
        payment_type: "Affiliation Fee",
        payment_method: form.method,
        reference_number: form.reference,
        status: "pending",
        receipt_sent: false,
      });
      if (user) await AuditLogs.create({
        user_name: user.name, user_email: user.email,
        action: "SUBMIT_PAYMENT", details: `Affiliation payment submitted via ${form.method}`, page: "/affiliations",
      });
      setSuccess(true);
      setTimeout(() => { onPaid(); onClose(); }, 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Pay Affiliation Fee</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-medium text-foreground">Payment submitted!</p>
            <p className="text-sm text-muted-foreground mt-1">Awaiting admin confirmation.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="p-4 rounded-lg bg-muted text-sm space-y-1">
              <p className="font-medium text-foreground">Payment Instructions</p>
              <p className="text-muted-foreground">Mobile Money: <span className="text-foreground font-medium">*880*1234567#</span></p>
              <p className="text-muted-foreground">Bank: <span className="text-foreground font-medium">Zambia National Bank — Acc: 1234567890</span></p>
              <p className="text-muted-foreground">Branch: Cairo Road, Lusaka</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Amount</label>
              <input readOnly value={`ZMW ${fee.toFixed(2)}`} className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Payment Method</label>
              <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value as Payment["payment_method"] }))}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50">
                <option>Mobile Money</option>
                <option>Bank Transfer</option>
                <option>Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Transaction Reference</label>
              <input required value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                placeholder="e.g. ZAIN-2026-12345"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 disabled:opacity-60 transition-colors">{saving ? "Submitting…" : "Submit Payment"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
  reset: "bg-orange-100 text-orange-700",
};

export function Affiliations() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPayment, setShowPayment] = useState(false);

  const loadData = async () => {
    if (!user) return;
    const p = await StudentProfiles.findByUser(user.id);
    setProfile(p ?? null);
    setPayments(p ? await Payments.findByProfile(p.id) : []);
  };

  useEffect(() => { void loadData(); }, [user]);

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" });

  const BENEFITS = [
    { icon: Award, title: "Member Benefits", desc: "Access exclusive UNZAHSSA events, workshops, and networking sessions." },
    { icon: BookOpen, title: "Academic Support", desc: "Priority access to academic advisory sessions and library resources." },
    { icon: Briefcase, title: "Internship Access", desc: "Eligibility for the UNZAHSSA internship placement programme." },
  ];

  return (
    <div className="space-y-8">
      {showPayment && profile && (
        <PaymentModal profile={profile} fee={branding.affiliation_fee} onClose={() => setShowPayment(false)} onPaid={loadData} />
      )}

      <div>
        <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>My Affiliations</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your UNZAHSSA membership and affiliation status.</p>
      </div>

      {!profile ? (
        <div className="bg-card rounded-lg border border-border p-8 text-center text-muted-foreground text-sm">
          Loading your affiliation details…
        </div>
      ) : (() => {
        const affiliatedThisYear = profile.affiliation && profile.affiliation_year === YEAR;
        const pendingThisYear = payments.some(p => p.status === "pending" && p.year === YEAR);
        return (
        <>
          <div className={`rounded-lg border-l-4 border border-border p-5 ${affiliatedThisYear ? "border-l-green-500 bg-green-50" : "border-l-amber-500 bg-amber-50"}`}>
            <div className="flex items-start gap-3">
              {affiliatedThisYear
                ? <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 shrink-0" />
                : <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />}
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${affiliatedThisYear ? "text-green-800" : "text-amber-800"}`}>
                  {affiliatedThisYear ? `Affiliated for ${YEAR}` : "Not Affiliated for this Year"}
                </h3>
                {affiliatedThisYear ? (
                  <div className="space-y-1 text-sm text-green-700">
                    <p>Your UNZAHSSA membership is active for the {YEAR} academic year.</p>
                    {profile.affiliation_number && <p>Membership #: <strong>{profile.affiliation_number}</strong></p>}
                  </div>
                ) : pendingThisYear ? (
                  <p className="text-sm text-amber-700">
                    Your {YEAR} payment has been submitted and is awaiting admin confirmation.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-amber-700">
                      Affiliation is renewed once per academic year. Pay the ZMW {branding.affiliation_fee} fee
                      to activate your {YEAR} membership and access all UNZAHSSA benefits.
                    </p>
                    <button onClick={() => setShowPayment(true)}
                      className="mt-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors">
                      Pay {YEAR} Affiliation Fee — ZMW {branding.affiliation_fee}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {BENEFITS.map(b => {
              const Icon = b.icon;
              return (
                <div key={b.title} className={`bg-card rounded-lg border border-border p-5 transition-all ${!affiliatedThisYear ? "opacity-50 grayscale" : "hover:shadow-md"}`}>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2 text-sm">{b.title}</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>

          <div>
            <h2 className="text-foreground mb-4" style={{ fontFamily: "var(--font-display)" }}>Payment History</h2>
            {payments.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-6 text-center text-muted-foreground text-sm">
                No payment records found.
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reference</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Year</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-foreground">{p.reference_number}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.year}</td>
                          <td className="px-4 py-3 text-foreground">{p.payment_method}</td>
                          <td className="px-4 py-3 text-muted-foreground">{fmt(p.created_date)}</td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">ZMW {p.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] ?? "bg-muted text-muted-foreground"}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {p.status === "confirmed" ? (
                              <button onClick={() => downloadAffiliationReceipt(p, profile, branding)}
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                <Download className="w-3.5 h-3.5" /> Receipt
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
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
        </>
        );
      })()}
    </div>
  );
}

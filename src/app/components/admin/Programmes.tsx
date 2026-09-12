import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { Programmes as ProgrammesStore, AuditLogs } from "../../lib/data";
import { BookOpen, Plus, Pencil, Trash2, Check, X, Search } from "lucide-react";

export function Programmes() {
  const { user } = useAuth();
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [adding, setAdding] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState("");

  const filtered = programmes.filter(p => p.toLowerCase().includes(search.toLowerCase()));

  const load = () => { void ProgrammesStore.list().then(setProgrammes); };
  useEffect(load, []);

  const audit = (details: string) => {
    if (user) void AuditLogs.create({
      user_name: user.name, user_email: user.email,
      action: "PROGRAMME_UPDATE", details, page: "/admin/programmes",
    });
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = adding.trim();
    if (!name) return;
    if (programmes.some(p => p.toLowerCase() === name.toLowerCase())) {
      setError("That programme already exists.");
      return;
    }
    setProgrammes(await ProgrammesStore.add(name));
    audit(`Added programme "${name}"`);
    setAdding(""); setError("");
  };

  const saveEdit = async (from: string) => {
    const to = editValue.trim();
    if (!to) return;
    if (to !== from && programmes.some(p => p.toLowerCase() === to.toLowerCase())) {
      setError("That programme already exists.");
      return;
    }
    setProgrammes(await ProgrammesStore.rename(from, to));
    audit(`Renamed programme "${from}" to "${to}"`);
    setEditing(null); setEditValue(""); setError("");
  };

  const remove = async (name: string) => {
    if (!confirm(`Remove "${name}"?`)) return;
    setProgrammes(await ProgrammesStore.remove(name));
    audit(`Removed programme "${name}"`);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-foreground" style={{ fontFamily: "var(--font-display)" }}>Programmes</h1>
        <p className="text-muted-foreground text-sm mt-1">Academic programmes available for student registration.</p>
      </div>

      <form onSubmit={add} className="flex gap-2">
        <input value={adding} onChange={e => { setAdding(e.target.value); setError(""); }}
          placeholder="e.g. Anthropology"
          className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
        <button type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programmes…"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{programmes.length === 0 ? "No programmes yet." : "No programmes match your search."}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border max-h-[28rem] overflow-y-auto">
            {filtered.map((p, i) => (
              <li key={p} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                <span className="text-muted-foreground text-xs w-6 shrink-0">{i + 1}</span>
                {editing === p ? (
                  <>
                    <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                      className="flex-1 px-2 py-1 rounded-md border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
                    <button onClick={() => saveEdit(p)} className="p-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200"><Check className="w-4 h-4" /></button>
                    <button onClick={() => { setEditing(null); setError(""); }} className="p-1.5 rounded-md bg-muted text-muted-foreground hover:bg-border"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-foreground text-sm font-medium">{p}</span>
                    <button onClick={() => { setEditing(p); setEditValue(p); setError(""); }} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(p)} className="p-1.5 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

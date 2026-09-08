import React, { useState } from "react";
import { Contacts } from "../../lib/data";
import type { Contact } from "../../lib/types";
import { X } from "lucide-react";

interface Props {
  contact?: Contact | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ContactEditor({ contact, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: contact?.name ?? "",
    position: contact?.position ?? "",
    phone: contact?.phone ?? "",
    whatsapp: contact?.whatsapp ?? "",
    sort_order: contact?.sort_order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: k === "sort_order" ? Number(e.target.value) : e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (contact) await Contacts.update(contact.id, form);
      else await Contacts.create(form);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {contact ? "Edit contact" : "Add contact"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input required value={form.name} onChange={set("name")} className={input} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Position</label>
            <input required value={form.position} onChange={set("position")} placeholder="e.g. Treasurer" className={input} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Call number</label>
              <input value={form.phone} onChange={set("phone")} placeholder="+260…" className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">WhatsApp number</label>
              <input value={form.whatsapp} onChange={set("whatsapp")} placeholder="260…" className={input} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Sort order</label>
            <input type="number" value={form.sort_order} onChange={set("sort_order")} className={input} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

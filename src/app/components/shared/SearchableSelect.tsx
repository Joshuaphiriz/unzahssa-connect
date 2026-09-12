import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

/** A searchable, scrollable dropdown — type to filter, click or arrow-key to
 * pick. Drop-in alternative to a plain <select> for lists long enough that
 * scanning them isn't practical (programmes, and anything similar later). */
export function SearchableSelect({ value, onChange, options, placeholder = "Select…", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) { setQuery(""); setHighlight(0); setTimeout(() => inputRef.current?.focus(), 0); }
  }, [open]);

  const pick = (opt: string) => { onChange(opt); setOpen(false); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[highlight]) pick(filtered[highlight]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border bg-input-background text-left text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors">
        <span className={value ? "text-foreground" : "text-muted-foreground"}>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          <div className="relative border-b border-border">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setHighlight(0); }} onKeyDown={onKeyDown}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none" />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">No matches.</p>
            ) : filtered.map((opt, i) => (
              <button key={opt} type="button" onClick={() => pick(opt)} onMouseEnter={() => setHighlight(i)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  i === highlight ? "bg-muted text-foreground" : "text-foreground"
                }`}>
                {opt}
                {opt === value && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

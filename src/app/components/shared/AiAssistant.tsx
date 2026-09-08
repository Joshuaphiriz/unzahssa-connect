import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth";
import { askAssistantStream, type ChatMessage } from "../../lib/ai";
import { Sparkles, X, Send, Loader2, Copy, Check, MessageSquarePlus, Square } from "lucide-react";

interface AiAssistantCtx {
  open: (opts?: { context?: string; seed?: string }) => void;
  setContext: (context: string | undefined) => void;
}

const Ctx = createContext<AiAssistantCtx>({ open: () => {}, setContext: () => {} });
export const useAiAssistant = () => useContext(Ctx);

const SUGGESTIONS = [
  "Help me write a strong CV objective",
  "Review my cover letter",
  "How do I pay my affiliation fee?",
  "What goes in the internship portal?",
];

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch { /* ignore */ }
      }}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      title="Copy"
    >
      {done ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function AiAssistantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContextState] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const setContext = useCallback((c: string | undefined) => setContextState(c), []);
  const open = useCallback((opts?: { context?: string; seed?: string }) => {
    if (opts?.context !== undefined) setContextState(opts.context);
    if (opts?.seed) setInput(opts.seed);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming, loading]);

  const newChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming("");
    setError("");
    setLoading(false);
    setInput("");
  };

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(s => {
      if (s) setMessages(m => [...m, { role: "assistant", content: s }]);
      return "";
    });
    setLoading(false);
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setError("");
    setInput("");
    const next: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setLoading(true);
    setStreaming("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const full = await askAssistantStream(next, {
        context,
        signal: controller.signal,
        onToken: chunk => setStreaming(s => s + chunk),
      });
      setMessages([...next, { role: "assistant", content: full }]);
      setStreaming("");
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message || "The assistant is unavailable right now.");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <Ctx.Provider value={{ open, setContext }}>
      {children}

      {user && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 pl-3 pr-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Open AI assistant"
        >
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="text-sm font-medium">Ask AI</span>
        </button>
      )}

      {user && isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(92vw,400px)] h-[min(80vh,560px)] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="font-semibold text-sm" style={{ fontFamily: "var(--font-display)" }}>UNZAHSSA Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={newChat} title="New chat"
                className="p-1 rounded text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors">
                <MessageSquarePlus className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} title="Close"
                className="p-1 rounded text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {context && (
            <div className="px-4 py-1.5 bg-accent/10 text-accent text-xs font-medium border-b border-border flex items-center justify-between">
              <span>Using your current CV / letter draft as context</span>
              <button onClick={() => setContextState(undefined)} className="hover:underline">clear</button>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && !streaming && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Hi{user.name ? ` ${user.name.split(" ")[0]}` : ""} — I can help with your CV, application letters, and using the portal.
                </p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="text-left text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`group flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-start gap-1.5 max-w-[88%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}>
                    {m.content}
                  </div>
                  {m.role === "assistant" && <div className="pt-1.5"><CopyButton text={m.content} /></div>}
                </div>
              </div>
            ))}

            {streaming && (
              <div className="flex justify-start">
                <div className="max-w-[88%] bg-muted text-foreground rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap">
                  {streaming}<span className="inline-block w-1.5 h-4 -mb-0.5 bg-foreground/40 animate-pulse ml-0.5" />
                </div>
              </div>
            )}

            {loading && !streaming && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-3.5 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <form onSubmit={e => { e.preventDefault(); send(input); }} className="border-t border-border p-3 flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              rows={1}
              placeholder="Ask anything…"
              className="flex-1 resize-none max-h-28 px-3 py-2 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
            />
            {loading ? (
              <button type="button" onClick={stop} title="Stop"
                className="p-2.5 rounded-lg bg-muted text-foreground hover:bg-border transition-colors">
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={!input.trim()}
                className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      )}
    </Ctx.Provider>
  );
}

import { supabase } from "./supabase";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };
}

async function errorFrom(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (j?.error) return j.error;
  } catch {
    /* ignore */
  }
  return "The assistant is unavailable right now.";
}

/**
 * Stream the assistant's reply token-by-token. `onToken` is called with each new
 * text chunk; the promise resolves with the full text once the stream ends.
 * The `ai-assistant` edge function proxies an OpenAI-compatible gateway
 * (OpenRouter free models by default) — the API key stays in Supabase secrets.
 */
export async function askAssistantStream(
  messages: ChatMessage[],
  opts: { context?: string; signal?: AbortSignal; onToken: (chunk: string) => void },
): Promise<string> {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ messages, context: opts.context, stream: true }),
    signal: opts.signal,
  });

  if (!res.ok) throw new Error(await errorFrom(res));
  if (!res.body) throw new Error("The assistant returned no data.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          opts.onToken(delta);
        }
      } catch {
        /* keep-alive / comment line */
      }
    }
  }

  if (!full.trim()) throw new Error("The assistant returned an empty response.");
  return full;
}

/** Non-streaming variant (kept for callers that just want the final text). */
export async function askAssistant(messages: ChatMessage[], context?: string): Promise<string> {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ messages, context, stream: false }),
  });
  if (!res.ok) throw new Error(await errorFrom(res));
  const reply = (await res.json())?.reply?.trim();
  if (!reply) throw new Error("The assistant returned an empty response.");
  return reply;
}

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * Provider-agnostic AI proxy for the UNZAHSSA Connect assistant.
 * OpenAI-compatible. Configure via Supabase secrets (never hard-coded):
 *   AI_API_KEY  (required)  – gateway/provider key
 *   AI_BASE_URL (optional)  – default https://openrouter.ai/api/v1
 *   AI_MODEL    (optional)  – one id, or comma-separated fallback list
 *   AI_TITLE / AI_REFERER   – optional OpenRouter attribution headers
 *
 * POST { messages, context, stream? }  → { reply, model }  |  text/event-stream
 * POST { diagnostic: true }            → capability report
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT =
  `You are the UNZAHSSA Connect assistant for the University of Zambia Humanities & Social Sciences Students Association student portal.

You help students with:
- Writing and improving CVs and cover/application letters for internship placements (structure, wording, quantifying achievements, tailoring to an organisation, Zambian/African job-market context).
- Using the portal: affiliation (annual ZMW fee paid on the Affiliations page, an admin confirms it, then a receipt can be downloaded; renewed once per academic year), the student Forum, the Internship Portal (multiple applications, CV & Letter builder, document uploads), Academic Queries, and Profile.

Be concise, practical and encouraging. Use short paragraphs or bullet points. When given the student's CV or letter draft as context, give specific, actionable edits rather than generic advice. If asked something outside your scope, say so briefly.`;

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODELS = [
  "openrouter/free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "inclusionai/ling-3.0-flash-fin:free",
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("AI_API_KEY");
  if (!apiKey) return json({ error: "The AI assistant is not configured yet (missing AI_API_KEY)." }, 503);

  const baseUrl = (Deno.env.get("AI_BASE_URL") || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const configuredModels = Deno.env.get("AI_MODEL")?.split(",").map((m) => m.trim()).filter(Boolean);
  const models = configuredModels ?? DEFAULT_MODELS;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-Title": Deno.env.get("AI_TITLE") ?? "UNZAHSSA Connect",
  };
  const referer = Deno.env.get("AI_REFERER");
  if (referer) headers["HTTP-Referer"] = referer;

  let payload: {
    messages?: { role: string; content: string }[];
    context?: string;
    stream?: boolean;
    diagnostic?: boolean;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  if (payload.diagnostic) {
    const out: Record<string, unknown> = {
      ok: true, base_url: baseUrl, key_prefix: apiKey.slice(0, 8),
      configured_models: configuredModels ?? "(using defaults)", default_models: DEFAULT_MODELS,
    };
    try {
      const r = await fetch(`${baseUrl}/models`, { headers });
      const j = await r.json();
      out.models_status = r.status;
      out.free_models = (j?.data ?? [])
        .filter((m: any) => m.id?.endsWith(":free") || m?.pricing?.prompt === "0")
        .map((m: any) => m.id);
      if (r.status !== 200) out.models_body = JSON.stringify(j).slice(0, 400);
    } catch (e) {
      out.models_error = String(e);
    }
    return json(out);
  }

  const history = (payload.messages ?? [])
    .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
    .slice(-12);
  if (history.length === 0) return json({ error: "No message provided." }, 400);

  const messages: { role: string; content: string }[] = [{ role: "system", content: SYSTEM_PROMPT }];
  if (payload.context && payload.context.trim()) {
    messages.push({ role: "system", content: `The student's current draft / context:\n\n${payload.context.slice(0, 6000)}` });
  }
  messages.push(...history);

  const wantStream = payload.stream !== false; // stream by default
  const errors: string[] = [];

  for (const model of models) {
    try {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 1200, stream: wantStream }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        const msg = `${model} -> ${resp.status}: ${t.slice(0, 400)}`;
        console.error("[ai-assistant]", msg);
        errors.push(msg);
        if (resp.status === 401 || resp.status === 403) {
          return json({ error: "The AI key was rejected by the provider.", detail: msg }, 502);
        }
        continue;
      }

      if (wantStream && resp.body) {
        // Pipe the provider's SSE straight through to the browser.
        return new Response(resp.body, {
          headers: { ...CORS, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Model": model },
        });
      }

      const data = await resp.json();
      const reply = data?.choices?.[0]?.message?.content?.trim();
      if (reply) return json({ reply, model });
      errors.push(`${model} -> 200 but empty`);
    } catch (e) {
      const msg = `${model} -> threw: ${String(e)}`;
      console.error("[ai-assistant]", msg);
      errors.push(msg);
    }
  }

  return json(
    { error: "All AI models are unavailable right now. Please try again shortly.", detail: errors.join(" | ") },
    502,
  );
});

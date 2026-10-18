// Supabase Edge Function: hops-chat
// Hops the study-buddy bunny, powered by Gemini. Called from the app via supabase.functions.invoke("hops-chat").
// Secrets: GEMINI_API_KEY (required), GEMINI_MODEL (optional). SUPABASE_URL / SUPABASE_ANON_KEY are auto-provided.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_MODEL = "gemini-3.8-flash";
/** Tried in order when the previous model is overloaded (500/503), out of quota (429), or unknown (404). */
const FALLBACK_MODEL = "gemini-3.6-flash";
/** Last resort: Flash-Lite has its own (larger) free-tier quota. */
const LITE_MODEL = "gemini-3.5-flash-lite";
/** Hard cap on Gemini calls per user message (retries + fallbacks combined). */
const MAX_GEMINI_CALLS = 3;
/** How much of each Gemini error body to log (never contains the API key). */
const LOG_CHARS = 2000;
const MAX_MESSAGES = 20;
const MAX_CHARS = 1500;

const MAX_SPOTS = 60;
const MAX_PICKS = 3;
const SPOT_COLUMNS =
  "id,name,latitude,longitude,address,place_id,avg_rating,rating_count,noise,outlets,wifi,seating,price,price_note,hours,open_late,tags,summary,busiest_hours";

const SYSTEM_PROMPT = `You are Hops, a cozy, cute bunny study buddy inside the Study Hopper app.
You help students in Seattle (especially around the University of Washington) find good places to study and stay motivated.
Keep replies short and friendly: 1-3 sentences, warm and a little playful, at most one emoji. Plain text only, no markdown, no lists unless asked.
When the student asks for a recommendation, pick from the "Known study spots" list below when one fits, use the spot's exact name, and say briefly why (noise, outlets, wifi, price, hours).
Never invent spots, hours, or facts that are not in the list; if nothing fits, say so kindly and suggest what to look for.
If asked about something unrelated to studying, answer briefly and gently steer back to study plans.`;

const JSON_INSTRUCTIONS = `
Answer as JSON with two fields:
- "reply": your chat message to the student (plain text, as described above).
- "spot_ids": the ids (like "s3") of the spots you recommend in this reply, best first, at most ${MAX_PICKS}. Only use ids from the "Known study spots" list, and only for spots your reply actually recommends. Use [] when you are not recommending a specific spot.`;

type ChatMessage = { role: "user" | "model"; text: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function cleanMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const messages = raw
    .filter((m) => m && (m.role === "user" || m.role === "model") && typeof m.text === "string" && m.text.trim())
    .map((m) => ({ role: m.role as ChatMessage["role"], text: String(m.text).trim().slice(0, MAX_CHARS) }))
    .slice(-MAX_MESSAGES);
  // Gemini wants the conversation to start with a user turn.
  while (messages.length && messages[0].role !== "user") messages.shift();
  return messages;
}

type SpotRow = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  place_id: string | null;
  avg_rating: number | string | null;
  rating_count: number | null;
  noise: string | null;
  outlets: string | null;
  wifi: string | null;
  seating: number | null;
  price: string | null;
  price_note: string | null;
  hours: string | null;
  open_late: boolean | null;
  tags: string[] | null;
  summary: string | null;
  busiest_hours: string | null;
};

/** Spots the caller may read (RLS applies: the caller's JWT is forwarded). */
async function loadSpots(authHeader: string | null): Promise<SpotRow[]> {
  const url = Deno.env.get("SUPABASE_URL");
  let anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!anon) {
    try {
      anon = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}").default;
    } catch {
      anon = undefined;
    }
  }
  if (!url || !anon || !authHeader) return [];
  try {
    const supabase = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data, error } = await supabase
      .from("spots")
      .select(SPOT_COLUMNS)
      .order("avg_rating", { ascending: false, nullsFirst: false })
      .limit(MAX_SPOTS);
    if (error) {
      console.error("spots query failed:", error.message);
      return [];
    }
    return (data ?? []) as SpotRow[];
  } catch (error) {
    console.error("spots query threw:", error);
    return [];
  }
}

/** Short alias ("s1", "s2", ...) per spot keeps the prompt small and the ids easy for the model to copy. */
const alias = (index: number) => `s${index + 1}`;

function spotLines(spots: SpotRow[]): string {
  return spots
    .map((s, index) =>
      [
        `id:${alias(index)}`,
        s.name,
        s.address,
        s.noise && `noise:${s.noise}`,
        s.outlets && `outlets:${s.outlets}`,
        s.wifi && `wifi:${s.wifi}`,
        s.price && `price:${s.price}`,
        s.open_late ? "open late" : null,
        s.hours && `hours:${s.hours}`,
        s.avg_rating != null && `rating:${Number(s.avg_rating).toFixed(1)}`,
        s.tags?.length ? `tags:${s.tags.join("/")}` : null,
        s.summary && `about:${s.summary.slice(0, 160)}`,
      ]
        .filter(Boolean)
        .join(" | "),
    )
    .join("\n");
}

/** Map model-chosen ids (alias or real uuid) back to real rows; drops unknown ids and duplicates. */
function pickSpots(ids: unknown, spots: SpotRow[]): SpotRow[] {
  if (!Array.isArray(ids)) return [];
  const picked: SpotRow[] = [];
  for (const raw of ids) {
    if (typeof raw !== "string") continue;
    const id = raw.trim().toLowerCase();
    const match = /^s\d+$/.test(id) ? spots[Number(id.slice(1)) - 1] : spots.find((s) => s.id === id);
    if (match && !picked.includes(match)) picked.push(match);
    if (picked.length >= MAX_PICKS) break;
  }
  return picked;
}

/** Plain-text fallback: spots whose exact name appears in the reply (longest names first). */
function spotsNamedIn(reply: string, spots: SpotRow[]): SpotRow[] {
  const text = reply.toLowerCase();
  return [...spots]
    .sort((a, b) => b.name.length - a.name.length)
    .filter((s) => s.name.length > 2 && text.includes(s.name.toLowerCase()))
    .slice(0, MAX_PICKS);
}

function replySchema(spots: SpotRow[]) {
  const ids = spots.map((_, index) => alias(index));
  return {
    type: "object",
    properties: {
      reply: { type: "string", description: "Hops' chat message to the student." },
      spot_ids: {
        type: "array",
        description: "Ids of the recommended spots from the Known study spots list, best first.",
        items: ids.length ? { type: "string", enum: ids } : { type: "string" },
        maxItems: MAX_PICKS,
      },
    },
    required: ["reply", "spot_ids"],
  };
}

/** Parse the model's JSON; tolerates code fences and a truncated tail. Returns null if no usable reply. */
function parseStructured(text: string): { reply: string; spot_ids: unknown } | null {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed.reply === "string" && parsed.reply.trim()) {
      return { reply: parsed.reply.trim(), spot_ids: parsed.spot_ids };
    }
  } catch {
    const match = cleaned.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (match) {
      try {
        return { reply: JSON.parse(`"${match[1]}"`).trim(), spot_ids: [] };
      } catch {
        /* fall through */
      }
    }
  }
  return null;
}

type GeminiOptions = { thinking: boolean; schema: Record<string, unknown> | null };

async function callGemini(apiKey: string, model: string, system: string, messages: ChatMessage[], opts: GeminiOptions) {
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    generationConfig: {
      maxOutputTokens: 700,
      ...(opts.schema ? { responseMimeType: "application/json", responseJsonSchema: opts.schema } : {}),
      ...(opts.thinking ? { thinkingConfig: { thinkingLevel: "low" } } : {}),
    },
  };
  return await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Hops only understands POST requests.", code: "method_not_allowed" }, 405);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return json(
      { error: "Hops is still waking up — the Gemini key hasn't been added to Supabase yet.", code: "missing_key" },
      503,
    );
  }

  let payload: { messages?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Hops couldn't read that message.", code: "bad_request" }, 400);
  }
  const messages = cleanMessages(payload.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json({ error: "Say something to Hops first!", code: "bad_request" }, 400);
  }

  const model = Deno.env.get("GEMINI_MODEL")?.trim() || DEFAULT_MODEL;
  const spots = await loadSpots(req.headers.get("Authorization"));
  const base = spots.length ? `${SYSTEM_PROMPT}\n\nKnown study spots:\n${spotLines(spots)}` : SYSTEM_PROMPT;

  try {
    // Structured (JSON) first; if the model/API rejects an option, drop it and retry (thinking first, then JSON mode).
    let opts: GeminiOptions = { thinking: true, schema: replySchema(spots) };
    const system = () => (opts.schema ? base + JSON_INSTRUCTIONS : base);
    const chain = [...new Set([model, FALLBACK_MODEL, LITE_MODEL])];

    // 429 / 404 / other: move to the next model (no same-model retry).
    // 500/503: one quick retry on the same model only if calls remain beyond what the rest of the chain needs.
    // 400: drop thinking, then JSON mode, and retry the same model. All within MAX_GEMINI_CALLS.
    let calls = 0;
    let res: Response | null = null;
    let usedModel = model;
    const failures: number[] = [];
    let badRequest = false;
    outer: for (let i = 0; i < chain.length; i++) {
      const m = chain[i];
      let retried503 = false;
      while (calls < MAX_GEMINI_CALLS) {
        calls++;
        usedModel = m;
        const r = await callGemini(apiKey, m, system(), messages, opts);
        if (r.ok) {
          res = r;
          break outer;
        }
        const text = await r.text();
        console.error(`Gemini ${r.status} on ${m} (call ${calls}/${MAX_GEMINI_CALLS}):`, text.slice(0, LOG_CHARS));
        if (r.status === 400) {
          if (opts.thinking && /thinking/i.test(text)) opts = { ...opts, thinking: false };
          else if (opts.schema) opts = { ...opts, schema: null };
          else {
            badRequest = true;
            break outer;
          }
          continue;
        }
        failures.push(r.status);
        const modelsLeft = chain.length - i - 1;
        if ((r.status === 500 || r.status === 503) && !retried503 && MAX_GEMINI_CALLS - calls > modelsLeft) {
          retried503 = true;
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }
        break; // next model
      }
      if (calls >= MAX_GEMINI_CALLS) break;
    }

    if (!res) {
      if (badRequest || (failures.length === 0 && calls > 0)) {
        return json({ error: "Hops got confused by that one. Try rephrasing?", code: "gemini_bad_request" }, 502);
      }
      const real = failures.filter((s) => s !== 404);
      if (real.length && real.every((s) => s === 429)) {
        return json({ error: "Hops is out of energy for today 🥕 Try again a bit later!", code: "quota" }, 429);
      }
      if (real.some((s) => s === 401 || s === 403)) {
        return json({ error: "Hops can't reach Gemini — the API key looks invalid.", code: "gemini_auth" }, 502);
      }
      if (real.some((s) => s === 500 || s === 503)) {
        return json({ error: "Hops' burrow is extra busy right now 🐰 Try again in a moment!", code: "busy" }, 503);
      }
      return json({ error: "Hops hopped into a hiccup. Try again in a moment!", code: "gemini_error" }, 502);
    }
    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts ?? [])
      .filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
      .map((p: { text: string }) => p.text)
      .join("")
      .trim();

    let reply = text;
    let picked: SpotRow[] = [];
    let structured = false;
    if (opts.schema && text) {
      const parsed = parseStructured(text);
      if (parsed) {
        reply = parsed.reply;
        picked = pickSpots(parsed.spot_ids, spots);
        structured = true;
      } else if (/^\s*[{\[]/.test(text)) {
        reply = ""; // unusable JSON; don't show raw braces to the student
      }
    }
    if (!structured && reply) picked = spotsNamedIn(reply, spots);
    if (!reply) {
      return json({ error: "Hops lost its words for a sec. Try asking another way?", code: "empty" }, 502);
    }
    return json({ reply, spots: picked, model: usedModel, structured });
  } catch (error) {
    console.error("hops-chat failure:", error);
    const timeout = error instanceof DOMException && error.name === "TimeoutError";
    return json(
      { error: timeout ? "Hops is thinking too hard — try again!" : "Hops hopped into a hiccup. Try again in a moment!", code: timeout ? "timeout" : "error" },
      502,
    );
  }
});

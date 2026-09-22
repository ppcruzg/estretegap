// ============================================================
// EDGE FUNCTION: ai-proxy
// Authenticated proxy to OpenAI chat completions.
// - Requires a valid Supabase user JWT.
// - OpenAI key is read from the OPENAI_API_KEY function secret only.
// - Model, token budget and body shape are constrained server-side.
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o";
const ALLOWED_MODELS = new Set(["gpt-4o", "gpt-4o-mini"]);
const MAX_TOKENS_CAP = 4000;
const MAX_MESSAGES = 10;
const MAX_TOTAL_CHARS = 200_000;
const ALLOWED_ROLES = new Set(["system", "user", "assistant"]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, code: string, message: string): Response {
  return jsonResponse({ error: { code, message } }, status);
}

type ChatMessage = { role: string; content: string };

interface ValidatedBody {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens: number;
  response_format?: { type: "json_object" | "text" };
}

function validateBody(raw: unknown): ValidatedBody | string {
  if (!raw || typeof raw !== "object") return "Body must be a JSON object";
  const body = raw as Record<string, unknown>;

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return `messages must be a non-empty array (max ${MAX_MESSAGES})`;
  }
  let totalChars = 0;
  const cleanMessages: ChatMessage[] = [];
  for (const m of messages) {
    if (!m || typeof m !== "object") return "Invalid message";
    const { role, content } = m as Record<string, unknown>;
    if (typeof role !== "string" || !ALLOWED_ROLES.has(role)) return "Invalid message role";
    if (typeof content !== "string") return "Message content must be a string";
    totalChars += content.length;
    cleanMessages.push({ role, content });
  }
  if (totalChars > MAX_TOTAL_CHARS) return "Messages too large";

  const model = typeof body.model === "string" && ALLOWED_MODELS.has(body.model)
    ? body.model
    : DEFAULT_MODEL;

  let temperature: number | undefined;
  if (body.temperature !== undefined) {
    if (typeof body.temperature !== "number" || body.temperature < 0 || body.temperature > 2) {
      return "temperature must be a number between 0 and 2";
    }
    temperature = body.temperature;
  }

  let maxTokens = MAX_TOKENS_CAP;
  if (body.max_tokens !== undefined) {
    if (typeof body.max_tokens !== "number" || !Number.isInteger(body.max_tokens) || body.max_tokens < 1) {
      return "max_tokens must be a positive integer";
    }
    maxTokens = Math.min(body.max_tokens, MAX_TOKENS_CAP);
  }

  let responseFormat: ValidatedBody["response_format"];
  if (body.response_format !== undefined) {
    const type = (body.response_format as Record<string, unknown>)?.type;
    if (type !== "json_object" && type !== "text") return "Invalid response_format";
    responseFormat = { type };
  }

  return {
    model,
    messages: cleanMessages,
    temperature,
    max_tokens: maxTokens,
    response_format: responseFormat,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorResponse(405, "method_not_allowed", "Only POST is allowed");
  }

  // --- Auth -------------------------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse(401, "unauthorized", "Missing authorization");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !openaiKey) {
    console.error("ai-proxy: missing required environment configuration");
    return errorResponse(500, "not_configured", "AI service is not configured");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = authHeader.slice("Bearer ".length);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return errorResponse(401, "unauthorized", "Invalid or expired session");
  }

  // --- Body -------------------------------------------------
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse(400, "invalid_json", "Body must be valid JSON");
  }
  const validated = validateBody(raw);
  if (typeof validated === "string") {
    return errorResponse(400, "invalid_request", validated);
  }

  // --- Forward to OpenAI ------------------------------------
  let upstream: Response;
  try {
    upstream = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validated),
    });
  } catch (_e) {
    console.error("ai-proxy: upstream request failed");
    return errorResponse(502, "upstream_unavailable", "AI provider unavailable");
  }

  const upstreamBody = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    const upstreamCode: string | undefined = upstreamBody?.error?.code;
    console.error(`ai-proxy: OpenAI error status=${upstream.status} code=${upstreamCode ?? "unknown"}`);
    if (upstream.status === 401 || upstreamCode === "invalid_api_key") {
      // Never echo upstream auth messages: they can include a partial key.
      return errorResponse(502, "not_configured", "AI service credentials are invalid");
    }
    if (upstreamCode === "insufficient_quota") {
      return errorResponse(402, "insufficient_quota", "AI provider quota exceeded");
    }
    if (upstream.status === 429) {
      return errorResponse(429, "rate_limited", "AI provider rate limit reached");
    }
    return errorResponse(502, "upstream_error", "AI provider returned an error");
  }

  return jsonResponse(upstreamBody);
});

/**
 * OpenAI-compatible chat proxy backed by GitHub Copilot.
 *
 * Request body (same shape as POST /v1/chat/completions):
 *   {
 *     "messages":      ChatMessage[],   // required
 *     "systemPrompt":  string,          // optional, prepended as role=system
 *     "model":         string,          // optional
 *     "temperature":   number           // optional
 *   }
 *
 * This route is intentionally thin — it just validates the request, prepends
 * the user's custom system prompt, and forwards to Copilot via
 * {@link copilotChatCompletion}.
 */
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/constants";
import { copilotChatCompletion, type ChatMessage } from "@/lib/copilot";

export const runtime = "nodejs";

interface ChatRequestBody {
  messages?: ChatMessage[];
  systemPrompt?: string;
  model?: string;
  temperature?: number;
}

function isChatMessage(x: unknown): x is ChatMessage {
  if (!x || typeof x !== "object") return false;
  const m = x as Record<string, unknown>;
  return (
    (m.role === "user" || m.role === "assistant" || m.role === "system") &&
    typeof m.content === "string"
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "`messages` must be a non-empty array" },
      { status: 400 },
    );
  }
  if (!body.messages.every(isChatMessage)) {
    return NextResponse.json(
      { error: "Each message must be { role, content }" },
      { status: 400 },
    );
  }

  const systemPrompt =
    typeof body.systemPrompt === "string" && body.systemPrompt.trim().length > 0
      ? body.systemPrompt.trim()
      : DEFAULT_SYSTEM_PROMPT;

  // Drop any system message the client sent — the server is the source of
  // truth for the system prompt — and prepend our own.
  const conversation = body.messages.filter((m) => m.role !== "system");
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversation,
  ];

  try {
    const upstream = await copilotChatCompletion({
      messages,
      model: body.model,
      temperature: body.temperature,
      stream: false,
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return NextResponse.json(
        {
          error: "Copilot backend error",
          status: upstream.status,
          detail: text.slice(0, 1000),
        },
        { status: 502 },
      );
    }

    // Pass the OpenAI-style response through unchanged.
    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

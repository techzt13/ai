/**
 * GitHub Copilot chat client (UNOFFICIAL).
 * ---------------------------------------------------------------
 * GitHub does not publish a public API for the Copilot Chat product, so this
 * file reverse-engineers the same handshake that the VS Code Copilot extension
 * performs:
 *
 *   1. The extension ships with a long-lived OAuth token obtained from the
 *      device-flow against client_id `Iv1.b507a08c87ecfe98`.  That token is
 *      stored locally in `~/.config/github-copilot/hosts.json`
 *      (or `%AppData%\github-copilot\hosts.json` on Windows).
 *
 *   2. On every chat request the extension exchanges that long-lived OAuth
 *      token for a short-lived Copilot "session" bearer token by POSTing to
 *      `https://api.github.com/copilot_internal/v2/token`.  The response
 *      contains `{ token, expires_at, ... }`; the token is valid for roughly
 *      30 minutes.
 *
 *   3. Finally the chat request itself is sent to
 *      `https://api.githubcopilot.com/chat/completions` with an OpenAI-style
 *      `messages` payload and a handful of Copilot-specific headers
 *      (`Editor-Version`, `Copilot-Integration-Id`, …).
 *
 * HOW TO OBTAIN A VALID OAUTH TOKEN:
 *   • Easiest: sign into the Copilot extension in VS Code, then copy the
 *     `oauth_token` field out of the `hosts.json` file mentioned above.
 *   • Or run the device-flow yourself — see the README for exact `curl`
 *     commands.
 *   • Or use a community proxy such as ericc-ch/copilot-api, which performs
 *     the device flow for you and exposes an OpenAI-compatible endpoint.
 *
 * ⚠️  This is unofficial. GitHub can change these endpoints / headers at any
 *     time and break the integration.  Intended for personal or educational
 *     use on *your own* Copilot subscription only.  Heavy automated usage
 *     may violate the GitHub Terms of Service and Acceptable Use Policies.
 */

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// Cached short-lived Copilot session token.
let cachedSession: { token: string; expiresAt: number } | null = null;

/**
 * Exchange the long-lived OAuth token for a short-lived Copilot session
 * bearer token.  The result is cached in memory until it is ~1 minute from
 * expiring, matching what the official extension does.
 */
async function getCopilotSessionToken(oauthToken: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedSession && cachedSession.expiresAt - 60 > now) {
    return cachedSession.token;
  }

  const res = await fetch("https://api.github.com/copilot_internal/v2/token", {
    method: "GET",
    headers: {
      Authorization: `token ${oauthToken}`,
      "User-Agent": "GithubCopilot/1.155.0",
      "Editor-Version": "vscode/1.94.0",
      "Editor-Plugin-Version": "copilot-chat/0.22.0",
      Accept: "application/json",
    },
    // Don't cache inside the fetch runtime — we cache ourselves.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to obtain Copilot session token (${res.status}): ${body.slice(0, 300)}`,
    );
  }

  const data: { token: string; expires_at: number } = await res.json();
  cachedSession = { token: data.token, expiresAt: data.expires_at };
  return data.token;
}

export interface CopilotChatOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  stream?: boolean;
}

/**
 * Send a chat completion request to the Copilot backend.
 * Returns the raw `Response` so the caller can pipe streaming bodies.
 */
export async function copilotChatCompletion(
  opts: CopilotChatOptions,
): Promise<Response> {
  const oauthToken = process.env.COPILOT_OAUTH_TOKEN;
  if (!oauthToken) {
    throw new Error(
      "COPILOT_OAUTH_TOKEN is not configured. See .env.example for instructions.",
    );
  }

  const sessionToken = await getCopilotSessionToken(oauthToken);

  // Default to GPT-4o, which Copilot Chat exposes on all subscription tiers.
  const model = opts.model ?? "gpt-4o";

  return fetch("https://api.githubcopilot.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
      Accept: opts.stream ? "text/event-stream" : "application/json",
      // These headers mimic the VS Code Copilot Chat extension; the server
      // rejects requests without a recognised Editor/Integration id.
      "Editor-Version": "vscode/1.94.0",
      "Editor-Plugin-Version": "copilot-chat/0.22.0",
      "Copilot-Integration-Id": "vscode-chat",
      "OpenAI-Intent": "conversation-panel",
      "User-Agent": "GithubCopilot/1.155.0",
    },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.3,
      top_p: 1,
      n: 1,
      stream: Boolean(opts.stream),
    }),
  });
}

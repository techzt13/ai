# GitHub Copilot — Normal Mode

A self-hosted, dark-themed chat UI for **GitHub Copilot Chat** that runs your
conversations through a custom _"normal / raw" system prompt_ — direct,
concise, technically useful, minus the corporate preamble.

- 🔐 **GitHub OAuth login** via NextAuth.js (Auth.js v5)
- 💬 **Copilot Chat** proxied through a lightweight, OpenAI-compatible API
  route
- 🧠 **Custom system prompt** you can view and edit from a settings sidebar
- 🌙 Dark, zinc/neutral UI with blue/green Copilot-style accents
- ✍️ Markdown rendering + syntax-highlighted code blocks
- ⌨️ Enter-to-send, auto-scroll, typing indicator, responsive on mobile

Built with **Next.js 15 (App Router) + TypeScript + Tailwind CSS +
shadcn/ui + lucide-react**.

> ⚠️ **This app uses an unofficial Copilot endpoint.** GitHub does not publish
> a public chat API for third-party frontends. The integration may break if
> GitHub changes its endpoints or headers. Intended for **personal /
> educational use on your own Copilot subscription only**. Heavy or abusive
> use may violate the [GitHub Terms of Service](https://docs.github.com/site-policy/github-terms)
> and the [Acceptable Use Policies](https://docs.github.com/site-policy/acceptable-use-policies).

---

## Folder structure

```
ai/
├── .env.example
├── .gitignore
├── README.md
├── components.json               # shadcn/ui config
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── src/
    ├── auth.ts                   # NextAuth v5 (GitHub provider)
    ├── middleware.ts             # Auth gate for every route
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx              # Chat page (auth-gated)
    │   ├── login/page.tsx        # Sign-in screen
    │   └── api/
    │       ├── auth/[...nextauth]/route.ts
    │       └── chat/route.ts     # Copilot proxy (OpenAI-compatible)
    ├── components/
    │   ├── chat.tsx              # Main chat client component
    │   ├── header.tsx            # Top bar (brand + user + logout)
    │   ├── message.tsx           # Message bubble + markdown/code rendering
    │   ├── sidebar.tsx           # System-prompt editor / chat controls
    │   └── ui/                   # shadcn primitives (button, input, …)
    └── lib/
        ├── constants.ts          # DEFAULT_SYSTEM_PROMPT
        ├── copilot.ts            # Token exchange + Copilot chat call
        └── utils.ts              # cn()
```

---

## Setup

### 1. Create a GitHub OAuth App

1. Visit <https://github.com/settings/developers> → **OAuth Apps** → _New OAuth App_.
2. Fill in:
   - **Application name:** `Copilot Normal Mode` (anything)
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
3. Save. Copy the **Client ID** and generate a **Client Secret**.

### 2. Get a Copilot OAuth token

The Copilot chat endpoints require a token issued to the official Copilot
client (`client_id = Iv1.b507a08c87ecfe98`). Any of these approaches work:

**Option A — copy it from VS Code (easiest):**

1. Install the GitHub Copilot extension in VS Code and sign in.
2. Open the hosts file:
   - macOS / Linux: `~/.config/github-copilot/hosts.json`
   - Windows: `%AppData%\github-copilot\hosts.json`
3. Copy the `oauth_token` value (starts with `ghu_…`).

**Option B — run the GitHub device flow yourself:**

```bash
# 1. Request a device + user code
curl -s -X POST https://github.com/login/device/code \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{"client_id":"Iv1.b507a08c87ecfe98","scope":"read:user"}'

# Follow the user_code instructions in the response, then:

# 2. Poll for the access token (repeat until it returns a token)
curl -s -X POST https://github.com/login/oauth/access_token \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{"client_id":"Iv1.b507a08c87ecfe98","device_code":"<device_code_from_step_1>","grant_type":"urn:ietf:params:oauth:grant-type:device_code"}'
```

**Option C — use a community proxy** such as
[`ericc-ch/copilot-api`](https://github.com/ericc-ch/copilot-api), which
performs the device flow for you and exposes an OpenAI-compatible endpoint.
If you go this route, point `src/lib/copilot.ts` at the proxy's base URL
instead of `https://api.githubcopilot.com`.

The account that owns this token must have an **active Copilot subscription**
(Pro, Business, or Enterprise).

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```ini
AUTH_SECRET=…                 # openssl rand -base64 32
AUTH_GITHUB_ID=…              # from step 1
AUTH_GITHUB_SECRET=…          # from step 1
COPILOT_OAUTH_TOKEN=ghu_…     # from step 2
```

### 4. Install and run

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and sign in with GitHub.

---

## How it works

1. **Auth.** `src/auth.ts` configures NextAuth v5 with the GitHub provider.
   `src/middleware.ts` gates every route behind a valid session and redirects
   unauthenticated visitors to `/login`.
2. **Composer.** The chat client (`src/components/chat.tsx`) keeps an
   in-memory list of messages, trims it to the last 20 turns, and POSTs them
   to `/api/chat` with the user's custom system prompt.
3. **Proxy.** `src/app/api/chat/route.ts` validates the request, strips any
   client-supplied `system` message, prepends the user's system prompt, and
   forwards the conversation through `src/lib/copilot.ts`.
4. **Copilot call.** `src/lib/copilot.ts` exchanges the long-lived
   `COPILOT_OAUTH_TOKEN` for a short-lived Copilot session token
   (`POST https://api.github.com/copilot_internal/v2/token`), caches it, and
   then POSTs the conversation to
   `https://api.githubcopilot.com/chat/completions` with the headers the
   official VS Code extension sends.
5. **Render.** The response comes back in OpenAI's `choices[0].message.content`
   format, which `src/components/message.tsx` renders with
   `react-markdown` + `react-syntax-highlighter`.

## Customising the system prompt

Open the settings sidebar (the ⚙︎ icon to the left of the composer) to view
and edit the prompt. Your edits are saved in `localStorage`; the default
lives in `src/lib/constants.ts` (`DEFAULT_SYSTEM_PROMPT`) and can be restored
from the sidebar at any time.

## Scripts

```bash
npm run dev     # start Next.js in dev mode
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## Caveats & warnings

- **Unofficial.** The Copilot endpoints used here are the internal ones that
  the VS Code Copilot extension calls. They have no stability guarantees
  and may change without notice.
- **Your token, your subscription.** Only use your own Copilot token. The
  token is a secret — never commit it and never expose the `/api/chat` route
  to untrusted users.
- **Terms of service.** Treat this as you would any other personal use of
  Copilot. Don't automate heavy workloads, don't resell access, and don't
  use it for anything that would violate the [GitHub Acceptable Use
  Policies](https://docs.github.com/site-policy/acceptable-use-policies).
- **Not production-ready.** No database, no rate limiting, no streaming
  responses. The goal is an MVP you can run locally.

## License

MIT — personal / educational use.

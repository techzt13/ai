"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Send, Settings, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Message, TypingIndicator, type UIMessage } from "@/components/message";
import { Sidebar } from "@/components/sidebar";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/constants";

// Max number of previous turns (user+assistant pairs) to send as context.
const MAX_HISTORY_MESSAGES = 20;
const LS_PROMPT_KEY = "copilot-normal.systemPrompt";

interface OpenAIChoice {
  message?: { role: string; content: string };
  delta?: { content?: string };
}
interface OpenAIResponse {
  choices?: OpenAIChoice[];
  error?: string | { message?: string };
}

export function Chat() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [promptHydrated, setPromptHydrated] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load the saved custom system prompt from localStorage (client only).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LS_PROMPT_KEY);
      if (saved && saved.trim().length > 0) setSystemPrompt(saved);
    } catch {
      /* ignore storage errors (SSR, privacy mode, …) */
    } finally {
      setPromptHydrated(true);
    }
  }, []);

  // Persist prompt changes — only after we've hydrated from storage, to
  // avoid clobbering a saved value with the default on first mount.
  useEffect(() => {
    if (!promptHydrated) return;
    try {
      window.localStorage.setItem(LS_PROMPT_KEY, systemPrompt);
    } catch {
      /* ignore */
    }
  }, [systemPrompt, promptHydrated]);

  // Auto-scroll to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const canSend = input.trim().length > 0 && !sending;

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    // Build request history: existing messages + the new user message,
    // trimmed to the last N for context.
    const history = [...messages, userMsg].slice(-MAX_HISTORY_MESSAGES);

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data: OpenAIResponse = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data?.error === "string"
            ? data.error
            : data?.error?.message ?? `Request failed (${res.status})`;
        throw new Error(msg);
      }

      const reply = data.choices?.[0]?.message?.content ?? "";
      if (!reply) throw new Error("Copilot returned an empty response.");

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
      // Return focus to the input for snappy conversational flow.
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [input, messages, sending, systemPrompt]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const empty = messages.length === 0;

  const sidebarProps = useMemo(
    () => ({
      systemPrompt,
      onSystemPromptChange: setSystemPrompt,
      onResetPrompt: () => setSystemPrompt(DEFAULT_SYSTEM_PROMPT),
      onClearChat: () => {
        setMessages([]);
        setError(null);
      },
    }),
    [systemPrompt],
  );

  return (
    <div className="relative flex min-h-0 flex-1">
      {/* Message column */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          aria-live="polite"
        >
          {empty ? (
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900">
                <Sparkles className="h-6 w-6 text-copilot-blue" />
              </div>
              <h2 className="text-lg font-semibold">
                GitHub Copilot, unfiltered.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask anything. Replies run through a custom &quot;normal
                mode&quot; system prompt — direct, concise, and focused on
                being useful.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl py-2">
              {messages.map((m) => (
                <Message key={m.id} message={m} />
              ))}
              {sending && <TypingIndicator />}
              {error && (
                <div className="mx-4 my-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:mx-6">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-zinc-800 bg-zinc-950/80 p-3 backdrop-blur sm:p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setSidebarOpen(true)}
              title="Settings"
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
            </Button>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask Copilot anything…  (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="max-h-48 min-h-[44px] resize-none bg-zinc-900"
              disabled={sending}
            />

            <Button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!canSend}
              size="icon"
              className="shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
            Unofficial integration. Personal / educational use on your own
            Copilot subscription only.
          </p>
        </div>
      </div>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        {...sidebarProps}
      />
    </div>
  );
}

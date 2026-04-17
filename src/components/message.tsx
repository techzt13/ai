"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Bot, User } from "lucide-react";

import { cn } from "@/lib/utils";

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/**
 * Render a single chat message.  User messages are right-aligned blue
 * bubbles; assistant messages are left-aligned dark-gray bubbles with full
 * Markdown + syntax-highlighted code blocks.
 */
export function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full animate-fade-in gap-3 px-4 py-3 sm:px-6",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-copilot-green">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm sm:max-w-[75%]",
          isUser
            ? "rounded-br-md bg-copilot-blue text-white"
            : "rounded-bl-md bg-zinc-900 text-zinc-100",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="markdown break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className ?? "");
                  const isBlock =
                    className?.includes("language-") ||
                    String(children).includes("\n");
                  if (!isBlock) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <SyntaxHighlighter
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      style={oneDark as any}
                      language={match?.[1] ?? "text"}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        padding: "0.9rem 1rem",
                        background: "#0b0b0f",
                        fontSize: "0.85rem",
                      }}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-copilot-blue/20 text-copilot-blue">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

/** Three-dot typing indicator for the assistant. */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-copilot-green">
        <Bot className="h-4 w-4" />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-zinc-900 px-4 py-3">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-blink rounded-full bg-zinc-500 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-blink rounded-full bg-zinc-500 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-blink rounded-full bg-zinc-500 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

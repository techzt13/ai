"use client";

import { Eraser, RotateCcw, Settings, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/constants";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
  onResetPrompt: () => void;
  onClearChat: () => void;
}

/**
 * Collapsible settings sidebar — visible on desktop, drawer-style on mobile.
 * Lets the user edit the custom system prompt, reset it to the sensible
 * default, and clear the current chat.
 */
export function Sidebar({
  open,
  onClose,
  systemPrompt,
  onSystemPromptChange,
  onResetPrompt,
  onClearChat,
}: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-zinc-800 bg-zinc-950 transition-transform",
          "md:static md:z-auto md:max-w-xs md:translate-x-0",
          open ? "translate-x-0" : "translate-x-full md:translate-x-full md:hidden",
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Settings className="h-4 w-4 text-copilot-blue" />
            Settings
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="system-prompt"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                System prompt
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onResetPrompt}
                disabled={systemPrompt === DEFAULT_SYSTEM_PROMPT}
                title="Reset to default"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => onSystemPromptChange(e.target.value)}
              rows={18}
              className="resize-none font-mono text-[12.5px] leading-relaxed"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              Prepended to every Copilot conversation. Saved locally in your
              browser.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Chat
            </h3>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onClearChat}
            >
              <Eraser className="mr-2 h-4 w-4" />
              Clear conversation
            </Button>
          </section>
        </div>

        <footer className="border-t border-zinc-800 p-4 text-[11px] leading-relaxed text-muted-foreground">
          Uses an unofficial GitHub Copilot endpoint. Personal / educational
          use on your own subscription only.
        </footer>
      </aside>
    </>
  );
}

import { LogOut, Sparkles } from "lucide-react";

import { signOut } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  const initials =
    (user.name ?? user.email ?? "?")
      .split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-copilot-blue" />
        <h1 className="text-sm font-semibold sm:text-base">
          GitHub Copilot{" "}
          <span className="text-copilot-blue">— Normal Mode</span>
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium leading-tight">
            {user.name ?? user.email}
          </div>
          {user.email && user.name && (
            <div className="text-xs text-muted-foreground leading-tight">
              {user.email}
            </div>
          )}
        </div>
        <Avatar>
          {user.image ? (
            <AvatarImage src={user.image} alt={user.name ?? "avatar"} />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}

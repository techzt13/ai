import { Github } from "lucide-react";

import { signIn, auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            GitHub Copilot <span className="text-copilot-blue">— Normal Mode</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Sign in with GitHub to start chatting. Requires an active
            Copilot subscription (Pro, Business, or Enterprise).
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/" });
            }}
          >
            <Button type="submit" className="w-full" variant="default">
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

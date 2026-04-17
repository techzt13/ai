import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Chat } from "@/components/chat";
import { Header } from "@/components/header";

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-dvh flex-col">
      <Header user={session.user} />
      <Chat />
    </div>
  );
}

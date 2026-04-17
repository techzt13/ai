import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitHub Copilot — Normal Mode",
  description:
    "Self-hosted GitHub Copilot chat UI with a custom 'normal/raw' system prompt.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-background text-foreground">{children}</body>
    </html>
  );
}

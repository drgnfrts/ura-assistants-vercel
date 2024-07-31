import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/app/components/lib/utils";
import { AI } from "./lib/actions";
import { Header } from "./components/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Feedback Analytics Assistant",
  description:
    "An assistant chatbot for URA feedback analytics, with OpenAI's Assistants API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AI initialAIState={{ threadId: "", messages: [], generating: false }}>
      <html lang="en">
        <body className={cn(inter.className, "overscroll-none bg-neutral-900")}>
          <Header />
          <main className="flex flex-col flex-1 bg-muted/50">{children}</main>
        </body>
      </html>
    </AI>
  );
}

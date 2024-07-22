import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/app/components/lib/utils";
import { AI } from "./lib/actions";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
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
          {children}
        </body>
      </html>
    </AI>
  );
}

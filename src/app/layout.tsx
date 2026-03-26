import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AgentScore — How optimized is your Claude Code setup?",
  description:
    "Score your agent ecosystem across 6 dimensions. Share your profile. Discover how others build.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-[#0a0a0f] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecallRoom | Evidence-backed recall investigations",
  description:
    "Trace a recalled ingredient into every affected batch and shipment. Resolve gaps, inspect evidence, and export an investigation packet.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

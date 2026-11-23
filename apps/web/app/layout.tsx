import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "The Daily Pulse — Lifestyle, Finance, Technology & Breaking News",
    template: "%s | The Daily Pulse",
  },
  description:
    "The Daily Pulse — original reporting and curated news across lifestyle, personal finance, technology and breaking news.",
  openGraph: {
    siteName: "The Daily Pulse",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

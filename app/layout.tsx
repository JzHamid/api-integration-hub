import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "API Integration Hub | Jazhem Hamid",
  description:
    "Portfolio-ready API console showcasing Next.js route handlers, external integrations, webhooks, and Zod validation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

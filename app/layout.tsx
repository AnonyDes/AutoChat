import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoChat - WhatsApp Business Automation",
  description: "WhatsApp Business automation SaaS powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}

import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consilium — A council of AI analysts that trades on SoDEX",
  description: "Consilium is an agentic hedge fund built on SoSoValue and SoDEX. Research → insight → execution in one agent loop.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

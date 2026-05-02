import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SoSoFund — AI Hedge Fund on SoSoValue",
  description: "Crypto-native AI hedge fund. Research → insight → execution.",
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

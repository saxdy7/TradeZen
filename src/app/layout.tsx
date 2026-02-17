import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeZen | AI-Powered Crypto Trading Mentor",
  description:
    "Your intelligent cryptocurrency trading companion. Get real-time market data, AI-powered insights, and professional trading tools.",
  keywords: ["crypto", "trading", "AI", "mentor", "bitcoin", "ethereum"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-[family-name:var(--font-inter)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

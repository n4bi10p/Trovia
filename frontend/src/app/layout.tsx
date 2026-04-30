import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { WalletProvider } from "@/context/WalletContext";
import { SolPriceProvider } from "@/context/SolPriceContext";

export const metadata: Metadata = {
  title: "Trovia — AI Agent Marketplace on Solana",
  description:
    "Deploy autonomous AI agents with on-chain security. Trade, automate, and earn on Solana's most advanced agent marketplace.",
  keywords: ["AI agents", "Solana", "marketplace", "DeFi", "automation", "blockchain"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <WalletProvider>
          <SolPriceProvider>
            <Nav />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </SolPriceProvider>
        </WalletProvider>
      </body>
    </html>
  );
}

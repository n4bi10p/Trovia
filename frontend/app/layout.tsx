import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/components/WalletProvider';
import { Nav } from '@/components/Nav';
import VoicePanel from '@/components/VoicePanel';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Trovia — On-Chain AI Agent Marketplace',
  description: 'Deploy, discover, and activate AI agents on Solana. Pay in SOL, run on Gemini.',
  keywords: ['AI agents', 'Solana', 'marketplace', 'blockchain', 'Gemini AI'],
  openGraph: {
    title: 'Trovia — On-Chain AI Agent Marketplace',
    description: 'The decentralized App Store for AI agents on Solana.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg-base text-text-primary">
        <WalletProvider>
          <Nav />
          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
          <footer className="border-t border-border py-6 text-center text-text-muted text-sm">
            Trovia · Built on Solana Devnet · DevClash 2026
          </footer>
          <VoicePanel />
        </WalletProvider>
      </body>
    </html>
  );
}

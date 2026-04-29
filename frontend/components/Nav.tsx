'use client';
// AMAN — Navigation bar
// Logo + nav links + WalletConnect

import Link from 'next/link';
import { WalletConnect } from './WalletConnect';

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-bg-base/80 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-text-primary hover:text-primary transition-colors">
          <span className="text-2xl">🏪</span>
          Trovia
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/marketplace" className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium">
            Marketplace
          </Link>
          <Link href="/dashboard" className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium">
            Dashboard
          </Link>
          <Link href="/publish" className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium">
            Publish
          </Link>
        </div>

        {/* Wallet */}
        <WalletConnect />
      </div>
    </nav>
  );
}

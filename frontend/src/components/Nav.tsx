"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/context/WalletContext";

const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#marketplace", label: "Marketplace" },
  { href: "#dashboard", label: "Dashboard" },
  { href: "#publish", label: "Publish" },
];

export default function Nav() {
  const { connected, connecting, address, connect, disconnect } = useWallet();

  // For a pure SPA, we'll rely on smooth scrolling and hover states instead of active pathname
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
      style={{ background: "rgba(10, 10, 8, 0.8)", backdropFilter: "blur(20px)" }}
    >
      {/* Logo */}
      <Link href="#home" className="flex items-center gap-2 no-underline">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="2" y="2" width="10" height="10" rx="2" fill="#D4A853" opacity="0.9" />
          <rect x="16" y="2" width="10" height="10" rx="2" fill="#D4A853" opacity="0.6" />
          <rect x="2" y="16" width="10" height="10" rx="2" fill="#D4A853" opacity="0.6" />
          <rect x="16" y="16" width="10" height="10" rx="2" fill="#D4A853" opacity="0.3" />
        </svg>
        <span className="text-lg font-bold" style={{ color: "#F5F5F0" }}>
          Trovia
        </span>
      </Link>

      {/* Center Nav Links */}
      <div className="glass-pill flex items-center gap-1 px-2 py-1.5">
        {NAV_LINKS.map((link) => {
          return (
            <a
              key={link.href}
              href={link.href}
              className="relative px-5 py-2 text-sm font-medium no-underline transition-colors hover:text-[#D4A853] text-[#888880]"
              style={{
                borderRadius: "999px",
              }}
            >
              {link.label}
            </a>
          );
        })}
      </div>

      {/* Wallet Button */}
      {connected ? (
        <button
          onClick={disconnect}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all"
          style={{
            borderRadius: "999px",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            background: "rgba(16, 185, 129, 0.06)",
            color: "#F5F5F0",
            cursor: "pointer",
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: "#10B981" }}
          />
          <span style={{ fontFamily: "monospace", fontSize: "13px" }}>
            {address}
          </span>
          <span
            className="ml-1 text-xs font-semibold"
            style={{
              color: "#10B981",
              background: "rgba(16, 185, 129, 0.12)",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            Devnet
          </span>
        </button>
      ) : (
        <button
          onClick={connect}
          disabled={connecting}
          className="px-5 py-2.5 text-sm font-semibold transition-all"
          style={{
            borderRadius: "999px",
            border: "1px solid rgba(212, 168, 83, 0.4)",
            background: "rgba(212, 168, 83, 0.08)",
            color: "#D4A853",
            cursor: "pointer",
          }}
        >
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </nav>
  );
}

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface WalletState {
  address: string | null;
  balance: number | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState>({
  address: null,
  balance: null,
  connected: false,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      // Check if Phantom is installed
      const phantom = (window as unknown as { solana?: { isPhantom: boolean; connect: () => Promise<{ publicKey: { toString: () => string } }>; } }).solana;
      if (phantom?.isPhantom) {
        const response = await phantom.connect();
        const addr = response.publicKey.toString();
        setAddress(addr);
        setConnected(true);
        // Mock balance for devnet
        setBalance(4.82);
      } else {
        // Fallback: simulate connection for demo
        const mockAddr = "7znV8...4kF2";
        setAddress(mockAddr);
        setConnected(true);
        setBalance(4.82);
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
      // Fallback demo
      setAddress("7znV8...4kF2");
      setConnected(true);
      setBalance(4.82);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    setConnected(false);
  }, []);

  useEffect(() => {
    // Auto-reconnect if Phantom is available
    const phantom = (window as unknown as { solana?: { isPhantom: boolean; isConnected: boolean; connect: (opts: { onlyIfTrusted: boolean }) => Promise<{ publicKey: { toString: () => string } }>; } }).solana;
    if (phantom?.isPhantom && phantom.isConnected) {
      phantom.connect({ onlyIfTrusted: true }).then((resp) => {
        setAddress(resp.publicKey.toString());
        setConnected(true);
        setBalance(4.82);
      }).catch(() => {});
    }
  }, []);

  return (
    <WalletContext.Provider value={{ address, balance, connected, connecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}

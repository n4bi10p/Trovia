'use client';
// AMAN — WalletProvider context
// Wraps the app with Phantom wallet state. Use useWallet() hook in any component.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { connectWallet, disconnectWallet, getSOLBalance, getWalletAddress, isConnected } from '@/lib/wallet';

interface WalletContextType {
  address: string | null;
  balance: number | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  address: null, balance: null, connected: false, connecting: false,
  connect: async () => {}, disconnect: async () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);

  const refreshBalance = useCallback(async (addr: string) => {
    try {
      const bal = await getSOLBalance(addr);
      setBalance(bal);
    } catch { setBalance(null); }
  }, []);

  // Auto-reconnect on page reload if Phantom is already connected
  useEffect(() => {
    const addr = getWalletAddress();
    if (addr) { setAddress(addr); refreshBalance(addr); }
  }, [refreshBalance]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
      await refreshBalance(addr);
    } finally {
      setConnecting(false);
    }
  }, [refreshBalance]);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setAddress(null);
    setBalance(null);
  }, []);

  return (
    <WalletContext.Provider value={{ address, balance, connected: !!address, connecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

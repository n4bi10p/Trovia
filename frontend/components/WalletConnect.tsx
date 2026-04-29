'use client';
// AMAN — WalletConnect button component
// Shows connect button or connected state (address + balance)

import { useWallet } from './WalletProvider';
import { shortenAddress } from '@/lib/wallet';

export function WalletConnect() {
  const { address, balance, connected, connecting, connect, disconnect } = useWallet();

  if (connected && address) {
    return (
      <div className="flex items-center gap-3">
        {/* Network badge */}
        <span className="badge bg-success/20 text-success text-xs">Devnet</span>
        {/* Balance */}
        {balance !== null && (
          <span className="text-sm text-text-muted font-mono">
            {balance.toFixed(3)} SOL
          </span>
        )}
        {/* Address + disconnect */}
        <button
          onClick={disconnect}
          className="btn-secondary text-sm py-1.5 px-4 font-mono"
          title="Click to disconnect"
        >
          {shortenAddress(address)}
        </button>
      </div>
    );
  }

  return (
    <button
      id="wallet-connect-btn"
      onClick={connect}
      disabled={connecting}
      className="btn-primary text-sm py-2 px-5"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

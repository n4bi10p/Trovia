"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SolPriceState {
  solPriceUSD: number | null;
  loading: boolean;
}

const SolPriceContext = createContext<SolPriceState>({
  solPriceUSD: null,
  loading: true,
});

export function SolPriceProvider({ children }: { children: React.ReactNode }) {
  const [solPriceUSD, setSolPriceUSD] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
        );
        const data = await res.json();
        setSolPriceUSD(data.solana.usd);
      } catch {
        // Fallback price if API fails
        setSolPriceUSD(178.42);
      } finally {
        setLoading(false);
      }
    }
    fetchPrice();
  }, []);

  return (
    <SolPriceContext.Provider value={{ solPriceUSD, loading }}>
      {children}
    </SolPriceContext.Provider>
  );
}

export function useSolPrice() {
  return useContext(SolPriceContext);
}

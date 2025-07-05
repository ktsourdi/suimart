'use client';
import { ReactNode } from "react";
import { WalletProvider } from "@mysten/wallet-kit";

interface WalletContextProviderProps {
  children: ReactNode;
}

export function WalletContextProvider({ children }: WalletContextProviderProps) {
  // The provider from @mysten/wallet-kit already includes common wallets.
  return <WalletProvider>{children}</WalletProvider>;
}
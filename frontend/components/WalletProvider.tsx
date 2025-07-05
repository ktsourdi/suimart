'use client';
import { ReactNode } from "react";
import { WalletKitProvider } from "@mysten/wallet-kit";

interface WalletContextProviderProps {
  children: ReactNode;
}

export function WalletContextProvider({ children }: WalletContextProviderProps) {
  // WalletKitProvider wraps the app and provides wallet context/hooks.
  return <WalletKitProvider>{children}</WalletKitProvider>;
}

export default WalletContextProvider;
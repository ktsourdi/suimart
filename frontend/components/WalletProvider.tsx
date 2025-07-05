'use client';
import { ReactNode } from "react";
import { WalletProvider } from "@mysten/wallet-kit";

export function WalletContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  // The provider from @mysten/wallet-kit already includes common wallets.
  return <WalletProvider>{children}</WalletProvider>;
}
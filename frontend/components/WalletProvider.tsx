'use client';
import '@mysten/dapp-kit/dist/index.css';
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createNetworkConfig, SuiClientProvider, WalletProvider as DappWalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { SUI_NETWORK } from '../lib/config';

interface WalletContextProviderProps {
  children: ReactNode;
}

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
});

export function WalletContextProvider({ children }: WalletContextProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet'}>
        <DappWalletProvider>
          {children}
        </DappWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default WalletContextProvider;
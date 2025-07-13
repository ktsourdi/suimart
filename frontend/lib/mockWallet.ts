import { useState, useCallback } from 'react';
import { MOCK_WALLET_ADDRESS, MOCK_WALLET_NAME } from './config';

export interface MockAccount {
  address: string;
  publicKey: string;
  chains: string[];
  features: string[];
  version: string;
  label?: string;
  icon?: string;
}

export interface MockWalletKit {
  currentAccount: MockAccount | null;
  accounts: MockAccount[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndExecuteTransactionBlock: (options: any) => Promise<any>;
  signTransactionBlock: (options: any) => Promise<any>;
  signMessage: (options: any) => Promise<any>;
  isConnected: boolean;
  isLoading: boolean;
}

export function useMockWalletKit(): MockWalletKit {
  const [currentAccount, setCurrentAccount] = useState<MockAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mockAccount: MockAccount = {
    address: MOCK_WALLET_ADDRESS,
    publicKey: 'mock-public-key',
    chains: ['sui:mainnet'],
    features: ['sui:signAndExecuteTransactionBlock'],
    version: '1.0.0',
    label: MOCK_WALLET_NAME,
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iMTIiIGZpbGw9IiM2NjY2NjYiLz4KPHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgMkM4LjIwOTEgMiAxMCA0IDYgNkM0IDYgMiA0IDIgMkM2IDIgNiAyIDYgMloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4K'
  };

  const connect = useCallback(async () => {
    setIsLoading(true);
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentAccount(mockAccount);
    setIsLoading(false);
  }, []);

  const disconnect = useCallback(async () => {
    setIsLoading(true);
    // Simulate disconnection delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setCurrentAccount(null);
    setIsLoading(false);
  }, []);

  const signAndExecuteTransactionBlock = useCallback(async (options: any) => {
    if (!currentAccount) {
      throw new Error('Wallet not connected');
    }
    
    // Simulate transaction execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      digest: 'mock-transaction-digest',
      effects: {
        status: { status: 'success' },
        gasUsed: { computationCost: '1000', storageCost: '100', storageRebate: '50' }
      },
      events: [],
      objectChanges: [],
      balanceChanges: []
    };
  }, [currentAccount]);

  const signTransactionBlock = useCallback(async (options: any) => {
    if (!currentAccount) {
      throw new Error('Wallet not connected');
    }
    
    // Simulate transaction signing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      signature: 'mock-signature',
      transactionBlockBytes: 'mock-transaction-bytes'
    };
  }, [currentAccount]);

  const signMessage = useCallback(async (options: any) => {
    if (!currentAccount) {
      throw new Error('Wallet not connected');
    }
    
    // Simulate message signing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      signature: 'mock-message-signature',
      signatureScheme: 'ED25519'
    };
  }, [currentAccount]);

  return {
    currentAccount,
    accounts: currentAccount ? [currentAccount] : [],
    connect,
    disconnect,
    signAndExecuteTransactionBlock,
    signTransactionBlock,
    signMessage,
    isConnected: !!currentAccount,
    isLoading
  };
}
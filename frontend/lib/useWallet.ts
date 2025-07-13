import { useWalletKit } from '@mysten/wallet-kit';
import { useMockWalletKit } from './mockWallet';
import { MOCK_MODE } from './config';

export function useWallet() {
  if (MOCK_MODE) {
    return useMockWalletKit();
  }
  
  return useWalletKit();
}
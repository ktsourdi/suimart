import { MOCK_MODE } from './config';
import { useMockWalletKit } from './mockWallet';
import { useCurrentAccount, useSignAndExecuteTransaction, useSignTransaction, useSignPersonalMessage } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

export function useWallet() {
  // Call hooks unconditionally at the top level
  const mockKit = useMockWalletKit();
  const currentAccount = useCurrentAccount();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const signTransaction = useSignTransaction();
  const signMessage = useSignPersonalMessage();

  if (MOCK_MODE) {
    return mockKit;
  }

  return {
    currentAccount,
    accounts: currentAccount ? [currentAccount] : [],
    connect: async () => { /* use <ConnectButton /> UI for dapp-kit; no-op here */ },
    disconnect: async () => { /* handled by dapp-kit UI; no-op here */ },
    signAndExecuteTransactionBlock: async ({ transactionBlock }: { transactionBlock: Transaction }) => {
      const res = await signAndExecuteTransaction.mutateAsync({ transaction: transactionBlock });
      return res;
    },
    signTransactionBlock: async ({ transactionBlock }: { transactionBlock: Transaction }) => {
      const res = await signTransaction.mutateAsync({ transaction: transactionBlock });
      return res;
    },
    signMessage: async ({ messageBytes }: { messageBytes: Uint8Array }) => {
      const res = await signMessage.mutateAsync({ message: messageBytes });
      return res;
    },
    isConnected: !!currentAccount,
    isLoading: false,
  } as any;
}
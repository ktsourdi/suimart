declare module "@mysten/wallet-kit" {
  import { ReactNode } from "react";
  export interface WalletAccount {
    address: string;
    publicKey?: string;
  }

  export interface SignAndExecuteTxInput {
    transactionBlock: any;
    options?: Record<string, any>;
  }

  export interface WalletKitContext {
    /** Currently connected account */
    currentAccount: WalletAccount | null;
    /** Connect wallet UI */
    connect: () => Promise<void>;
    /** Sign + execute a TransactionBlock */
    signAndExecuteTransactionBlock: (
      input: SignAndExecuteTxInput
    ) => Promise<any>;
  }

  /** React hook to access wallet context */
  export function useWalletKit(): WalletKitContext;

  /** Provider wrapping children with wallet context */
  export function WalletProvider({
    children,
  }: {
    children: ReactNode;
  }): JSX.Element;
}
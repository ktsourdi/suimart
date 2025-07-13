/// <reference types="node" />

// Allowed networks for Sui RPCs – extend as needed.
export const ALLOWED_NETWORKS = [
  "devnet",
  "testnet",
  "mainnet",
] as const;

export type SuiNetwork = (typeof ALLOWED_NETWORKS)[number];

// Directly reference the public environment variables. Next.js will replace these
// at build time, so no `process` global access is required in the browser bundle.
// Fallbacks are provided for robustness during local development or when the
// variable is not yet configured.
export const PACKAGE_ID: string =
  process.env.NEXT_PUBLIC_MARKETPLACE_PACKAGE ??
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const rawNetwork =
  (process.env.NEXT_PUBLIC_SUI_NETWORK as string | undefined) ?? "devnet";

if (!ALLOWED_NETWORKS.includes(rawNetwork as SuiNetwork)) {
  throw new Error(
    `Invalid NEXT_PUBLIC_SUI_NETWORK: ${rawNetwork}. Must be one of ${ALLOWED_NETWORKS.join(", ")}`
  );
}

export const SUI_NETWORK: SuiNetwork = rawNetwork as SuiNetwork;

// Mock mode configuration
export const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true' || 
  process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_MARKETPLACE_PACKAGE;

// Mock wallet configuration
export const MOCK_WALLET_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
export const MOCK_WALLET_NAME = "Mock Wallet";
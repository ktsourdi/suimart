/// <reference types="node" />

const { NEXT_PUBLIC_MARKETPLACE_PACKAGE, NEXT_PUBLIC_SUI_NETWORK } = process.env;

if (!NEXT_PUBLIC_MARKETPLACE_PACKAGE) {
  throw new Error(
    "NEXT_PUBLIC_MARKETPLACE_PACKAGE env variable is required but was not provided."
  );
}

export const PACKAGE_ID: string = NEXT_PUBLIC_MARKETPLACE_PACKAGE;

export const ALLOWED_NETWORKS = [
  "devnet",
  "testnet",
  "mainnet",
] as const;

export type SuiNetwork = typeof ALLOWED_NETWORKS[number];

const networkEnv = (NEXT_PUBLIC_SUI_NETWORK ?? "devnet") as string;

if (!ALLOWED_NETWORKS.includes(networkEnv as SuiNetwork)) {
  throw new Error(
    `Invalid NEXT_PUBLIC_SUI_NETWORK value: ${networkEnv}. Must be one of ${ALLOWED_NETWORKS.join(", ")}`
  );
}

export const SUI_NETWORK: SuiNetwork = networkEnv as SuiNetwork;
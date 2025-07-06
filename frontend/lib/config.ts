/// <reference types="node" />

// Allowed networks for Sui RPCs – extend as needed.
export const ALLOWED_NETWORKS = [
  "devnet",
  "testnet",
  "mainnet",
] as const;

export type SuiNetwork = (typeof ALLOWED_NETWORKS)[number];

interface RuntimeEnv {
  NEXT_PUBLIC_MARKETPLACE_PACKAGE: string;
  NEXT_PUBLIC_SUI_NETWORK?: string;
}

function getEnv(): RuntimeEnv {
  // Narrow the NodeJS.ProcessEnv type to our keys for safer access
  const env = process.env as NodeJS.ProcessEnv & Partial<RuntimeEnv>;

  // Use fallback for development/build purposes
  const packageId = env.NEXT_PUBLIC_MARKETPLACE_PACKAGE || "0x0000000000000000000000000000000000000000000000000000000000000000";

  return {
    NEXT_PUBLIC_MARKETPLACE_PACKAGE: packageId,
    NEXT_PUBLIC_SUI_NETWORK: env.NEXT_PUBLIC_SUI_NETWORK,
  };
}

const { NEXT_PUBLIC_MARKETPLACE_PACKAGE, NEXT_PUBLIC_SUI_NETWORK } = getEnv();

export const PACKAGE_ID: string = NEXT_PUBLIC_MARKETPLACE_PACKAGE;

function isSuiNetwork(value: string): value is SuiNetwork {
  return (ALLOWED_NETWORKS as readonly string[]).includes(value);
}

const resolvedNetworkRaw = NEXT_PUBLIC_SUI_NETWORK ?? "devnet";

if (!isSuiNetwork(resolvedNetworkRaw)) {
  throw new Error(
    `Invalid NEXT_PUBLIC_SUI_NETWORK: ${resolvedNetworkRaw}. Must be one of ${ALLOWED_NETWORKS.join(", ")}`
  );
}

export const SUI_NETWORK: SuiNetwork = resolvedNetworkRaw;
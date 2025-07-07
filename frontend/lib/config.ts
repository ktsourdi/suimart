/// <reference types="node" />

// Allowed networks for Sui RPCs – extend as needed.
export const ALLOWED_NETWORKS = [
  "devnet",
  "testnet",
  "mainnet",
] as const;

export type SuiNetwork = (typeof ALLOWED_NETWORKS)[number];

// -----------------------------
// Environment helpers
// -----------------------------

/**
 * Next.js replaces every occurence of `process.env.NEXT_PUBLIC_*` with the
 * literal value at build-time. In a browser bundle the global `process` object
 * does **not** exist, so we have to be careful never to access it dynamically
 * (e.g. `Object.keys(process.env)` or similar).
 *
 * By referencing each variable directly we let Next.js inline the value and we
 * stay compatible with both server and client runtimes.
 */

// Marketplace Move package published on chain (public, safe to expose)
export const PACKAGE_ID: string =
  process.env.NEXT_PUBLIC_MARKETPLACE_PACKAGE ?? "";

if (!PACKAGE_ID) {
  throw new Error(
    "Environment variable NEXT_PUBLIC_MARKETPLACE_PACKAGE is required but missing."
  );
}

// Selected Sui network – falls back to devnet.
const RAW_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK ?? "devnet";

export const SUI_NETWORK: SuiNetwork = ALLOWED_NETWORKS.includes(
  RAW_NETWORK as SuiNetwork
)
  ? (RAW_NETWORK as SuiNetwork)
  : "devnet";
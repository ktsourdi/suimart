# Suimart

Suimart is a peer-to-peer marketplace dApp built on the **Sui blockchain**. It lets anyone list digital objects at a fixed price, browse all active listings, buy an item on-chain, or cancel their own listings.

## Project structure

```
contracts/   # Move smart contracts
frontend/    # Next.js 14 + TypeScript + Tailwind UI
```

## Prerequisites

1. **Rust** + `cargo` (for building Move)
2. **Sui CLI** – follow the official docs: <https://docs.sui.io/cli/install-sui>
3. **Node.js** ≥ 18 and **pnpm**/npm/yarn

## Getting started

### 1. Contracts

```bash
cd contracts
# Build & run Move unit tests
sui move test

# Publish to devnet (will print the package ID)
sui client publish --gas-budget 100000000
```

Copy the printed package ID – you'll need it in the frontend.

### 2. Frontend

```bash
cd frontend
pnpm install   # or npm install / yarn

# Start dev server on http://localhost:3000
pnpm dev
```

Create a `.env.local` file under `frontend/` with:

```
NEXT_PUBLIC_SUI_NETWORK=devnet      # or testnet/mainnet
NEXT_PUBLIC_MARKETPLACE_PACKAGE=<PASTE_PUBLISHED_PACKAGE_ID>
```

### 3. Interacting

1. Open the site and connect a Sui wallet (Suiet, Surf, …) via the **Mysten wallet-adapter**.
2. Click "List Item" and sign the transaction to create a new on-chain listing.
3. Buy an item from the list or cancel a listing you own.

## License

MIT © 2025 Suimart

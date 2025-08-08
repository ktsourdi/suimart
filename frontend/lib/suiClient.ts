import { PACKAGE_ID } from './config';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { SUI_NETWORK } from './config';

export interface CreateListingInput {
  // Placeholder: real typed item object ref must be passed
  // For now, assume the item object ID and type string are provided
  itemType: string;
  itemObjectId: string;
  price: number;
  title: string;
  description: string;
  category: string;
}

export interface CreateAuctionInput extends CreateListingInput {
  minBid: number;
  durationMs: number;
}

export function useSuiClient() {
  const client = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });
  const signer = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();

  const moduleTarget = (fn: string) => `${PACKAGE_ID}::marketplace::${fn}`;

  return {
    client,

    async getListings(): Promise<any[]> {
      // TODO: Implement by querying events / shared objects from PACKAGE_ID.
      // Returning an empty array as a placeholder for real-mode;
      // UI falls back to mock when MOCK_MODE=true.
      return [];
    },

    async createListing(input: CreateListingInput) {
      const tx = new Transaction();
      const item = tx.object(input.itemObjectId);
      tx.moveCall({
        target: moduleTarget('list_item'),
        typeArguments: [input.itemType],
        arguments: [
          item,
          tx.pure.u64(Math.floor(input.price * 1_000_000_000)),
          tx.pure.string(input.title),
          tx.pure.string(input.description),
          tx.pure.string(input.category),
        ],
      });
      return signer.mutateAsync({ transaction: tx });
    },

    async createAuction(input: CreateAuctionInput) {
      const tx = new Transaction();
      const item = tx.object(input.itemObjectId);
      tx.moveCall({
        target: moduleTarget('create_auction'),
        typeArguments: [input.itemType],
        arguments: [
          item,
          tx.pure.u64(Math.floor(input.price * 1_000_000_000)),
          tx.pure.u64(Math.floor(input.minBid * 1_000_000_000)),
          tx.pure.u64(input.durationMs),
          tx.pure.string(input.title),
          tx.pure.string(input.description),
          tx.pure.string(input.category),
        ],
      });
      return signer.mutateAsync({ transaction: tx });
    },

    async buyItem(listingObjectId: string, itemType: string, priceInSui: number) {
      const tx = new Transaction();
      const listing = tx.object(listingObjectId);
      const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(Math.floor(priceInSui * 1_000_000_000))]);
      tx.moveCall({
        target: moduleTarget('buy_item'),
        typeArguments: [itemType],
        arguments: [listing, payment],
      });
      return signer.mutateAsync({ transaction: tx });
    },

    async placeBid(listingObjectId: string, itemType: string, bidInSui: number) {
      const tx = new Transaction();
      const listing = tx.object(listingObjectId);
      const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(Math.floor(bidInSui * 1_000_000_000))]);
      tx.moveCall({
        target: moduleTarget('place_bid'),
        typeArguments: [itemType],
        arguments: [listing, payment],
      });
      return signer.mutateAsync({ transaction: tx });
    },

    async endAuction(listingObjectId: string, itemType: string) {
      const tx = new Transaction();
      const listing = tx.object(listingObjectId);
      tx.moveCall({
        target: moduleTarget('end_auction'),
        typeArguments: [itemType],
        arguments: [listing],
      });
      return signer.mutateAsync({ transaction: tx });
    },
  };
}
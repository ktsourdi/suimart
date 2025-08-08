import { PACKAGE_ID } from './config';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { SUI_NETWORK } from './config';
import { useQuery } from '@tanstack/react-query';

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
  useCurrentAccount();

  const moduleTarget = (fn: string) => `${PACKAGE_ID}::marketplace::${fn}`;

  return {
    client,

    async getListings(): Promise<any[]> {
      // Fetch recent ListingCreated events, then read the listing objects that still exist
      const resp = await client.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::marketplace::ListingCreated` },
        order: 'descending',
        limit: 100,
      });

      const events = resp.data || [];
      const ids = events
        .map((e: any) => {
          const j = (e.parsedJson || {}) as any;
          return j.listing_id || j.listingId || j.listingID;
        })
        .filter(Boolean) as string[];

      const uniqueIds = Array.from(new Set(ids));

      const objects = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const obj = await client.getObject({ id, options: { showContent: true } });
            return { id, obj };
          } catch (e) {
            return { id, obj: null };
          }
        })
      );

      const readOption = <T,>(opt: any): T | undefined => {
        if (!opt) return undefined;
        // Common Sui Option JSON shape
        if (typeof opt === 'object' && 'fields' in opt) {
          const f = (opt as any).fields;
          if (f && 'some' in f) return f.some as T;
          if (f && 'none' in f) return undefined;
        }
        // Sometimes plain value or null
        return opt as T;
      };

      const listings = objects
        .filter(({ obj }) => obj && (obj as any).data && (obj as any).data.content)
        .map(({ id, obj }) => {
          const data = (obj as any).data;
          const content = data.content as any;
          const typeStr: string = content.type;
          const fields = content.fields as any;
          const typeArg = typeStr.includes('<') ? typeStr.slice(typeStr.indexOf('<') + 1, typeStr.lastIndexOf('>')) : '';

          // Try to source from the corresponding event for createdAt/title/category/price
          const evt = events.find((e: any) => {
            const j = (e.parsedJson || {}) as any;
            const eid = j.listing_id || j.listingId || j.listingID;
            return eid === id;
          }) as any;
          const evJson = (evt?.parsedJson || {}) as any;
          const tsMs = evt?.timestampMs ? Number(evt.timestampMs) : Date.now();

          const priceRaw: number = Number(evJson.price ?? fields.price ?? 0);
          const priceSui = priceRaw / 1_000_000_000;
          const isAuction: boolean = Boolean(evJson.is_auction ?? fields.is_auction ?? false);

          const auctionEndSeconds = readOption<number>(fields.auction_end_time);
          const currentBidRaw = readOption<number>(fields.current_bid);
          const highestBidderAddr = readOption<string>(fields.highest_bidder);

          return {
            listing_id: id,
            price: priceSui,
            seller: (evJson.seller ?? fields.seller ?? '').toString(),
            itemType: typeArg,
            title: (evJson.title ?? fields.title ?? '').toString(),
            description: (fields.description ?? '').toString(),
            category: (evJson.category ?? fields.category ?? '').toString(),
            createdAt: tsMs,
            updatedAt: tsMs,
            views: Number(fields.views ?? 0),
            favorites: Number(fields.favorites ?? 0),
            isAuction,
            auctionEndTime: auctionEndSeconds ? auctionEndSeconds * 1000 : undefined,
            currentBid: currentBidRaw ? currentBidRaw / 1_000_000_000 : undefined,
            highestBidder: highestBidderAddr,
            imageUrl: undefined,
            status: 'active' as const,
          };
        });

      return listings;
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

    async cancelListing(listingObjectId: string, itemType: string) {
      const tx = new Transaction();
      const listing = tx.object(listingObjectId);
      tx.moveCall({
        target: moduleTarget('cancel_listing'),
        typeArguments: [itemType],
        arguments: [listing],
      });
      return signer.mutateAsync({ transaction: tx });
    },
  };
}

export function useListings() {
  const sui = useSuiClient();
  return useQuery({
    queryKey: ['listings', SUI_NETWORK, PACKAGE_ID],
    queryFn: () => sui.getListings(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
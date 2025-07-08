'use client';
import { useWalletKit } from "@mysten/wallet-kit";
import { JsonRpcProvider, TransactionBlock } from "@mysten/sui.js";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PACKAGE_ID } from "../lib/config";
import { Button } from "./ui/button";
import { ModeToggle } from "./ModeToggle";

interface ListingData {
  listing_id: string;
  price: number;
  seller: string;
  itemType: string;
}

function WalletStatus({ currentAccount, connect }: { currentAccount: any, connect: () => void }) {
  return (
    <div className="flex items-center gap-4">
      {currentAccount ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-400 truncate max-w-[150px]">
            {currentAccount.address}
          </span>
        </div>
      ) : (
        <Button onClick={connect}>
          Connect Wallet
        </Button>
      )}
      <ModeToggle />
    </div>
  );
}

function ListingCard({ listing, onBuy, isBuying }: { listing: ListingData, onBuy: (listing: ListingData) => void, isBuying: boolean }) {
  return (
    <div className="border rounded-lg p-4 flex flex-col justify-between bg-card text-card-foreground shadow-md transition-all hover:shadow-lg">
      <div className="mb-4">
        <div className="aspect-square bg-muted rounded-md mb-2"></div>
        <p className="font-mono text-sm truncate" title={listing.listing_id}>ID: {listing.listing_id}</p>
        <p className="font-semibold text-lg">{listing.price} SUI</p>
        <p className="text-xs text-muted-foreground truncate" title={listing.itemType}>Type: {listing.itemType}</p>
      </div>
      <Button
        className="w-full"
        onClick={() => onBuy(listing)}
        disabled={isBuying}
      >
        {isBuying ? "Buying…" : "Buy"}
      </Button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border rounded-lg p-4 flex flex-col justify-between bg-card text-card-foreground shadow-md">
      <div className="mb-4">
        <div className="aspect-square bg-muted rounded-md mb-2 animate-pulse"></div>
        <div className="h-5 bg-muted rounded w-3/4 mb-2 animate-pulse"></div>
        <div className="h-6 bg-muted rounded w-1/2 mb-2 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
      </div>
      <div className="h-10 bg-muted rounded w-full animate-pulse"></div>
    </div>
  );
}

export default function HomeClient() {
  const {
    currentAccount,
    connect,
    signAndExecuteTransactionBlock,
  } = useWalletKit();

  const [listings, setListings] = useState<ListingData[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<JsonRpcProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize provider only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rpcProvider = new JsonRpcProvider("https://fullnode.devnet.sui.io");
      setProvider(rpcProvider);
    }
  }, []);

  useEffect(() => {
    async function fetchListings() {
      // Skip fetching if provider is not initialized or PACKAGE_ID is not set
      if (!provider || !PACKAGE_ID || PACKAGE_ID === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        console.log("Provider not initialized or PACKAGE_ID not configured, skipping listings fetch");
        setIsLoading(false);
        return;
      }

      try {
        const events = await provider.queryEvents({
          // Filter for ListingCreated events emitted by our package
          MoveEventType: `${PACKAGE_ID}::marketplace::ListingCreated`,
        });
        const mapped: ListingData[] = await Promise.all(
          events.data.map(async (e: any) => {
            const listingId = e.parsedJson.listing_id as string;
            const obj = await provider.getObject({
              id: listingId,
              options: { showType: true },
            });
            const fullType = obj.data?.type as string;
            // Extract the generic parameter between < and >
            const itemType = fullType?.match(/<(.+)>/)?.[1] ?? "unknown";
            return {
              listing_id: listingId,
              price: Number(e.parsedJson.price) / 1e9,
              seller: e.parsedJson.seller,
              itemType,
            };
          })
        );
        setListings(mapped);
      } catch (error) {
        console.error("Error fetching listings:", error);
        setErrorMessage("Failed to fetch listings. Please check your configuration.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
  }, [provider]);

  const handleBuy = async (listing: ListingData): Promise<void> => {
    if (!currentAccount) {
      await connect();
      return;
    }

    const priceMist = BigInt(Math.round(listing.price * 1e9));
    const txb = new TransactionBlock();
    const payment = txb.splitCoins(txb.gas, [txb.pure(priceMist)]);
    txb.moveCall({
      target: `${PACKAGE_ID}::marketplace::buy_item<${listing.itemType}>`,
      arguments: [txb.object(listing.listing_id), payment],
    });

    setBuyingId(listing.listing_id);
    setErrorMessage(null);
    try {
      await signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: { showEffects: true },
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(
        (err as Error)?.message ?? "Transaction failed. Please try again."
      );
    } finally {
      setBuyingId(null);
    }
  };

  const isMarketplaceConfigured = PACKAGE_ID && PACKAGE_ID !== "0x0000000000000000000000000000000000000000000000000000000000000000";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-auto flex items-center gap-4">
            <h1 className="text-2xl font-bold">Suimart</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/sell">
              <Button variant="outline">List an Item</Button>
            </Link>
            <WalletStatus currentAccount={currentAccount} connect={connect} />
          </div>
        </div>
      </header>

      <main className="container py-6">
        {!isMarketplaceConfigured && (
          <div className="mb-6 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-md">
            <p className="font-semibold">Configuration Required</p>
            <p className="text-sm">
              Please set the NEXT_PUBLIC_MARKETPLACE_PACKAGE environment variable to your deployed package ID.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : listings.length > 0 ? (
            listings.map((l) => (
              <ListingCard
                key={l.listing_id}
                listing={l}
                onBuy={handleBuy}
                isBuying={buyingId === l.listing_id}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <h2 className="text-2xl font-semibold">No active listings.</h2>
              <p className="text-muted-foreground mt-2">
                Check back later or list an item yourself!
              </p>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mt-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            <p className="font-semibold">An error occurred</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}
      </main>
    </div>
  );
} 
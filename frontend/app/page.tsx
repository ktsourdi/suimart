'use client';
import { useWalletKit } from "@mysten/wallet-kit";
import { JsonRpcProvider } from "@mysten/sui.js";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { PACKAGE_ID } from "../lib/config";

const provider = new JsonRpcProvider("https://fullnode.devnet.sui.io");

interface ListingData {
  listing_id: string;
  price: number;
  seller: string;
  itemType: string;
}

export default function Home() {
  const { currentAccount, connect, signAndExecuteTransactionBlock } = useWalletKit();
  const [listings, setListings] = useState<ListingData[]>([]);

  useEffect(() => {
    async function fetchListings() {
      if (!PACKAGE_ID) return;

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
    }

    fetchListings();
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Suimart</h1>
        {currentAccount ? (
          <span className="text-sm text-gray-600 truncate max-w-[150px]">
            {currentAccount.address}
          </span>
        ) : (
          <button
            onClick={connect}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Connect Wallet
          </button>
        )}
      </header>

      <Link
        href="/sell"
        className="inline-block bg-green-600 text-white px-4 py-2 rounded"
      >
        List an Item
      </Link>

      <section className="space-y-4">
        {listings.length === 0 && <p>No active listings.</p>}
        {listings.map((l) => (
          <div
            key={l.listing_id}
            className="border rounded p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-mono text-sm">ID: {l.listing_id}</p>
              <p className="font-semibold">Price: {l.price} SUI</p>
            </div>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => handleBuy(l)}
            >
              Buy
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}

async function handleBuy(listing: ListingData) {
  if (!currentAccount) {
    await connect();
    return;
  }

  const priceMist = BigInt(Math.round(listing.price * 1e9));
  const txb = new TransactionBlock();
  // Split gas coin to exact payment amount
  const payment = txb.splitCoins(txb.gas, [txb.pure(priceMist)]);
  txb.moveCall({
    target: `${PACKAGE_ID}::marketplace::buy_item<${listing.itemType}>`,
    arguments: [txb.object(listing.listing_id), payment],
  });

  await signAndExecuteTransactionBlock({
    transactionBlock: txb,
    options: { showEffects: true },
  });
}
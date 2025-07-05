'use client';
import { useWalletKit } from "@mysten/wallet-kit";
import { JsonRpcProvider } from "@mysten/sui.js";
import { useEffect, useState } from "react";
import Link from "next/link";

// @ts-nocheck

const provider = new JsonRpcProvider("https://fullnode.devnet.sui.io");

interface ListingEvent {
  listing_id: string;
  price: number;
  seller: string;
}

export default function Home() {
  const { currentAccount, connect } = useWalletKit();
  const [listings, setListings] = useState<ListingEvent[]>([]);

  useEffect(() => {
    async function fetchListings() {
      // TODO: Replace with your published package ID in env var
      const packageId = process.env.NEXT_PUBLIC_MARKETPLACE_PACKAGE ?? "";
      if (!packageId) return;

      const events = await provider.queryEvents({
        // Filter for ListingCreated events emitted by our package
        MoveEventType: `${packageId}::marketplace::ListingCreated`,
      });
      // Map raw events to useful shape
      const mapped = events.data.map((e: any) => ({
        listing_id: e.parsedJson.listing_id,
        price: Number(e.parsedJson.price) / 1e9, // Mist → SUI (if 10^9)
        seller: e.parsedJson.seller,
      }));
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
            <button className="bg-blue-500 text-white px-4 py-2 rounded">
              Buy
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Button from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { mockMarketplace, MockListing } from '../lib/mockData';
import { useWallet } from '../lib/useWallet';
import { MOCK_MODE } from '../lib/config';
import { useSuiClient } from '../lib/suiClient';
import { useToast } from './ToastProvider';
import Image from 'next/image';
import { categoryName, listingImage } from '../lib/categories';

export default function ListingClient() {
  const { currentAccount, connect } = useWallet();
  const sui = useSuiClient();
  // useSuiClient() returns a new object on every render; keep the latest in a ref
  // so the loader below runs once per listing id instead of on every render.
  const suiRef = useRef(sui);
  suiRef.current = sui;
  const { showToast } = useToast();

  const [listingId, setListingId] = useState<string>('');
  const [listing, setListing] = useState<MockListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const id = url.searchParams.get('id') || '';
      setListingId(id);
      if (!id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!listingId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const items = MOCK_MODE ? await mockMarketplace.getListings() : await suiRef.current.getListings();
      const found = items.find((l) => l.listing_id === listingId) || null;
      if (!mounted) return;
      setListing(found);
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [listingId]);

  const isOwner = useMemo(() => {
    return !!currentAccount && listing?.seller === currentAccount.address;
  }, [currentAccount, listing]);

  const timeRemaining = useMemo(() => {
    if (!listing?.isAuction || !listing.auctionEndTime) return null;
    const ms = Math.max(0, listing.auctionEndTime - Date.now());
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours}h ${minutes}m ${seconds}s`;
  }, [listing]);

  const refresh = async () => {
    const items = MOCK_MODE ? await mockMarketplace.getListings() : await sui.getListings();
    setListing(items.find((l) => l.listing_id === listingId) || null);
  };

  const handleBuy = async () => {
    if (!currentAccount || !listing) return;
    setActionLoading(true);
    try {
      if (MOCK_MODE) {
        await mockMarketplace.buyItem(listing.listing_id, currentAccount.address);
      } else {
        await sui.buyItem(listing.listing_id, listing.itemType, listing.price);
      }
      await refresh();
      showToast('success', 'Purchase successful.');
    } catch (e) {
      console.error(e);
      showToast('error', 'Purchase failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!currentAccount || !listing) return;
    setActionLoading(true);
    try {
      if (MOCK_MODE) {
        await mockMarketplace.cancelListing(listing.listing_id, currentAccount.address);
      } else {
        await sui.cancelListing(listing.listing_id, listing.itemType);
      }
      await refresh();
      showToast('success', 'Listing cancelled.');
    } catch (e) {
      console.error(e);
      showToast('error', 'Cancellation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBid = async () => {
    if (!currentAccount || !listing) return;
    const value = parseFloat(bidAmount);
    if (!isFinite(value) || value <= 0) {
      showToast('info', 'Enter a valid bid amount');
      return;
    }
    setActionLoading(true);
    try {
      if (MOCK_MODE) {
        await mockMarketplace.placeBid(listing.listing_id, value, currentAccount.address);
      } else {
        await sui.placeBid(listing.listing_id, listing.itemType, value);
      }
      await refresh();
      setBidAmount('');
      showToast('success', 'Bid placed.');
    } catch (e) {
      console.error(e);
      showToast('error', 'Bid failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndAuction = async () => {
    if (!listing) return;
    setActionLoading(true);
    try {
      if (MOCK_MODE) {
        await mockMarketplace.endAuction(listing.listing_id);
      } else {
        await sui.endAuction(listing.listing_id, listing.itemType);
      }
      await refresh();
      showToast('success', 'Auction ended.');
    } catch (e) {
      console.error(e);
      showToast('error', 'End auction failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse h-64 bg-[#f3f6f8] rounded-xl" />
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Listing not found</h1>
        <Link href="/">
          <Button variant="outline">Back to Marketplace</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Listing Details</h1>
        <Link href="/">
          <Button variant="outline" size="sm">Back</Button>
        </Link>
      </div>

      {MOCK_MODE && (
        <div className="inline-flex items-center px-3 py-1 bg-[#fff8e2] border border-[#f5cf54] rounded text-[#8d6e15] text-xs font-medium">
          Mock Mode - Demo Data
        </div>
      )}

      <Card>
        <div className="h-64 bg-gradient-to-br from-[#e1f3ff] to-[#f3f6f8] flex items-center justify-center overflow-hidden rounded-t-xl">
          <Image src={listingImage(listing)} alt={listing.title} width={800} height={400} className="w-full h-64 object-cover" priority />
        </div>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[#182435]">{listing.title}</h2>
              <p className="text-[#636871] mt-2">{listing.description}</p>
              <div className="mt-4 text-sm text-[#636871]">Category: {categoryName(listing.category)}</div>
            </div>
            <div className="sm:text-right shrink-0">
              <div className="text-3xl font-bold text-[#6fbcf0]">{listing.price.toFixed(2)} SUI</div>
              <div className="text-sm text-[#636871] mt-1">Seller: {listing.seller.slice(0,6)}...{listing.seller.slice(-4)}</div>
            </div>
          </div>

          {listing.isAuction && (
            <div className="mt-6 p-4 border rounded-lg bg-[#f8fafc]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#636871]">Current bid</div>
                  <div className="text-2xl font-semibold">{(listing.currentBid ?? listing.price).toFixed(2)} SUI</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#636871]">Ends in</div>
                  <div className="text-lg font-medium">{timeRemaining ?? 'Ended'}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  placeholder="Your bid"
                  className="flex-1 px-3 py-2 border rounded"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                {MOCK_MODE && !currentAccount ? (
                  <Button onClick={() => connect()}>Connect Demo Wallet</Button>
                ) : (
                  <Button onClick={handleBid} disabled={!currentAccount || actionLoading}>Place Bid</Button>
                )}
                <Button variant="outline" onClick={handleEndAuction} disabled={actionLoading}>End Auction</Button>
              </div>
            </div>
          )}

          {!listing.isAuction && (
            <div className="mt-6 flex gap-3">
              {MOCK_MODE && !currentAccount ? (
                <Button onClick={() => connect()}>Connect Demo Wallet</Button>
              ) : (
                <Button onClick={handleBuy} disabled={!currentAccount || actionLoading}>{currentAccount ? 'Buy Now' : 'Connect to Buy'}</Button>
              )}
              {isOwner && (
                <Button variant="outline" onClick={handleCancel} disabled={actionLoading}>Cancel</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
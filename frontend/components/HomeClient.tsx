'use client';
import { useWalletKit } from "@mysten/wallet-kit";
import { JsonRpcProvider, TransactionBlock } from "@mysten/sui.js";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { PACKAGE_ID, SUI_NETWORK } from "../lib/config";
import Card, { CardContent, CardHeader, CardTitle } from "./ui/Card";
import Button from "./ui/Button";
import Input from "./ui/Input";
import MarketStats from "./MarketStats";

interface ListingData {
  listing_id: string;
  price: number;
  seller: string;
  itemType: string;
  createdAt?: number;
}

type SortOption = 'price-asc' | 'price-desc' | 'newest' | 'oldest';

// Loading skeleton component
const ListingSkeleton = () => (
  <div className="animate-pulse">
    <div className="border rounded-lg p-6 space-y-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 ml-auto"></div>
    </div>
  </div>
);

// Theme toggle component
const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    }
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    const effectiveTheme = newTheme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : newTheme;
    
    root.classList.add(effectiveTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const newTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const icons = {
    light: '☀️',
    dark: '🌙',
    system: '💻'
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-accent transition-colors"
      title="Toggle theme"
    >
      <span className="text-xl">{icons[theme]}</span>
    </button>
  );
};

export default function HomeClient() {
  const {
    currentAccount,
    connect,
    signAndExecuteTransactionBlock,
  } = useWalletKit();

  const [listings, setListings] = useState<ListingData[]>([]);
  const [filteredListings, setFilteredListings] = useState<ListingData[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<JsonRpcProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showOnlyMyListings, setShowOnlyMyListings] = useState(false);

  // Initialize provider only on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const rpcProvider = new JsonRpcProvider({
        fullnode: `https://fullnode.${SUI_NETWORK}.sui.io`,
        websocket: `wss://fullnode.${SUI_NETWORK}.sui.io`,
      } as any);
      setProvider(rpcProvider);
    }
  }, []);

  const fetchListings = useCallback(async () => {
    if (!provider || !PACKAGE_ID || PACKAGE_ID === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      console.log("Provider not initialized or PACKAGE_ID not configured, skipping listings fetch");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const events = await provider.queryEvents({
        MoveEventType: `${PACKAGE_ID}::marketplace::ListingCreated`,
      });
      
      const mapped = await Promise.all(
        events.data.map(async (e: any): Promise<ListingData | null> => {
          const listingId = e.parsedJson.listing_id as string;
          
          try {
            const obj = await provider.getObject({
              id: listingId,
              options: { showType: true },
            });
            
            // Check if the listing still exists (not cancelled or bought)
            if (!obj.data) {
              return null;
            }
            
            const fullType = obj.data?.type as string;
            const itemType = fullType?.match(/<(.+)>/)?.[1] ?? "unknown";
            
            return {
              listing_id: listingId,
              price: Number(e.parsedJson.price) / 1e9,
              seller: e.parsedJson.seller,
              itemType,
              createdAt: e.timestampMs ? Number(e.timestampMs) : Date.now(),
            };
          } catch (error) {
            console.error(`Error fetching listing ${listingId}:`, error);
            return null;
          }
        })
      );
      
      const validListings = mapped.filter((listing: ListingData | null): listing is ListingData => listing !== null);
      setListings(validListings);
      setFilteredListings(validListings);
    } catch (error) {
      console.error("Error fetching listings:", error);
      setErrorMessage("Failed to fetch listings. Please check your configuration.");
    } finally {
      setIsLoading(false);
    }
  }, [provider, PACKAGE_ID]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Filter and sort listings
  useEffect(() => {
    let filtered = [...listings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.listing_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.itemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.seller.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Price range filter
    if (priceRange.min) {
      const minPrice = parseFloat(priceRange.min);
      filtered = filtered.filter(listing => listing.price >= minPrice);
    }
    if (priceRange.max) {
      const maxPrice = parseFloat(priceRange.max);
      filtered = filtered.filter(listing => listing.price <= maxPrice);
    }

    // My listings filter
    if (showOnlyMyListings && currentAccount) {
      filtered = filtered.filter(listing => listing.seller === currentAccount.address);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'newest':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'oldest':
          return (a.createdAt || 0) - (b.createdAt || 0);
        default:
          return 0;
      }
    });

    setFilteredListings(filtered);
  }, [listings, searchTerm, priceRange, sortOption, showOnlyMyListings, currentAccount]);

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
      // Refresh listings after successful purchase
      setTimeout(fetchListings, 1000);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        (err as Error)?.message ?? "Transaction failed. Please try again."
      );
    } finally {
      setBuyingId(null);
    }
  };

  const handleCancel = async (listing: ListingData): Promise<void> => {
    if (!currentAccount || listing.seller !== currentAccount.address) {
      return;
    }

    const txb = new TransactionBlock();
    txb.moveCall({
      target: `${PACKAGE_ID}::marketplace::cancel_listing<${listing.itemType}>`,
      arguments: [txb.object(listing.listing_id)],
    });

    setCancellingId(listing.listing_id);
    setErrorMessage(null);
    try {
      await signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: { showEffects: true },
      });
      // Refresh listings after successful cancellation
      setTimeout(fetchListings, 1000);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        (err as Error)?.message ?? "Failed to cancel listing. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const myListingsCount = useMemo(() => {
    if (!currentAccount) return 0;
    return listings.filter(l => l.seller === currentAccount.address).length;
  }, [listings, currentAccount]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Suimart
          </h1>
          <p className="text-muted-foreground mt-1">Decentralized marketplace on Sui</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {currentAccount ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
              </span>
              <Button variant="outline" size="sm" onClick={() => location.reload()}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={connect}>
              Connect Wallet
            </Button>
          )}
        </div>
      </header>

      {/* Actions and Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-4">
          <Link href="/sell">
            <Button variant="primary">
              List an Item
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => fetchListings()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-muted-foreground">
            Total Listings: <span className="font-semibold text-foreground">{listings.length}</span>
          </div>
          {currentAccount && (
            <div className="text-muted-foreground">
              My Listings: <span className="font-semibold text-foreground">{myListingsCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Search by ID, type, or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="lg:col-span-2"
            />
            <Input
              type="number"
              placeholder="Min price (SUI)"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              step="0.01"
            />
            <Input
              type="number"
              placeholder="Max price (SUI)"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              step="0.01"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex items-center gap-4">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              
              {currentAccount && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyMyListings}
                    onChange={(e) => setShowOnlyMyListings(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Show only my listings</span>
                </label>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredListings.length} listings
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Statistics */}
      {!isLoading && listings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Market Overview</h2>
          <MarketStats listings={listings} currentUserAddress={currentAccount?.address} />
        </div>
      )}

      {/* Configuration Warning */}
      {PACKAGE_ID === "0x0000000000000000000000000000000000000000000000000000000000000000" && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200">Configuration Required</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Please set the NEXT_PUBLIC_MARKETPLACE_PACKAGE environment variable to your deployed package ID.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Listings Grid */}
      <section className="space-y-4">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <ListingSkeleton key={i} />
            ))}
          </div>
        )}
        
        {!isLoading && filteredListings.length === 0 && !errorMessage && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm || priceRange.min || priceRange.max || showOnlyMyListings
                  ? "No listings match your filters."
                  : "No active listings available."}
              </p>
            </CardContent>
          </Card>
        )}
        
        {!isLoading && filteredListings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing) => (
              <Card key={listing.listing_id} className="animate-slide-up hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        #{listing.listing_id.slice(0, 8)}...
                      </span>
                      {listing.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(listing.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl font-bold">
                      {listing.price} SUI
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Type:</p>
                    <p className="font-mono text-xs break-all">{listing.itemType}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Seller:</p>
                    <p className="font-mono text-xs">
                      {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                      {currentAccount && listing.seller === currentAccount.address && (
                        <span className="ml-2 text-primary">(You)</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    {currentAccount && listing.seller === currentAccount.address ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => handleCancel(listing)}
                        loading={cancellingId === listing.listing_id}
                        disabled={cancellingId === listing.listing_id}
                      >
                        {cancellingId === listing.listing_id ? "Cancelling..." : "Cancel Listing"}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => handleBuy(listing)}
                        loading={buyingId === listing.listing_id}
                        disabled={buyingId === listing.listing_id}
                      >
                        {buyingId === listing.listing_id ? "Buying..." : "Buy Now"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {errorMessage && (
          <Card className="border-destructive">
            <CardContent className="p-4">
              <p className="text-destructive text-sm">{errorMessage}</p>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
} 
'use client';
import { useWallet } from "../lib/useWallet";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Card, { CardContent, CardHeader, CardTitle } from "./ui/Card";
import Button from "./ui/Button";
import Input from "./ui/Input";
import MarketStats from "./MarketStats";
import { mockMarketplace, MockListing } from "../lib/mockData";
import { MOCK_MODE } from "../lib/config";

interface ListingData {
  listing_id: string;
  price: number;
  seller: string;
  itemType: string;
  title?: string;
  description?: string;
  category?: string;
  createdAt?: number;
  updatedAt?: number;
  views?: number;
  favorites?: number;
  isAuction?: boolean;
  auctionEndTime?: number;
  currentBid?: number;
  highestBidder?: string;
  imageUrl?: string;
  status?: string;
}

type SortOption = 'price-asc' | 'price-desc' | 'newest' | 'oldest' | 'popular' | 'ending-soon';
type ViewMode = 'grid' | 'list';

// Categories for the marketplace
const CATEGORIES = [
  'All',
  'NFTs',
  'Gaming',
  'Art',
  'Collectibles',
  'Music',
  'Sports',
  'Technology',
  'Fashion',
  'Real Estate',
  'Other'
];

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
  } = useWallet();

  const [listings, setListings] = useState<ListingData[]>([]);
  const [filteredListings, setFilteredListings] = useState<ListingData[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showOnlyMyListings, setShowOnlyMyListings] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAuctionOnly, setShowAuctionOnly] = useState(false);
  const [showFixedPriceOnly, setShowFixedPriceOnly] = useState(false);

  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      const mockListings = await mockMarketplace.getListings();
      
      // Convert MockListing to ListingData format
      const convertedListings: ListingData[] = mockListings.map(listing => ({
        listing_id: listing.listing_id,
        price: listing.price,
        seller: listing.seller,
        itemType: listing.itemType,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
        views: listing.views,
        favorites: listing.favorites,
        isAuction: listing.isAuction,
        auctionEndTime: listing.auctionEndTime,
        currentBid: listing.currentBid,
        highestBidder: listing.highestBidder,
        imageUrl: listing.imageUrl,
        status: listing.status
      }));
      
      setListings(convertedListings);
      setFilteredListings(convertedListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setErrorMessage('Failed to fetch listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        listing.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(listing => listing.category === selectedCategory);
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

    // Auction/Fixed price filter
    if (showAuctionOnly) {
      filtered = filtered.filter(listing => listing.isAuction);
    }
    if (showFixedPriceOnly) {
      filtered = filtered.filter(listing => !listing.isAuction);
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
        case 'popular':
          return (b.favorites || 0) - (a.favorites || 0);
        case 'ending-soon':
          if (a.isAuction && b.isAuction) {
            return (a.auctionEndTime || 0) - (b.auctionEndTime || 0);
          }
          return a.isAuction ? -1 : 1;
        default:
          return 0;
      }
    });

    setFilteredListings(filtered);
  }, [listings, searchTerm, priceRange, sortOption, showOnlyMyListings, currentAccount, selectedCategory, showAuctionOnly, showFixedPriceOnly]);

  const handleBuy = async (listing: ListingData): Promise<void> => {
    if (!currentAccount) {
      await connect();
      return;
    }

    setBuyingId(listing.listing_id);
    setErrorMessage(null);
    try {
      await mockMarketplace.buyItem(listing.listing_id, currentAccount.address);
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

    setCancellingId(listing.listing_id);
    setErrorMessage(null);
    try {
      await mockMarketplace.cancelListing(listing.listing_id, currentAccount.address);
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

  const formatTimeLeft = (endTime?: number) => {
    if (!endTime) return '';
    const now = Date.now();
    const timeLeft = endTime * 1000 - now;
    if (timeLeft <= 0) return 'Ended';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Enhanced Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Suimart
          </h1>
          <p className="text-muted-foreground mt-1">Decentralized marketplace on Sui</p>
          {MOCK_MODE && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              Mock Mode - Demo Data
            </div>
          )}
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

      {/* Enhanced Actions and Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-4">
          <Link href="/sell">
            <Button variant="primary">
              List an Item
            </Button>
          </Link>
          <Link href="/auction">
            <Button variant="outline">
              Create Auction
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

      {/* Enhanced Filters and Search */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Search and Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Search by title, description, or seller..."
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
          
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Advanced Filters */}
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
                <option value="popular">Most Popular</option>
                <option value="ending-soon">Ending Soon</option>
              </select>
              
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAuctionOnly}
                    onChange={(e) => {
                      setShowAuctionOnly(e.target.checked);
                      if (e.target.checked) setShowFixedPriceOnly(false);
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">Auctions only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFixedPriceOnly}
                    onChange={(e) => {
                      setShowFixedPriceOnly(e.target.checked);
                      if (e.target.checked) setShowAuctionOnly(false);
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">Fixed price only</span>
                </label>
              </div>
              
              {currentAccount && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyMyListings}
                    onChange={(e) => setShowOnlyMyListings(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">My listings only</span>
                </label>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredListings.length} listings
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
      {/* This section is removed as per the edit hint to remove real contract interactions */}

      {/* Enhanced Listings Grid/List */}
      <section className="space-y-4">
        {isLoading && (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
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
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
            {filteredListings.map((listing) => (
              <Card key={listing.listing_id} className="animate-slide-up hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        #{listing.listing_id.slice(0, 8)}...
                      </span>
                      {listing.isAuction && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Auction
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold">
                      {listing.title || 'Untitled Item'}
                    </CardTitle>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {listing.price} SUI
                      </span>
                      {listing.isAuction && listing.auctionEndTime && (
                        <span className="text-xs text-muted-foreground">
                          Ends: {formatTimeLeft(listing.auctionEndTime)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {listing.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {listing.description}
                    </p>
                  )}
                  
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Category:</p>
                    <p className="font-medium">{listing.category || 'Other'}</p>
                  </div>
                  
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
                  
                  {listing.isAuction && listing.currentBid && (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">Current Bid:</p>
                      <p className="font-medium">{listing.currentBid} SUI</p>
                    </div>
                  )}
                  
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
                        {buyingId === listing.listing_id ? "Buying..." : listing.isAuction ? "Place Bid" : "Buy Now"}
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
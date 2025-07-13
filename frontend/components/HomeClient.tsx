'use client';
import { useWallet } from "../lib/useWallet";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
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
  status: 'active' | 'sold' | 'cancelled' | 'ended';
}

export default function HomeClient() {
  const {
    currentAccount,
    connect,
  } = useWallet();

  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const categories = [
    { id: "all", name: "All Categories", icon: "🎯" },
    { id: "nfts", name: "NFTs", icon: "🖼️" },
    { id: "gaming", name: "Gaming", icon: "🎮" },
    { id: "art", name: "Art", icon: "🎨" },
    { id: "collectibles", name: "Collectibles", icon: "💎" },
    { id: "music", name: "Music", icon: "🎵" },
    { id: "sports", name: "Sports", icon: "⚽" },
    { id: "virtual-worlds", name: "Virtual Worlds", icon: "🌍" },
  ];

  const sortOptions = [
    { id: "newest", name: "Newest First" },
    { id: "oldest", name: "Oldest First" },
    { id: "price-low", name: "Price: Low to High" },
    { id: "price-high", name: "Price: High to Low" },
    { id: "popular", name: "Most Popular" },
  ];

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockListings = await mockMarketplace.getListings();
      setListings(mockListings);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filteredAndSortedListings = useMemo(() => {
    let filtered = listings.filter((listing) => {
      const matchesSearch = listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          listing.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          listing.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || listing.category === selectedCategory;
      
      return matchesSearch && matchesCategory && listing.status === 'active';
    });

    switch (sortBy) {
      case "oldest":
        filtered.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        break;
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default: // newest
        filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return filtered;
  }, [listings, searchTerm, selectedCategory, sortBy]);

  const handleBuy = async (listingId: string) => {
    if (!currentAccount) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      await mockMarketplace.buyItem(listingId, currentAccount.address);
      alert("Purchase successful! The item has been transferred to your wallet.");
      fetchListings(); // Refresh listings
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("Purchase failed. Please try again.");
    }
  };

  const handleCancel = async (listingId: string) => {
    if (!currentAccount) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      await mockMarketplace.cancelListing(listingId, currentAccount.address);
      alert("Listing cancelled successfully!");
      fetchListings(); // Refresh listings
    } catch (error) {
      console.error("Cancellation failed:", error);
      alert("Cancellation failed. Please try again.");
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} SUI`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-gradient">
                Suimart
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              The premier marketplace for Sui blockchain assets. Discover, buy, and sell unique digital items with unparalleled ease.
            </p>
            {MOCK_MODE && (
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700 rounded-2xl text-amber-800 dark:text-amber-200 text-sm font-medium mb-8 animate-bounce-in">
                <span className="w-3 h-3 bg-amber-500 rounded-full mr-3 animate-pulse"></span>
                Mock Mode - Demo Environment
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              {!currentAccount ? (
                <Button onClick={connect} size="xl" variant="gradient" glow className="text-lg">
                  Connect Wallet
                </Button>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-700/50">
                  <span className="text-gray-600 dark:text-gray-300">Connected:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-slate-700 px-4 py-2 rounded-xl">
                    {formatAddress(currentAccount.address)}
                  </span>
                </div>
              )}
              <Link href="/sell">
                <Button variant="glass" size="xl" className="text-lg">
                  Sell Your Item
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <MarketStats />
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="glass-effect rounded-3xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Search Items</label>
              <Input
                type="text"
                placeholder="Search by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sort */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card-hover glass-effect rounded-2xl p-6 animate-pulse">
                <div className="skeleton h-48 rounded-xl mb-4"></div>
                <div className="skeleton h-4 rounded mb-2"></div>
                <div className="skeleton h-4 rounded w-3/4 mb-4"></div>
                <div className="skeleton h-6 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedListings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">�</div>
            <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No items found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search criteria or browse all categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedListings.map((listing, index) => (
              <div
                key={listing.listing_id}
                className="card-hover glass-effect rounded-2xl p-6 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative mb-4">
                  <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-4xl">
                      {listing.category === 'nfts' ? '🖼️' :
                       listing.category === 'gaming' ? '🎮' :
                       listing.category === 'art' ? '🎨' :
                       listing.category === 'collectibles' ? '💎' :
                       listing.category === 'music' ? '🎵' :
                       listing.category === 'sports' ? '⚽' :
                       listing.category === 'virtual-worlds' ? '�' : '📦'}
                    </span>
                  </div>
                  {listing.isAuction && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      Auction
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-2">
                    {listing.title || `${listing.itemType} #${listing.listing_id.slice(-6)}`}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {listing.description || "A unique digital item on the Sui blockchain."}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gradient">
                      {formatPrice(listing.price)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {listing.views || 0} views
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Seller: {formatAddress(listing.seller)}
                  </div>
                  
                  {listing.createdAt && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Listed: {formatDate(listing.createdAt)}
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleBuy(listing.listing_id)}
                      size="sm"
                      variant="primary"
                      className="flex-1"
                    >
                      Buy Now
                    </Button>
                    {currentAccount && listing.seller === currentAccount.address && (
                      <Button
                        onClick={() => handleCancel(listing.listing_id)}
                        size="sm"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 
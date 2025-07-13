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
    { id: "all", name: "All Categories" },
    { id: "nfts", name: "NFTs" },
    { id: "gaming", name: "Gaming" },
    { id: "art", name: "Art" },
    { id: "collectibles", name: "Collectibles" },
    { id: "music", name: "Music" },
    { id: "sports", name: "Sports" },
    { id: "virtual-worlds", name: "Virtual Worlds" },
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
    <main className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e1f3ff]">
      {/* Header Section */}
      <div className="bg-white border-b border-[#e3e6e8]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#6fbcf0] to-[#0284ad] bg-clip-text text-transparent">
                Suimart
              </span>
            </h1>
            <p className="text-xl text-[#636871] mb-8 max-w-2xl mx-auto">
              The premier marketplace for Sui blockchain assets. Buy, sell, and discover unique digital items.
            </p>
            {MOCK_MODE && (
              <div className="inline-flex items-center px-4 py-2 bg-[#fff8e2] border border-[#f5cf54] rounded-lg text-[#8d6e15] text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-[#f5cf54] rounded-full mr-2"></span>
                Mock Mode - Demo Environment
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!currentAccount ? (
                <Button onClick={connect} size="lg" className="text-lg px-8 py-4">
                  Connect Wallet
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-[#636871]">Connected:</span>
                  <span className="font-mono text-[#182435] bg-[#f3f6f8] px-3 py-1 rounded">
                    {formatAddress(currentAccount.address)}
                  </span>
                </div>
              )}
              <Link href="/sell">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  Sell Your Item
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <MarketStats />
      </div>

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl border border-[#e3e6e8] p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:col-span-1"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border-2 border-[#cbd5e1] bg-white text-[#182435] rounded-lg transition-all duration-200 focus:outline-none focus:border-[#6fbcf0] focus:ring-2 focus:ring-[#6fbcf0] focus:ring-opacity-20"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border-2 border-[#cbd5e1] bg-white text-[#182435] rounded-lg transition-all duration-200 focus:outline-none focus:border-[#6fbcf0] focus:ring-2 focus:ring-[#6fbcf0] focus:ring-opacity-20"
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

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-[#f3f6f8] rounded-t-xl"></div>
                <CardContent>
                  <div className="h-4 bg-[#f3f6f8] rounded mb-2"></div>
                  <div className="h-3 bg-[#f3f6f8] rounded mb-4"></div>
                  <div className="h-6 bg-[#f3f6f8] rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedListings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-semibold text-[#182435] mb-2">No items found</h3>
            <p className="text-[#636871] mb-6">Try adjusting your search or filters</p>
            <Link href="/sell">
              <Button>List Your First Item</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedListings.map((listing) => (
              <Card key={listing.listing_id} variant="elevated" className="overflow-hidden">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-[#6fbcf0] to-[#0284ad] flex items-center justify-center">
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-white text-4xl">🎨</div>
                    )}
                    {listing.isAuction && (
                      <div className="absolute top-2 right-2 bg-[#f5cf54] text-[#8d6e15] px-2 py-1 rounded text-xs font-medium">
                        Auction
                      </div>
                    )}
                  </div>
                </div>
                <CardContent>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-[#182435] text-lg truncate">
                      {listing.title || "Untitled Item"}
                    </h3>
                    <span className="text-[#636871] text-sm">
                      {listing.category}
                    </span>
                  </div>
                  <p className="text-[#636871] text-sm mb-4 line-clamp-2">
                    {listing.description || "No description available"}
                  </p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-[#6fbcf0]">
                      {formatPrice(listing.price)}
                    </span>
                    <div className="flex items-center gap-2 text-[#636871] text-sm">
                      <span>👁 {listing.views || 0}</span>
                      <span>❤️ {listing.favorites || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[#636871] mb-4">
                    <span>Seller: {formatAddress(listing.seller)}</span>
                    <span>{formatDate(listing.createdAt || Date.now())}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleBuy(listing.listing_id)}
                      className="flex-1"
                      disabled={!currentAccount}
                    >
                      {currentAccount ? "Buy Now" : "Connect to Buy"}
                    </Button>
                    {currentAccount && listing.seller === currentAccount.address && (
                      <Button
                        variant="outline"
                        onClick={() => handleCancel(listing.listing_id)}
                        className="px-3"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 
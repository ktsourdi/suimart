'use client';

import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';

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
}

interface MarketStatsProps {
  listings: ListingData[];
  currentUserAddress?: string;
}

export default function MarketStats({ listings, currentUserAddress }: MarketStatsProps) {
  // Calculate statistics
  const totalListings = listings.length;
  const totalVolume = listings.reduce((sum, listing) => sum + listing.price, 0);
  const averagePrice = totalListings > 0 ? totalVolume / totalListings : 0;
  const auctionListings = listings.filter(listing => listing.isAuction);
  const fixedPriceListings = listings.filter(listing => !listing.isAuction);
  const activeAuctions = auctionListings.filter(listing => {
    if (!listing.auctionEndTime) return false;
    return listing.auctionEndTime * 1000 > Date.now();
  });
  
  // Category distribution
  const categoryStats = listings.reduce((acc, listing) => {
    const category = listing.category || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topCategories = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Price ranges
  const priceRanges = {
    'Under 1 SUI': listings.filter(l => l.price < 1).length,
    '1-10 SUI': listings.filter(l => l.price >= 1 && l.price < 10).length,
    '10-100 SUI': listings.filter(l => l.price >= 10 && l.price < 100).length,
    '100+ SUI': listings.filter(l => l.price >= 100).length,
  };

  // User stats
  const userListings = currentUserAddress 
    ? listings.filter(l => l.seller === currentUserAddress)
    : [];
  const userVolume = userListings.reduce((sum, listing) => sum + listing.price, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Listings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
          <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalListings}</div>
          <p className="text-xs text-muted-foreground">
            {fixedPriceListings.length} fixed price, {auctionListings.length} auctions
          </p>
        </CardContent>
      </Card>

      {/* Total Volume */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVolume.toFixed(2)} SUI</div>
          <p className="text-xs text-muted-foreground">
            Avg: {averagePrice.toFixed(2)} SUI per listing
          </p>
        </CardContent>
      </Card>

      {/* Active Auctions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Auctions</CardTitle>
          <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeAuctions.length}</div>
          <p className="text-xs text-muted-foreground">
            {auctionListings.length - activeAuctions.length} ended
          </p>
        </CardContent>
      </Card>

      {/* User Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Activity</CardTitle>
          <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userListings.length}</div>
          <p className="text-xs text-muted-foreground">
            {userVolume.toFixed(2)} SUI volume
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
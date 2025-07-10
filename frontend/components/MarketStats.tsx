'use client';

import { useMemo } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';

interface ListingData {
  listing_id: string;
  price: number;
  seller: string;
  itemType: string;
  createdAt?: number;
}

interface MarketStatsProps {
  listings: ListingData[];
  currentUserAddress?: string;
}

export default function MarketStats({ listings, currentUserAddress }: MarketStatsProps) {
  const stats = useMemo(() => {
    const totalVolume = listings.reduce((sum, listing) => sum + listing.price, 0);
    const avgPrice = listings.length > 0 ? totalVolume / listings.length : 0;
    
    const priceRange = listings.length > 0 ? {
      min: Math.min(...listings.map(l => l.price)),
      max: Math.max(...listings.map(l => l.price))
    } : { min: 0, max: 0 };
    
    const uniqueSellers = new Set(listings.map(l => l.seller)).size;
    const myListings = currentUserAddress 
      ? listings.filter(l => l.seller === currentUserAddress).length 
      : 0;
    
    // Group by item type
    const itemTypes = listings.reduce((acc, listing) => {
      const type = listing.itemType.split('::').pop() || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostListedType = Object.entries(itemTypes)
      .sort(([, a], [, b]) => b - a)[0];
    
    return {
      totalListings: listings.length,
      totalVolume,
      avgPrice,
      priceRange,
      uniqueSellers,
      myListings,
      mostListedType: mostListedType || ['None', 0],
      itemTypes
    };
  }, [listings, currentUserAddress]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Listings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalListings}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Active listings
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalVolume.toFixed(2)} SUI
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Combined value
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Average Price
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.avgPrice.toFixed(2)} SUI
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Per listing
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Price Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.priceRange.min.toFixed(1)} - {stats.priceRange.max.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Min - Max SUI
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
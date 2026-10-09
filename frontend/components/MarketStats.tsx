'use client';

import { useMemo } from 'react';
import { Card, CardContent } from './ui/Card';
import { MOCK_MODE } from '../lib/config';

interface MarketStatsProps {
  listings?: any[];
  currentUserAddress?: string;
}

export default function MarketStats({ listings = [], currentUserAddress }: MarketStatsProps) {
  const stats = useMemo(() => {
    const totalListings = listings.length;
    const activeListings = listings.filter(l => l.status === 'active').length;
    const totalValue = listings.reduce((sum, l) => sum + (l.price || 0), 0);
    const avgPrice = totalListings > 0 ? totalValue / totalListings : 0;
    const myListings = currentUserAddress 
      ? listings.filter(l => l.seller === currentUserAddress).length 
      : 0;
    const auctionListings = listings.filter(l => l.isAuction).length;
    const fixedPriceListings = listings.filter(l => !l.isAuction).length;

    return {
      totalListings,
      activeListings,
      totalValue,
      avgPrice,
      myListings,
      auctionListings,
      fixedPriceListings
    };
  }, [listings, currentUserAddress]);

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} SUI`;
  };

  // The three most recently created listings.
  const recentActivity = useMemo(
    () => [...listings].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 3),
    [listings]
  );

  const timeAgo = (timestamp?: number) => {
    if (!timestamp) return '';
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const statCards = [
    {
      title: 'Total Listings',
      value: stats.totalListings,
      icon: '📦',
      color: 'from-[#6fbcf0] to-[#0284ad]'
    },
    {
      title: 'Active Items',
      value: stats.activeListings,
      icon: '🟢',
      color: 'from-[#2dd7a7] to-[#008c65]'
    },
    {
      title: 'Total Value',
      value: formatPrice(stats.totalValue),
      icon: '💰',
      color: 'from-[#f5cf54] to-[#8d6e15]'
    },
    {
      title: 'Avg Price',
      value: formatPrice(stats.avgPrice),
      icon: '📊',
      color: 'from-[#ff794b] to-[#eb5a29]'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#182435] mb-2">Market Overview</h2>
        <p className="text-[#636871]">
          {MOCK_MODE
            ? 'Computed from the demo listings below'
            : 'Live statistics from the Suimart marketplace'}
        </p>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} variant="elevated" className="relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-5`}></div>
            <CardContent className="relative p-4 md:p-6">
              <div className="mb-3 md:mb-4">
                <div className="text-2xl">{stat.icon}</div>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-[#636871]">{stat.title}</h3>
                <p className="text-xl md:text-2xl font-bold text-[#182435]">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-gradient-to-br from-[#e1f3ff] to-[#f3f6f8] border-[#6fbcf0]">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-[#6fbcf0] rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🎯</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#636871]">Fixed Price</h3>
                <p className="text-xl font-bold text-[#182435]">{stats.fixedPriceListings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#fff8e2] to-[#f3f6f8] border-[#f5cf54]">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-[#f5cf54] rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#636871]">Auctions</h3>
                <p className="text-xl font-bold text-[#182435]">{stats.auctionListings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {currentUserAddress && (
          <Card className="bg-gradient-to-br from-[#d5f7ee] to-[#f3f6f8] border-[#2dd7a7]">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-[#2dd7a7] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">👤</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#636871]">My Listings</h3>
                  <p className="text-xl font-bold text-[#182435]">{stats.myListings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Market Activity */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-[#182435] mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[#636871]">No listings yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((l) => (
                <div key={l.listing_id} className="flex items-center justify-between gap-3 p-3 bg-[#f3f6f8] rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${l.isAuction ? 'bg-[#f5cf54]' : 'bg-[#6fbcf0]'}`}>
                      <span className="text-white text-sm">{l.isAuction ? '⚡' : '💰'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#182435] truncate">{l.title || 'Untitled item'}</p>
                      <p className="text-xs text-[#636871] truncate">
                        {l.isAuction ? 'Auction started' : 'Listed'} · {timeAgo(l.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-[#636871] whitespace-nowrap">
                    {l.isAuction ? `Bid: ${formatPrice(l.currentBid ?? l.price ?? 0)}` : formatPrice(l.price || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
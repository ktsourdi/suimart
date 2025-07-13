'use client';

import { useMemo } from 'react';
import { Card, CardContent } from './ui/Card';

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

  const statCards = [
    {
      title: 'Total Listings',
      value: stats.totalListings,
      change: '+12%',
      changeType: 'positive' as const,
      icon: '📦',
      color: 'from-[#6fbcf0] to-[#0284ad]'
    },
    {
      title: 'Active Items',
      value: stats.activeListings,
      change: '+8%',
      changeType: 'positive' as const,
      icon: '🟢',
      color: 'from-[#2dd7a7] to-[#008c65]'
    },
    {
      title: 'Total Value',
      value: formatPrice(stats.totalValue),
      change: '+15%',
      changeType: 'positive' as const,
      icon: '💰',
      color: 'from-[#f5cf54] to-[#8d6e15]'
    },
    {
      title: 'Avg Price',
      value: formatPrice(stats.avgPrice),
      change: '+5%',
      changeType: 'positive' as const,
      icon: '📊',
      color: 'from-[#ff794b] to-[#eb5a29]'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#182435] mb-2">Market Overview</h2>
        <p className="text-[#636871]">Real-time statistics from the Suimart marketplace</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} variant="elevated" className="relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-5`}></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl">{stat.icon}</div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  stat.changeType === 'positive' 
                    ? 'bg-[#d5f7ee] text-[#008c65]' 
                    : 'bg-[#ffece6] text-[#ff794b]'
                }`}>
                  {stat.change}
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-[#636871]">{stat.title}</h3>
                <p className="text-2xl font-bold text-[#182435]">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-[#e1f3ff] to-[#f3f6f8] border-[#6fbcf0]">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#6fbcf0] rounded-lg flex items-center justify-center">
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
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#f5cf54] rounded-lg flex items-center justify-center">
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
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#2dd7a7] rounded-lg flex items-center justify-center">
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
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#f3f6f8] rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#6fbcf0] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">💰</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#182435]">New listing created</p>
                  <p className="text-xs text-[#636871]">2 minutes ago</p>
                </div>
              </div>
              <span className="text-sm text-[#636871]">+1 listing</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-[#f3f6f8] rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#2dd7a7] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✅</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#182435]">Item sold</p>
                  <p className="text-xs text-[#636871]">5 minutes ago</p>
                </div>
              </div>
              <span className="text-sm text-[#636871]">+25.5 SUI</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-[#f3f6f8] rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#f5cf54] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">⚡</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#182435]">New auction started</p>
                  <p className="text-xs text-[#636871]">10 minutes ago</p>
                </div>
              </div>
              <span className="text-sm text-[#636871]">Starting: 10 SUI</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
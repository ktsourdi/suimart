'use client';

import { useMemo } from 'react';

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
      gradient: 'from-blue-500 to-purple-600',
      bgGradient: 'from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'
    },
    {
      title: 'Active Items',
      value: stats.activeListings,
      change: '+8%',
      changeType: 'positive' as const,
      icon: '🟢',
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
    },
    {
      title: 'Total Value',
      value: formatPrice(stats.totalValue),
      change: '+15%',
      changeType: 'positive' as const,
      icon: '💰',
      gradient: 'from-yellow-500 to-orange-600',
      bgGradient: 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
    },
    {
      title: 'Avg Price',
      value: formatPrice(stats.avgPrice),
      change: '+5%',
      changeType: 'positive' as const,
      icon: '📊',
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center animate-fade-in">
        <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-4">Market Overview</h2>
        <p className="text-gray-600 dark:text-gray-300 text-lg">Real-time statistics from the Suimart marketplace</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className={`card-hover glass-effect rounded-2xl p-6 animate-slide-up bg-gradient-to-br ${stat.bgGradient}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">{stat.icon}</div>
              <div className={`text-xs px-3 py-1 rounded-full font-semibold ${
                stat.changeType === 'positive' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {stat.change}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</h3>
              <p className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-hover glass-effect rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎯</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Fixed Price</h3>
              <p className="text-2xl font-bold text-gradient">{stats.fixedPriceListings}</p>
            </div>
          </div>
        </div>

        <div className="card-hover glass-effect rounded-2xl p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">⚡</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Auctions</h3>
              <p className="text-2xl font-bold text-gradient">{stats.auctionListings}</p>
            </div>
          </div>
        </div>

        {currentUserAddress && (
          <div className="card-hover glass-effect rounded-2xl p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">👤</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">My Listings</h3>
                <p className="text-2xl font-bold text-gradient">{stats.myListings}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Market Activity */}
      <div className="card-hover glass-effect rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.7s' }}>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">💰</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">New listing created</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</p>
              </div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">+1 listing</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✅</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Item sold</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">5 minutes ago</p>
              </div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">+25.5 SUI</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">⚡</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">New auction started</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">10 minutes ago</p>
              </div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Starting: 10 SUI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
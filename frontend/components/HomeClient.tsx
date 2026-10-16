'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUpDown,
  CloudOff,
  FilterX,
  Gavel,
  Heart,
  LayoutGrid,
  PackageOpen,
  Plus,
  RotateCw,
  Search,
  SearchX,
  Tag,
  TrendingUp,
  X,
} from 'lucide-react';
import { useWallet } from '../lib/useWallet';
import { mockMarketplace } from '../lib/mockData';
import { MOCK_MODE } from '../lib/config';
import { useListings, useSuiClient } from '../lib/suiClient';
import { LISTING_CATEGORIES, categoryKey, categoryName, listingImage } from '../lib/categories';
import { countdownParts, formatCountdown, formatNumber, pad2, useNow } from '../lib/format';
import { useToast } from './ToastProvider';
import MarketStats, { listingValue, summarizeMarket } from './MarketStats';
import ListingCard, { ListingCardSkeleton } from './ListingCard';
import EmptyState from './EmptyState';
import SectionHeading from './SectionHeading';
import Price, { SuiDrop } from './Price';
import UserName from './UserName';
import { CategoryIcon, categoryIcon } from './categoryIcons';
import Badge from './ui/Badge';
import Button, { buttonVariants } from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Skeleton from './ui/Skeleton';
import { Identicon } from './ui/Avatar';
import { cn } from './ui/cn';

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

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'popular', label: 'Most viewed' },
];

const CATEGORY_FILTERS = [{ id: 'all', name: 'All' }, ...LISTING_CATEGORIES];

// Two-up on phones (compact cards), as on most marketplaces; 3 and 4 columns on wider screens.
const MARKET_GRID = 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4';

const HOUR = 60 * 60 * 1000;

// Shown in the showcase when nothing is listed yet.
const PLACEHOLDER_ART = ['/listings/art.svg', '/listings/nfts.svg', '/listings/virtual-worlds.svg'];

const listingHref = (id: string) => `/listing?id=${encodeURIComponent(id)}`;
const sameAddress = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

export default function HomeClient() {
  const { currentAccount, connect, isLoading: walletConnecting } = useWallet();
  const sui = useSuiClient();
  const { data: listingsData, isLoading, isError, refetch } = useListings();
  const [listings, setListings] = useState<ListingData[]>([]);
  const [mockLoading, setMockLoading] = useState(MOCK_MODE);
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const searchRef = useRef<HTMLInputElement>(null);

  const viewerAddress: string | undefined = currentAccount?.address;
  const loading = MOCK_MODE ? mockLoading : isLoading;

  useEffect(() => {
    const run = async () => {
      if (MOCK_MODE) {
        const data = await mockMarketplace.getListings();
        setListings(data);
        setMockLoading(false);
      } else if (listingsData) {
        setListings(listingsData as ListingData[]);
      }
    };
    run();
  }, [listingsData]);

  // "/" jumps to the search box, as in most marketplaces.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /* ------------------------------------------------------------- filtering */
  const term = searchTerm.trim().toLowerCase();

  // Active listings that match the search; the category chips count within these.
  const searchMatches = useMemo(
    () =>
      listings.filter((listing) => {
        if (listing.status !== 'active') return false;
        if (!term) return true;
        return (
          !!listing.title?.toLowerCase().includes(term) ||
          !!listing.description?.toLowerCase().includes(term) ||
          !!listing.category?.toLowerCase().includes(term) ||
          categoryName(listing.category).toLowerCase().includes(term)
        );
      }),
    [listings, term]
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of searchMatches) {
      const key = categoryKey(l.category);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [searchMatches]);

  const filteredAndSortedListings = useMemo(() => {
    const filtered = searchMatches.filter(
      (listing) => selectedCategory === 'all' || categoryKey(listing.category) === selectedCategory
    );

    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        break;
      case 'price-low':
        // By the price the card shows: the leading bid for auctions.
        filtered.sort((a, b) => listingValue(a) - listingValue(b));
        break;
      case 'price-high':
        filtered.sort((a, b) => listingValue(b) - listingValue(a));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default: // newest
        filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return filtered;
  }, [searchMatches, selectedCategory, sortBy]);

  const summary = useMemo(() => summarizeMarket(listings, viewerAddress), [listings, viewerAddress]);

  // Hero: the most valuable live auction (else the most valuable listing), with the next two behind it.
  const showcase = useMemo(() => {
    const now = Date.now();
    const ranked = listings
      .filter((l) => l.status === 'active')
      .sort((a, b) => listingValue(b) - listingValue(a));
    const featured =
      ranked.find((l) => l.isAuction && !!l.auctionEndTime && l.auctionEndTime > now) ?? ranked[0] ?? null;
    const backdrops = ranked.filter((l) => l !== featured).slice(0, 2);
    return { featured, backdrops };
  }, [listings]);

  /* --------------------------------------------------------------- actions */
  const handleBuy = async (listingId: string) => {
    if (!currentAccount) {
      showToast('info', 'Connect your wallet first.');
      return;
    }

    try {
      if (MOCK_MODE) {
        await mockMarketplace.buyItem(listingId, currentAccount.address);
      } else {
        const l = listings.find((l) => l.listing_id === listingId);
        if (!l) throw new Error('Listing not found');
        await sui.buyItem(l.listing_id, l.itemType, l.price);
      }
      showToast('success', 'Purchase complete.');
      if (MOCK_MODE) {
        const data = await mockMarketplace.getListings();
        setListings(data);
      } else {
        await refetch();
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      showToast('error', 'Purchase failed. Please try again.');
    }
  };

  const handleCancel = async (listingId: string) => {
    if (!currentAccount) {
      showToast('info', 'Connect your wallet first.');
      return;
    }

    try {
      if (MOCK_MODE) {
        await mockMarketplace.cancelListing(listingId, currentAccount.address);
      } else {
        const l = listings.find((l) => l.listing_id === listingId);
        if (!l) throw new Error('Listing not found');
        await sui.cancelListing(l.listing_id, l.itemType);
      }
      showToast('success', 'Listing cancelled.');
      if (MOCK_MODE) {
        const data = await mockMarketplace.getListings();
        setListings(data);
      } else {
        await refetch();
      }
    } catch (error) {
      console.error('Cancellation failed:', error);
      showToast('error', 'Cancellation failed. Please try again.');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  /* ---------------------------------------------------------------- render */
  const filtersActive = term !== '' || selectedCategory !== 'all';
  const shown = filteredAndSortedListings.length;
  const loadFailed = !MOCK_MODE && isError && listings.length === 0;
  const selectedCategoryName = CATEGORY_FILTERS.find((c) => c.id === selectedCategory)?.name ?? 'All';

  const trustStats = [
    { label: 'Active listings', value: formatNumber(summary.active) },
    {
      label: 'Volume',
      value: (
        <span className="inline-flex items-baseline gap-1.5">
          {formatNumber(Math.round(summary.volume), { compact: true })}
          <span className="inline-flex items-center gap-1 self-center font-sans text-xs font-medium tracking-normal text-fg-subtle">
            <SuiDrop size={9} />
            SUI
          </span>
        </span>
      ),
    },
    {
      label: 'Live auctions',
      value: (
        <span className="inline-flex items-center gap-2">
          {formatNumber(summary.liveAuctions)}
          {summary.liveAuctions > 0 && (
            <span aria-hidden="true" className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-warning/60 motion-safe:animate-ping" />
              <span className="relative h-2 w-2 rounded-full bg-warning" />
            </span>
          )}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* ------------------------------------------------------------ Hero */}
      <section aria-labelledby="hero-heading" className="hero-grid overflow-x-clip">
        <div className="container-page grid items-center gap-14 pb-16 pt-10 sm:pb-20 sm:pt-14 lg:min-h-[min(calc(100svh-4rem),58rem)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 lg:pb-14 xl:gap-16">
          <div className="max-w-xl motion-safe:animate-slide-up">
            <p className="inline-flex h-8 items-center gap-2.5 rounded-full border border-line-strong bg-surface/70 pl-1 pr-3.5 text-[13px] font-medium text-fg-muted shadow-inset-line backdrop-blur-md">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 ring-1 ring-inset ring-accent/30">
                <SuiDrop size={9} />
              </span>
              Peer-to-peer
              <span aria-hidden="true" className="h-3.5 w-px bg-line-strong" />
              <span className="sr-only">, </span>
              <span className="text-fg">Built on Sui</span>
            </p>

            <h1 id="hero-heading" className="mt-7 font-display text-display font-semibold text-fg">
              Collect, trade and bid{' '}
              <span className="bg-[linear-gradient(100deg,rgb(var(--accent-hover))_10%,rgb(var(--accent))_90%)] bg-clip-text text-transparent">
                on&nbsp;Sui.
              </span>
            </h1>

            <p className="mt-6 max-w-[33rem] text-[17px] leading-[1.65] text-fg-muted sm:text-lg sm:leading-[1.6]">
              Fixed-price sales and live auctions, settled by Move smart contracts. Every listing is an object you own.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#market" className={buttonVariants({ size: 'lg', className: 'w-full sm:w-auto' })}>
                Explore listings
                <ArrowDown aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
              </a>
              <Link href="/sell" className={buttonVariants({ variant: 'secondary', size: 'lg', className: 'w-full sm:w-auto' })}>
                <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                List an item
              </Link>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 border-t border-line pt-6 sm:mt-12">
              {trustStats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={cn('flex min-w-0 flex-col-reverse gap-1', i > 0 && 'border-l border-line pl-4 sm:pl-6', i < 2 && 'pr-4 sm:pr-6')}
                >
                  <dt className="truncate text-[13px] text-fg-subtle">{stat.label}</dt>
                  <dd className="font-display text-xl font-semibold leading-8 tracking-[-0.02em] text-fg tabular-nums sm:text-2xl">
                    {loading ? <Skeleton className="my-1.5 h-5 w-12" /> : stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="motion-safe:animate-slide-up [animation-delay:120ms]">
            <FeaturedShowcase
              featured={showcase.featured}
              backdrops={showcase.backdrops}
              loading={loading}
              viewerAddress={viewerAddress}
            />
          </div>
        </div>
      </section>

      <div className="container-page space-y-16 sm:space-y-24">
        {/* ---------------------------------------------------- Market stats */}
        <MarketStats listings={listings} currentUserAddress={viewerAddress} loading={loading} />

        {/* ---------------------------------------------------------- Market */}
        <section id="market" aria-labelledby="market-heading">
          <SectionHeading
            id="market-heading"
            eyebrow="Marketplace"
            title="Explore the market"
            description="Fixed-price items and live auctions from sellers on Sui."
            action={
              <p aria-live="polite" className="text-sm text-fg-muted">
                {loading ? (
                  'Loading listings'
                ) : filtersActive ? (
                  <>
                    <span className="font-medium text-fg tabular-nums">{formatNumber(shown)}</span> of{' '}
                    <span className="tabular-nums">{formatNumber(summary.active)}</span> listings
                  </>
                ) : (
                  <>
                    <span className="font-medium text-fg tabular-nums">{formatNumber(shown)}</span>{' '}
                    {shown === 1 ? 'listing' : 'listings'}
                  </>
                )}
              </p>
            }
          />

          {/* Toolbar */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              ref={searchRef}
              type="search"
              label="Search listings"
              hideLabel
              placeholder="Search by title, description or category"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && searchTerm) {
                  e.preventDefault();
                  setSearchTerm('');
                }
              }}
              aria-keyshortcuts="/"
              autoComplete="off"
              spellCheck={false}
              leading={<Search strokeWidth={1.75} />}
              trailing={
                searchTerm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      searchRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="focus-ring -mr-1 flex h-6 w-6 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                ) : (
                  <kbd
                    aria-hidden="true"
                    className="hidden h-5 min-w-[20px] items-center justify-center rounded-[5px] border border-line-strong bg-surface-3 px-1.5 font-mono text-[11px] font-normal text-fg-subtle sm:inline-flex"
                  >
                    /
                  </kbd>
                )
              }
              containerClassName="sm:max-w-sm"
              inputClassName="[&::-webkit-search-cancel-button]:appearance-none"
            />
            <Select
              label="Sort listings"
              hideLabel
              leading={<ArrowUpDown strokeWidth={1.75} />}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={SORT_OPTIONS}
              containerClassName="sm:w-56"
            />
          </div>

          {/* Category chips: one row that scrolls sideways on phones, wrapping from sm */}
          <div
            role="group"
            aria-label="Filter by category"
            className="no-scrollbar mask-fade-x relative -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:[-webkit-mask-image:none] sm:[mask-image:none]"
          >
            {CATEGORY_FILTERS.map((category) => {
              const active = selectedCategory === category.id;
              const Icon = category.id === 'all' ? LayoutGrid : categoryIcon(category.id);
              const count = category.id === 'all' ? searchMatches.length : categoryCounts.get(category.id) ?? 0;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'focus-ring inline-flex h-9 shrink-0 items-center gap-2 rounded-full border pl-3 pr-3.5 text-[13px] font-medium transition-colors duration-150',
                    active
                      ? 'border-accent/30 bg-accent/10 text-accent'
                      : 'border-line bg-surface/60 text-fg-muted hover:border-line-strong hover:bg-surface-2 hover:text-fg'
                  )}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                  {category.name}
                  {!loading && (
                    <span className={cn('text-xs tabular-nums', active ? 'text-accent/80' : 'text-fg-subtle')}>
                      <span className="sr-only">(</span>
                      {count}
                      <span className="sr-only">)</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Results */}
          <div className="mt-6" aria-busy={loading || undefined}>
            {loading ? (
              <div className={MARKET_GRID}>
                {Array.from({ length: 8 }, (_, i) => (
                  <ListingCardSkeleton key={i} compactOnMobile />
                ))}
              </div>
            ) : loadFailed ? (
              <EmptyState
                icon={CloudOff}
                title="Couldn’t load listings"
                text="The Sui network did not answer. Check your connection and try again."
                action={
                  <Button variant="secondary" onClick={() => refetch()}>
                    <RotateCw aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                    Try again
                  </Button>
                }
              />
            ) : shown === 0 ? (
              filtersActive ? (
                <EmptyState
                  icon={SearchX}
                  title="No listings match"
                  text={
                    term
                      ? `Nothing in ${selectedCategory === 'all' ? 'the market' : selectedCategoryName} matches “${searchTerm.trim()}”. Try another search or category.`
                      : `Nothing is listed in ${selectedCategoryName} right now. Try another category.`
                  }
                  action={
                    <>
                      <Button variant="secondary" onClick={clearFilters}>
                        <FilterX aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                        Clear filters
                      </Button>
                      <Link href="/sell" className={buttonVariants()}>
                        <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                        List an item
                      </Link>
                    </>
                  }
                />
              ) : (
                <EmptyState
                  icon={PackageOpen}
                  title="No listings yet"
                  text="The market is empty. List the first item and it will show up here."
                  action={
                    <Link href="/sell" className={buttonVariants()}>
                      <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                      List your first item
                    </Link>
                  }
                />
              )
            ) : (
              <ul role="list" className={MARKET_GRID}>
                {filteredAndSortedListings.map((listing) => (
                  <li key={listing.listing_id} className="flex">
                    <ListingCard
                      listing={listing}
                      viewerAddress={viewerAddress}
                      onBuy={handleBuy}
                      onCancel={handleCancel}
                      onConnect={MOCK_MODE ? () => connect() : undefined}
                      connecting={!!walletConnecting}
                      compactOnMobile
                      className="w-full"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Hero showcase: the featured artwork with two more stacked behind it and a
   frosted panel on top. Back cards stack as a deck on phones and fan out from sm.
---------------------------------------------------------------------------- */

const BACK_CARD_POSITIONS = [
  // Nearer card: left
  '-translate-y-[9%] scale-[0.92] sm:-translate-x-[17%] sm:translate-y-[5%] sm:-rotate-[8deg] sm:scale-[0.9] sm:motion-safe:group-hover/showcase:-translate-x-[19%] sm:motion-safe:group-hover/showcase:-rotate-[10deg]',
  // Farther card: right
  '-translate-y-[17%] scale-[0.84] sm:translate-x-[9%] sm:-translate-y-[7%] sm:rotate-[6deg] sm:scale-[0.88] sm:motion-safe:group-hover/showcase:translate-x-[10%] sm:motion-safe:group-hover/showcase:-translate-y-[9%] sm:motion-safe:group-hover/showcase:rotate-[8deg]',
];
const BACK_CARD_DIM = ['bg-bg/25 sm:bg-bg/15', 'bg-bg/45 sm:bg-bg/30'];
// Each back card shows a zoomed detail of its artwork, pulled into the strip that peeks out
// from behind the main card (the top on phones, the left or top-right edge from sm).
const BACK_CARD_ART = ['scale-[1.6] origin-bottom sm:origin-right', 'scale-[1.6] origin-bottom sm:origin-bottom-left'];

const SHOWCASE_SIZES = '(min-width: 1280px) 500px, (min-width: 1024px) 40vw, (min-width: 640px) 480px, 92vw';

const overlayLabel = 'text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-fg-subtle';

function BackCard({ src, index }: { src?: string; index: number }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-0 overflow-hidden rounded-2xl border border-line-strong bg-surface-2 shadow-[0_32px_64px_-32px_rgb(0_0_0/0.9)]',
        'motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out-expo',
        BACK_CARD_POSITIONS[index]
      )}
    >
      {src ? (
        <>
          <Image src={src} alt="" fill sizes={SHOWCASE_SIZES} className={cn('object-cover', BACK_CARD_ART[index])} />
          <div className={cn('absolute inset-0', BACK_CARD_DIM[index])} />
        </>
      ) : (
        <Skeleton className="h-full w-full rounded-none" />
      )}
    </div>
  );
}

interface FeaturedShowcaseProps {
  featured: ListingData | null;
  backdrops: ListingData[];
  loading: boolean;
  viewerAddress?: string;
}

function FeaturedShowcase({ featured, backdrops, loading, viewerAddress }: FeaturedShowcaseProps) {
  const titleId = useId();
  const empty = !loading && !featured;
  const backSources = loading
    ? [undefined, undefined]
    : empty
      ? PLACEHOLDER_ART.slice(1)
      : backdrops.map((l) => listingImage(l));
  const isAuction = !!featured?.isAuction;
  const leader = isAuction ? featured?.highestBidder : undefined;
  const gain =
    featured && leader && featured.currentBid && featured.price > 0
      ? ((featured.currentBid - featured.price) / featured.price) * 100
      : null;

  return (
    <div className="group/showcase relative mx-auto w-full max-w-[26rem] pt-[11%] sm:pt-[7%] md:max-w-[30rem] lg:max-w-none lg:pt-[4%]">
      {/* Soft accent light behind the stack */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-[4%] -inset-y-[14%] -z-10 sm:-inset-x-[14%] bg-[radial-gradient(closest-side,rgb(var(--accent)/0.2),transparent_72%)]"
      />

      <div className="relative mx-auto w-full lg:w-[84%] xl:w-[94%]">
        {backSources
          .slice(0, 2)
          .map((src, i) => ({ src, i }))
          .reverse()
          .map(({ src, i }) => (
            <BackCard key={i} src={src} index={i} />
          ))}

        {loading ? (
          <div aria-hidden="true" className="relative aspect-square overflow-hidden rounded-2xl border border-line-strong bg-surface">
            <Skeleton className="h-full w-full rounded-none" />
            <div className="glass absolute inset-x-3 bottom-3 rounded-xl p-3 sm:inset-x-4 sm:bottom-4 sm:p-5">
              {/* Same footprint as the panel: one row on phones, two from sm. */}
              <div className="flex items-center justify-between gap-3 sm:block">
                <div className="min-w-0 flex-1">
                  <Skeleton className="hidden h-3 w-28 sm:block" />
                  <Skeleton className="h-4 w-36 max-w-full sm:mt-3 sm:h-5 sm:w-48" />
                  <Skeleton className="mt-2 h-3.5 w-24 sm:hidden" />
                </div>
                <Skeleton className="h-10 w-24 shrink-0 rounded-control sm:hidden" />
              </div>
              <div className="mt-5 hidden items-end justify-between border-t border-line-strong pt-4 sm:flex">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-10 w-28 rounded-control" />
              </div>
            </div>
          </div>
        ) : (
          <article
            aria-labelledby={titleId}
            className="relative aspect-square overflow-hidden rounded-2xl border border-line-strong bg-surface-2 shadow-[0_56px_96px_-48px_rgb(0_0_0/0.95),0_24px_48px_-24px_rgb(0_0_0/0.55)] motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out-expo sm:motion-safe:group-hover/showcase:-translate-y-1"
          >
            <Image
              src={featured ? listingImage(featured) : PLACEHOLDER_ART[0]}
              alt=""
              fill
              priority
              sizes={SHOWCASE_SIZES}
              className="object-cover"
            />
            {/* Whole artwork opens the listing; the title link below is the accessible one. */}
            {featured && (
              <Link href={listingHref(featured.listing_id)} tabIndex={-1} aria-hidden="true" className="absolute inset-0" />
            )}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_0_rgb(255_255_255/0.14)]" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-bg/55 to-transparent" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg/60 via-bg/10 to-transparent" />

            {featured && (
              <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
                {isAuction ? (
                  <Badge variant="overlay" size="lg">
                    <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
                      <span className="absolute inset-0 rounded-full bg-warning/70 motion-safe:animate-ping" />
                      <span className="relative h-1.5 w-1.5 rounded-full bg-warning" />
                    </span>
                    <span className="sm:hidden">Live</span>
                    <span className="hidden sm:inline">Live auction</span>
                    {/* Phones: the countdown sits here so the panel below stays a single row. */}
                    {featured.auctionEndTime ? (
                      <span className="inline-flex items-center gap-1.5 sm:hidden">
                        <span aria-hidden="true" className="h-3 w-px bg-line-strong" />
                        <LiveCountdown endTs={featured.auctionEndTime} />
                      </span>
                    ) : null}
                  </Badge>
                ) : (
                  <Badge variant="overlay" size="lg">
                    <Tag aria-hidden="true" className="text-accent" strokeWidth={1.75} />
                    Buy now
                  </Badge>
                )}
                {typeof featured.favorites === 'number' && (
                  <Badge variant="overlay" size="lg">
                    <Heart aria-hidden="true" className="text-fg-muted" strokeWidth={1.75} />
                    {formatNumber(featured.favorites, { compact: true })}
                    <span className="sr-only">favourites</span>
                  </Badge>
                )}
              </div>
            )}

            {featured ? (
              <ShowcasePanel listing={featured} titleId={titleId} viewerAddress={viewerAddress} />
            ) : (
              <div className="glass absolute inset-x-3 bottom-3 z-10 rounded-xl p-4 shadow-popover sm:inset-x-4 sm:bottom-4 sm:p-5">
                <p className={overlayLabel}>Marketplace</p>
                <h2 id={titleId} className="mt-1.5 font-display text-lg font-semibold leading-7 tracking-[-0.015em] text-fg sm:text-[22px]">
                  No listings yet
                </h2>
                <div className="mt-4 flex items-center justify-between gap-4 border-t border-line-strong pt-4">
                  <p className="text-[13px] leading-5 text-fg-muted">List the first item on SuiMart.</p>
                  <Link href="/sell" className={buttonVariants({ className: 'shrink-0' })}>
                    <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                    List an item
                  </Link>
                </div>
              </div>
            )}
          </article>
        )}

        {/* Leading bidder, floating over the stack's edge */}
        {!loading && leader && (
          <div className="glass absolute -left-5 top-[17%] z-20 hidden items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 shadow-popover sm:flex lg:-left-8">
            <Identicon address={leader} size={30} />
            <div className="leading-tight">
              <p className="text-[11px] text-fg-subtle">Leading bid</p>
              <p className="flex items-center gap-1.5 text-xs">
                <UserName address={leader} viewer={viewerAddress} className="font-medium text-fg" />
                {gain !== null && gain > 0 && (
                  <span className="inline-flex items-center gap-0.5 font-medium tabular-nums text-success">
                    <TrendingUp aria-hidden="true" className="h-3 w-3" strokeWidth={2} />
                    {gain >= 10 ? Math.round(gain) : gain.toFixed(1)}%
                    <span className="sr-only"> over the starting price</span>
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** The frosted panel: title, price, live countdown and the call to action. Ticks on its own. */
function ShowcasePanel({
  listing,
  titleId,
  viewerAddress,
}: {
  listing: ListingData;
  titleId: string;
  viewerAddress?: string;
}) {
  const isAuction = !!listing.isAuction;
  const now = useNow(isAuction ? 1000 : 0);
  const parts = countdownParts(listing.auctionEndTime, now);
  const ended = isAuction && parts.ended;
  const endingSoon = isAuction && !ended && parts.totalMs < HOUR;
  const isSeller = sameAddress(listing.seller, viewerAddress);
  const href = listingHref(listing.listing_id);
  const title = listing.title?.trim() || 'Untitled item';

  const units: [number, string, string][] = [
    [parts.days, 'd', 'day'],
    [parts.hours, 'h', 'hour'],
    [parts.minutes, 'm', 'minute'],
    [parts.seconds, 's', 'second'],
  ];
  const visibleUnits = parts.days > 0 ? units : units.slice(1);
  const spoken = visibleUnits
    .slice(0, 2)
    .map(([v, , word]) => `${v} ${word}${v === 1 ? '' : 's'}`)
    .join(' ');

  let cta: React.ReactNode;
  if (ended || isSeller) {
    cta = (
      <Link href={href} className={buttonVariants({ variant: 'secondary', className: 'relative z-10 shrink-0' })}>
        {isSeller && !ended ? 'Manage listing' : 'View result'}
      </Link>
    );
  } else if (isAuction) {
    cta = (
      <Link href={href} className={buttonVariants({ className: 'relative z-10 shrink-0' })}>
        {/* Text only in the tighter phone row. */}
        <Gavel aria-hidden="true" className="hidden h-4 w-4 sm:block" strokeWidth={1.75} />
        Place bid
      </Link>
    );
  } else {
    cta = (
      <Link href={href} className={buttonVariants({ className: 'relative z-10 shrink-0' })}>
        Buy now
      </Link>
    );
  }

  const priceLabel = isAuction ? (listing.currentBid ? 'Current bid' : 'Starting bid') : 'Price';

  // Phones get one compact row (title and price, then the button) so the artwork's centre stays
  // clear; the countdown moves to the badge on the artwork. From sm up: two rows.
  return (
    <div className="glass absolute inset-x-3 bottom-3 z-10 rounded-xl p-3 shadow-popover sm:inset-x-4 sm:bottom-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 sm:items-start sm:gap-4">
        <div className="min-w-0">
          <p className={cn(overlayLabel, 'hidden items-center gap-1.5 sm:flex')}>
            <CategoryIcon category={listing.category} className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              Featured
              {isAuction && ' auction'}
              <span className="lg:hidden xl:inline"> · {categoryName(listing.category) || 'Other'}</span>
            </span>
          </p>
          <h2
            id={titleId}
            className="truncate font-display text-[15px] font-semibold leading-5 tracking-[-0.01em] text-fg sm:mt-1.5 sm:text-[22px] sm:leading-7 sm:tracking-[-0.015em]"
          >
            <Link
              href={href}
              className="rounded-sm focus-visible:outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-accent"
            >
              {title}
            </Link>
          </h2>
          <p className="mt-1 flex min-w-0 items-center gap-2 sm:hidden">
            <span className="truncate text-xs text-fg-subtle">{priceLabel}</span>
            <Price value={listingValue(listing)} size="sm" />
          </p>
        </div>

        {isAuction && (
          <div className="hidden shrink-0 text-right sm:block">
            <p className={overlayLabel}>{ended ? 'Auction' : 'Ends in'}</p>
            {ended ? (
              <p className="mt-1.5 font-display text-[22px] font-semibold leading-7 text-fg-muted">Ended</p>
            ) : (
              <p
                className={cn(
                  'mt-1.5 flex items-baseline justify-end gap-1.5 font-display text-[22px] font-semibold leading-7 tracking-[-0.01em] tabular-nums',
                  endingSoon ? 'text-warning' : 'text-fg'
                )}
              >
                <span className="sr-only">{spoken}</span>
                {visibleUnits.map(([value, unit]) => (
                  <span key={unit} aria-hidden="true" className="inline-flex items-baseline">
                    {pad2(value)}
                    <span className="ml-px font-sans text-[13px] font-medium text-fg-subtle">{unit}</span>
                  </span>
                ))}
              </p>
            )}
          </div>
        )}

        <div className="shrink-0 sm:hidden">{cta}</div>
      </div>

      <div className="mt-4 hidden items-end justify-between gap-4 border-t border-line-strong pt-4 sm:flex">
        <div className="flex min-w-0 items-start gap-6">
          <Price value={listingValue(listing)} size="lg" label={priceLabel} />
          <div className="flex min-w-0 flex-col gap-1 lg:hidden xl:flex">
            <span className="text-xs leading-4 text-fg-subtle">Seller</span>
            <span className="flex h-7 min-w-0 items-center gap-1.5">
              <Identicon address={listing.seller} size={18} />
              <UserName address={listing.seller} viewer={viewerAddress} className="text-xs text-fg-muted" />
            </span>
          </div>
        </div>
        {cta}
      </div>
    </div>
  );
}

/** The short live countdown ("4d 9h", "3h 12m") for the featured badge on phones. Ticks on its own. */
function LiveCountdown({ endTs }: { endTs: number }) {
  const now = useNow(1000);
  const parts = countdownParts(endTs, now);
  const soon = !parts.ended && parts.totalMs < HOUR;
  return (
    <span className={cn('tabular-nums', soon ? 'text-warning' : 'text-fg-muted')}>
      {!parts.ended && <span className="sr-only">ends in </span>}
      {formatCountdown(endTs, now)}
    </span>
  );
}

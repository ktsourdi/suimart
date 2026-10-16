'use client';

import { useMemo, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesColumnIncreasing,
  Check,
  Gavel,
  Layers,
  Sigma,
  Tag,
  X,
  type LucideIcon,
} from 'lucide-react';
import { MOCK_MODE, SUI_NETWORK } from '../lib/config';
import { categoryKey, categoryName, listingImage } from '../lib/categories';
import { formatNumber, formatSui, timeAgo } from '../lib/format';
import { CategoryIcon } from './categoryIcons';
import Price, { SuiDrop } from './Price';
import SectionHeading from './SectionHeading';
import UserName from './UserName';
import { Card } from './ui/Card';
import { Identicon } from './ui/Avatar';
import Skeleton from './ui/Skeleton';
import { buttonVariants } from './ui/Button';
import { cn } from './ui/cn';

/* ----------------------------------------------------------------------------
   Data: every number on the home page is computed here from the listings.
---------------------------------------------------------------------------- */

export interface MarketListing {
  listing_id: string;
  price: number;
  seller: string;
  title?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  createdAt?: number;
  updatedAt?: number;
  views?: number;
  favorites?: number;
  isAuction?: boolean;
  auctionEndTime?: number;
  currentBid?: number;
  highestBidder?: string;
  status?: string;
}

/** What a listing is worth now: the leading bid for an auction, otherwise the asking price. */
export function listingValue(listing: Pick<MarketListing, 'price' | 'isAuction' | 'currentBid'>): number {
  const value = listing.isAuction ? listing.currentBid ?? listing.price : listing.price;
  return typeof value === 'number' && isFinite(value) ? value : 0;
}

const isActive = (l: MarketListing) => (l.status ?? 'active') === 'active';
const sameAddress = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

export interface MarketSummary {
  /** Active listings. */
  active: number;
  /** Active auctions, ended or not. */
  auctions: number;
  /** Active auctions whose end time is still ahead. */
  liveAuctions: number;
  fixed: number;
  /** Sum of asking prices and leading bids across active listings, in SUI. */
  volume: number;
  floor: number | null;
  floorListing: MarketListing | null;
  average: number | null;
  /** Active listings by the connected wallet. */
  mine: number;
  /** Active listings per category, most first. */
  categories: { key: string; name: string; count: number }[];
}

export function summarizeMarket(
  listings: MarketListing[],
  viewerAddress?: string | null,
  now: number = Date.now()
): MarketSummary {
  const active = listings.filter(isActive);
  const auctions = active.filter((l) => l.isAuction);
  const liveAuctions = auctions.filter((l) => !!l.auctionEndTime && l.auctionEndTime > now).length;

  let volume = 0;
  let floorListing: MarketListing | null = null;
  for (const l of active) {
    const v = listingValue(l);
    volume += v;
    if (!floorListing || v < listingValue(floorListing)) floorListing = l;
  }

  const byCategory = new Map<string, { key: string; name: string; count: number }>();
  for (const l of active) {
    const key = categoryKey(l.category) || 'other';
    const entry = byCategory.get(key) ?? { key, name: categoryName(l.category) || 'Other', count: 0 };
    entry.count += 1;
    byCategory.set(key, entry);
  }

  return {
    active: active.length,
    auctions: auctions.length,
    liveAuctions,
    fixed: active.length - auctions.length,
    volume,
    floor: floorListing ? listingValue(floorListing) : null,
    floorListing,
    average: active.length ? volume / active.length : null,
    mine: viewerAddress ? active.filter((l) => sameAddress(l.seller, viewerAddress)).length : 0,
    categories: Array.from(byCategory.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}

export type ActivityKind = 'listed' | 'auction' | 'bid' | 'sold' | 'cancelled';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  ts: number;
  price: number;
  /** Who did it: the seller, or the bidder for a bid. */
  actor?: string;
  listing: MarketListing;
}

/** Events read off the listings themselves: created, latest bid, sold or cancelled. */
export function marketActivity(listings: MarketListing[], limit = 6): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const l of listings) {
    const created = l.createdAt ?? l.updatedAt;
    if (created) {
      events.push({
        id: `${l.listing_id}:created`,
        kind: l.isAuction ? 'auction' : 'listed',
        ts: created,
        price: l.price,
        actor: l.seller,
        listing: l,
      });
    }
    if (l.isAuction && l.currentBid && l.highestBidder && l.updatedAt && created && l.updatedAt > created) {
      events.push({
        id: `${l.listing_id}:bid`,
        kind: 'bid',
        ts: l.updatedAt,
        price: l.currentBid,
        actor: l.highestBidder,
        listing: l,
      });
    }
    if ((l.status === 'sold' || l.status === 'cancelled') && l.updatedAt) {
      events.push({
        id: `${l.listing_id}:${l.status}`,
        kind: l.status,
        ts: l.updatedAt,
        price: l.price,
        actor: l.status === 'cancelled' ? l.seller : undefined,
        listing: l,
      });
    }
  }
  return events.sort((a, b) => b.ts - a.ts).slice(0, limit);
}

const EVENT_META: Record<ActivityKind, { label: string; icon: LucideIcon; tone: string }> = {
  listed: { label: 'Listed', icon: Tag, tone: 'text-accent' },
  auction: { label: 'Auction opened', icon: Gavel, tone: 'text-warning' },
  bid: { label: 'Bid placed', icon: ArrowUpRight, tone: 'text-success' },
  sold: { label: 'Sold', icon: Check, tone: 'text-success' },
  cancelled: { label: 'Cancelled', icon: X, tone: 'text-fg-subtle' },
};

/* ----------------------------------------------------------------------------
   UI
---------------------------------------------------------------------------- */

interface MarketStatsProps {
  listings?: MarketListing[];
  currentUserAddress?: string | null;
  /** Listings are still loading: show placeholders instead of zeros. */
  loading?: boolean;
  className?: string;
}

/** A value in SUI that scales down on phones (Price has fixed sizes). */
function SuiFigure({ value }: { value: number }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span>{formatSui(value, { compact: true })}</span>
      <span className="inline-flex items-center gap-1 self-center font-sans text-xs font-medium tracking-normal text-fg-subtle sm:text-[13px]">
        <SuiDrop size={10} />
        SUI
      </span>
    </span>
  );
}

interface Kpi {
  label: string;
  icon: LucideIcon;
  value: ReactNode;
  caption: ReactNode;
}

// Hairlines between the four cells: a 2 x 2 grid on phones, one row from lg.
const KPI_BORDERS = ['', 'border-l', 'border-t lg:border-l lg:border-t-0', 'border-l border-t lg:border-t-0'];

export default function MarketStats({ listings = [], currentUserAddress, loading = false, className }: MarketStatsProps) {
  const summary = useMemo(() => summarizeMarket(listings, currentUserAddress), [listings, currentUserAddress]);
  const activity = useMemo(() => marketActivity(listings, 6), [listings]);
  const now = Date.now();

  const kpis: Kpi[] = [
    {
      label: 'Active listings',
      icon: Layers,
      value: formatNumber(summary.active),
      caption: `${formatNumber(summary.auctions)} auction${summary.auctions === 1 ? '' : 's'} · ${formatNumber(summary.fixed)} fixed price`,
    },
    {
      label: 'Total volume',
      icon: ChartNoAxesColumnIncreasing,
      value: <SuiFigure value={summary.volume} />,
      caption: 'Asking prices and leading bids',
    },
    {
      label: 'Floor price',
      icon: ArrowDownToLine,
      value: summary.floor === null ? '–' : <SuiFigure value={summary.floor} />,
      caption: summary.floorListing ? (
        <span className="block truncate" title={summary.floorListing.title}>
          {summary.floorListing.title || 'Untitled item'}
        </span>
      ) : (
        'No active listings'
      ),
    },
    {
      label: 'Average price',
      icon: Sigma,
      value: summary.average === null ? '–' : <SuiFigure value={summary.average} />,
      caption: `Across ${formatNumber(summary.active)} active listing${summary.active === 1 ? '' : 's'}`,
    },
  ];

  const total = Math.max(summary.active, 1);
  const fixedShare = Math.round((summary.fixed / total) * 100);
  const auctionShare = summary.active ? 100 - fixedShare : 0;
  const topCategories = summary.categories.slice(0, 5);
  const topCount = topCategories[0]?.count ?? 1;

  return (
    <section aria-labelledby="market-overview-heading" className={className}>
      <SectionHeading
        id="market-overview-heading"
        eyebrow="Market overview"
        title="The market at a glance"
        description={
          MOCK_MODE ? 'Computed from the demo listings on this page.' : `Read from the SuiMart contract on ${SUI_NETWORK}.`
        }
        action={
          MOCK_MODE ? undefined : (
            <span className="inline-flex items-center gap-2 text-[13px] font-medium text-fg-muted">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success motion-safe:animate-pulse-dot" />
              Live from {SUI_NETWORK}
            </span>
          )
        }
      />

      {/* KPI band */}
      <dl className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface/70 shadow-inset-line lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className={cn('min-w-0 p-4 sm:p-6', KPI_BORDERS[i])}>
            <dt className="flex items-center gap-2 text-[13px] font-medium text-fg-muted">
              <kpi.icon aria-hidden="true" className="h-4 w-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />
              <span className="truncate">{kpi.label}</span>
            </dt>
            <dd className="mt-3 font-display text-[22px] font-semibold leading-none tracking-[-0.02em] text-fg tabular-nums sm:mt-4 sm:text-[28px]">
              {loading ? <Skeleton className="h-6 w-20 sm:h-7 sm:w-28" /> : kpi.value}
            </dd>
            <dd className="mt-2.5 min-w-0 text-xs leading-4 text-fg-subtle">
              {loading ? <Skeleton className="h-3 w-24" /> : kpi.caption}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Recent activity */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <h3 className="font-display text-h3 font-semibold text-fg">Recent activity</h3>
            <span className="text-xs text-fg-subtle">
              {loading ? 'Loading' : activity.length ? `Latest ${activity.length} events` : 'No events yet'}
            </span>
          </div>

          {/* Column labels from sm up */}
          <div
            aria-hidden="true"
            className="hidden grid-cols-[minmax(0,1fr)_9.5rem_7.5rem_4.5rem] gap-x-4 border-b border-line px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-subtle sm:grid"
          >
            <span>Item</span>
            <span>Event</span>
            <span className="text-right">Price</span>
            <span className="text-right">Time</span>
          </div>

          {loading ? (
            <ul aria-hidden="true" className="divide-y divide-line">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </li>
              ))}
            </ul>
          ) : activity.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-fg-muted">No listings yet. New listings and bids show up here.</p>
          ) : (
            <ol className="divide-y divide-line">
              {activity.map((event) => {
                const meta = EVENT_META[event.kind];
                const href = `/listing?id=${encodeURIComponent(event.listing.listing_id)}`;
                const title = event.listing.title?.trim() || 'Untitled item';
                return (
                  <li key={event.id}>
                    <Link
                      href={href}
                      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-5 py-3 transition-colors duration-150 hover:bg-surface-2/70 focus-visible:bg-surface-2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:grid-cols-[minmax(0,1fr)_9.5rem_7.5rem_4.5rem] sm:px-6"
                    >
                      {/* Item */}
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
                          <Image src={listingImage(event.listing)} alt="" fill sizes="40px" className="object-cover" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-fg group-hover:text-fg">{title}</span>
                          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-fg-subtle">
                            {/* Event on phones, category from sm */}
                            <meta.icon aria-hidden="true" className={cn('h-3.5 w-3.5 shrink-0 sm:hidden', meta.tone)} strokeWidth={1.75} />
                            <span className="truncate sm:hidden">{meta.label}</span>
                            <CategoryIcon category={event.listing.category} className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
                            <span className="hidden truncate sm:inline">{categoryName(event.listing.category) || 'Other'}</span>
                          </span>
                        </span>
                      </span>

                      {/* Event (sm+) */}
                      <span className="hidden min-w-0 items-center gap-2 sm:flex">
                        <span
                          aria-hidden="true"
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2"
                        >
                          <meta.icon className={cn('h-3.5 w-3.5', meta.tone)} strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] text-fg-muted">{meta.label}</span>
                          {event.actor && (
                            <span className="flex min-w-0 items-center gap-1 text-[11px] leading-4 text-fg-subtle">
                              <Identicon address={event.actor} size={10} />
                              <UserName address={event.actor} viewer={currentUserAddress} />
                            </span>
                          )}
                        </span>
                      </span>

                      {/* Price, and the time on phones */}
                      <span className="flex flex-col items-end gap-0.5">
                        <Price value={event.price} size="sm" />
                        <time dateTime={new Date(event.ts).toISOString()} className="text-xs text-fg-subtle sm:hidden">
                          {timeAgo(event.ts, { now })}
                        </time>
                      </span>

                      {/* Time (sm+) */}
                      <time
                        dateTime={new Date(event.ts).toISOString()}
                        className="hidden text-right text-xs tabular-nums text-fg-subtle sm:block"
                      >
                        {timeAgo(event.ts, { now })}
                      </time>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        {/* Listing mix */}
        <Card className="flex flex-col">
          <div className="border-b border-line px-5 py-4 sm:px-6">
            <h3 className="font-display text-h3 font-semibold text-fg">Listing mix</h3>
          </div>

          <div className="flex-1 space-y-7 px-5 py-5 sm:px-6 sm:py-6">
            {/* Fixed price vs auction */}
            <div>
              <p className="eyebrow">Sale type</p>
              {loading ? (
                <Skeleton className="mt-3 h-2 w-full rounded-full" />
              ) : (
                <div aria-hidden="true" className="mt-3 flex h-2 gap-1 overflow-hidden rounded-full bg-surface-3">
                  {summary.fixed > 0 && <span className="h-full rounded-full bg-accent" style={{ width: `${fixedShare}%` }} />}
                  {summary.auctions > 0 && (
                    <span className="h-full rounded-full bg-warning" style={{ width: `${auctionShare}%` }} />
                  )}
                </div>
              )}
              <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <dt className="flex items-center gap-2 text-fg-muted">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
                    Fixed price
                  </dt>
                  <dd className="mt-1 pl-4 font-medium tabular-nums text-fg">
                    {loading ? '–' : formatNumber(summary.fixed)}
                    <span className="ml-1.5 font-normal text-fg-subtle">{loading ? '' : `${fixedShare}%`}</span>
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-fg-muted">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-warning" />
                    Auctions
                  </dt>
                  <dd className="mt-1 pl-4 font-medium tabular-nums text-fg">
                    {loading ? '–' : formatNumber(summary.auctions)}
                    <span className="ml-1.5 font-normal text-fg-subtle">
                      {/* The share, like the fixed-price column; the live count only when some have ended. */}
                      {loading
                        ? ''
                        : summary.liveAuctions < summary.auctions
                          ? `${formatNumber(summary.liveAuctions)} live`
                          : `${auctionShare}%`}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Top categories */}
            <div>
              <p className="eyebrow">Top categories</p>
              {loading ? (
                <div aria-hidden="true" className="mt-3 space-y-3">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : topCategories.length === 0 ? (
                <p className="mt-3 text-[13px] text-fg-subtle">Nothing listed yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {topCategories.map((c) => (
                    <li key={c.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 text-[13px]">
                      <span className="flex min-w-0 items-center gap-2 text-fg-muted">
                        <CategoryIcon category={c.key} className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="tabular-nums text-fg">
                        {c.count}
                        <span className="sr-only"> listings</span>
                      </span>
                      <span aria-hidden="true" className="col-span-2 h-1 overflow-hidden rounded-full bg-surface-3">
                        <span
                          className="block h-full rounded-full bg-fg-subtle/60"
                          style={{ width: `${Math.max(8, Math.round((c.count / topCount) * 100))}%` }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {currentUserAddress && (
            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
              <span className="flex min-w-0 items-center gap-2.5 text-[13px] text-fg-muted">
                <Identicon address={currentUserAddress} size={20} />
                <span className="truncate">
                  Your listings <span className="ml-1 font-medium tabular-nums text-fg">{formatNumber(summary.mine)}</span>
                </span>
              </span>
              <Link href="/profile" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-mr-2' })}>
                Profile
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

export { MarketStats };

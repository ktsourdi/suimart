'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Gavel, Heart, LoaderCircle, Tag, Wallet, X } from 'lucide-react';
import { categoryName, listingImage } from '../lib/categories';
import { countdownParts, formatCountdown, formatNumber, useNow } from '../lib/format';
import { CategoryIcon } from './categoryIcons';
import Price from './Price';
import UserName from './UserName';
import { Identicon } from './ui/Avatar';
import { buttonVariants } from './ui/Button';
import Skeleton from './ui/Skeleton';
import { cn } from './ui/cn';

export interface ListingCardListing {
  listing_id: string;
  title?: string;
  description?: string;
  price: number;
  seller: string;
  category?: string;
  imageUrl?: string;
  isAuction?: boolean;
  auctionEndTime?: number;
  currentBid?: number;
  highestBidder?: string;
  favorites?: number;
  views?: number;
  status?: string;
}

export interface ListingCardProps {
  listing: ListingCardListing;
  /** The connected wallet address, if any. Decides Buy / Cancel / Connect. */
  viewerAddress?: string | null;
  /** Buy straight from the card. Without it, "Buy now" links to the detail page. */
  onBuy?: (listingId: string) => void | Promise<unknown>;
  /** Shown to the seller as "Cancel listing". Without it the seller gets a "Manage" link. */
  onCancel?: (listingId: string) => void | Promise<unknown>;
  /** Shown as "Connect to buy" when no wallet. Without it the button links to the detail page. */
  onConnect?: () => void | Promise<unknown>;
  /** The wallet is connecting (disables the connect button). */
  connecting?: boolean;
  /** Sell-page preview: no link, actions shown but disabled. */
  preview?: boolean;
  /** Load the artwork eagerly (first row above the fold). */
  priority?: boolean;
  /**
   * Below sm, a denser card for two-up phone grids: smaller title and price, and no seller
   * or action row (the whole card still links to the listing). From sm up it is unchanged.
   */
  compactOnMobile?: boolean;
  /** next/image sizes; the default matches the market grid. */
  sizes?: string;
  className?: string;
}

const DEFAULT_SIZES = '(min-width: 1280px) 296px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw';
const COMPACT_SIZES = '(min-width: 1280px) 296px, (min-width: 1024px) 31vw, 46vw';

const overlayPillBase =
  'inline-flex items-center rounded-full border border-line-strong bg-bg/60 font-medium text-fg backdrop-blur-md';
const overlayPillSize = {
  default: 'h-7 gap-1.5 px-2.5 text-xs',
  compact: 'h-6 gap-1 px-2 text-[11px] sm:h-7 sm:gap-1.5 sm:px-2.5 sm:text-xs',
};

// The card's call to action is calm in the grid and lights up when its card is hovered.
const ctaClasses = buttonVariants({
  variant: 'secondary',
  size: 'md',
  className:
    'relative z-10 w-full group-hover:border-transparent group-hover:bg-accent group-hover:text-accent-fg group-hover:shadow-button',
});

const STATUS_LABEL: Record<string, { label: string; dot: string }> = {
  sold: { label: 'Sold', dot: 'bg-success' },
  cancelled: { label: 'Cancelled', dot: 'bg-fg-subtle' },
  ended: { label: 'Ended', dot: 'bg-fg-subtle' },
};

export default function ListingCard({
  listing,
  viewerAddress,
  onBuy,
  onCancel,
  onConnect,
  connecting = false,
  preview = false,
  priority = false,
  compactOnMobile = false,
  sizes,
  className,
}: ListingCardProps) {
  const compact = compactOnMobile;
  const overlayPill = cn(overlayPillBase, compact ? overlayPillSize.compact : overlayPillSize.default);
  const titleId = useId();
  const isAuction = !!listing.isAuction;
  const now = useNow(isAuction ? 1000 : 0);
  const [busy, setBusy] = useState<null | 'buy' | 'cancel' | 'connect'>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const title = listing.title?.trim() || 'Untitled item';
  const href = `/listing?id=${encodeURIComponent(listing.listing_id)}`;
  const status = listing.status ?? 'active';
  const isActive = status === 'active';
  const parts = countdownParts(listing.auctionEndTime, now);
  const auctionEnded = isAuction && parts.ended;
  const endingSoon = isAuction && !parts.ended && parts.totalMs < 60 * 60 * 1000;
  const isSeller = !!viewerAddress && listing.seller?.toLowerCase() === viewerAddress.toLowerCase();
  const priceValue = isAuction ? listing.currentBid ?? listing.price : listing.price;
  const priceLabel = isAuction ? (listing.currentBid ? 'Current bid' : 'Starting bid') : 'Price';
  // The contract lets a seller cancel an auction only until the first bid arrives.
  const canCancel = !!onCancel && !(isAuction && (listing.highestBidder || listing.currentBid));

  const run = async (kind: 'buy' | 'cancel' | 'connect', fn?: () => void | Promise<unknown>) => {
    if (!fn || busy) return;
    setBusy(kind);
    try {
      await fn();
    } finally {
      if (mounted.current) setBusy(null);
    }
  };

  const spinner = <LoaderCircle aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" strokeWidth={2} />;

  /* ---------------------------------------------------------------- action */
  let action: React.ReactNode;
  if (preview) {
    action = (
      <span aria-disabled="true" className={cn(ctaClasses, 'pointer-events-none opacity-60')}>
        {isAuction ? <Gavel aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} /> : null}
        {isAuction ? 'Place bid' : 'Buy now'}
      </span>
    );
  } else if (!isActive || auctionEnded) {
    action = (
      <Link href={href} className={buttonVariants({ variant: 'secondary', className: 'relative z-10 w-full' })}>
        View details
        <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-fg-subtle" strokeWidth={1.75} />
      </Link>
    );
  } else if (isSeller) {
    action = canCancel && onCancel ? (
      <button
        type="button"
        onClick={() => run('cancel', () => onCancel(listing.listing_id))}
        disabled={busy !== null}
        aria-busy={busy === 'cancel' || undefined}
        className={buttonVariants({ variant: 'danger', className: 'relative z-10 w-full' })}
      >
        {busy === 'cancel' ? spinner : <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
        {busy === 'cancel' ? 'Cancelling' : 'Cancel listing'}
      </button>
    ) : (
      <Link href={href} className={buttonVariants({ variant: 'secondary', className: 'relative z-10 w-full' })}>
        Manage listing
      </Link>
    );
  } else if (!viewerAddress) {
    const label = isAuction ? 'Connect to bid' : 'Connect to buy';
    action = onConnect ? (
      <button
        type="button"
        onClick={() => run('connect', onConnect)}
        disabled={connecting || busy !== null}
        aria-busy={connecting || busy === 'connect' || undefined}
        className={ctaClasses}
      >
        {connecting || busy === 'connect' ? spinner : <Wallet aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
        {connecting || busy === 'connect' ? 'Connecting' : label}
      </button>
    ) : (
      <Link href={href} className={ctaClasses}>
        <Wallet aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
        {label}
      </Link>
    );
  } else if (isAuction) {
    action = (
      <Link href={href} className={ctaClasses}>
        <Gavel aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
        Place bid
      </Link>
    );
  } else if (onBuy) {
    action = (
      <button
        type="button"
        onClick={() => run('buy', () => onBuy(listing.listing_id))}
        disabled={busy !== null}
        aria-busy={busy === 'buy' || undefined}
        className={ctaClasses}
      >
        {busy === 'buy' ? spinner : null}
        {busy === 'buy' ? 'Buying' : 'Buy now'}
      </button>
    );
  } else {
    action = (
      <Link href={href} className={ctaClasses}>
        Buy now
      </Link>
    );
  }

  /* ----------------------------------------------------------- top badges */
  let statusBadge: React.ReactNode;
  if (!isActive) {
    const s = STATUS_LABEL[status] ?? { label: status, dot: 'bg-fg-subtle' };
    statusBadge = (
      <span className={overlayPill}>
        <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
        <span className="capitalize">{s.label}</span>
      </span>
    );
  } else if (isAuction) {
    statusBadge = (
      <span className={overlayPill}>
        <Gavel aria-hidden="true" className="h-3.5 w-3.5 text-warning" strokeWidth={1.75} />
        {auctionEnded ? (
          'Auction ended'
        ) : (
          <>
            <span className={cn(compact && 'sr-only sm:not-sr-only')}>Auction</span>
            <span aria-hidden="true" className={cn('h-3 w-px bg-line-strong', compact && 'hidden sm:block')} />
            <span className={cn('tabular-nums', endingSoon ? 'text-warning' : 'text-fg-muted')}>
              <span className="sr-only">ends in </span>
              {formatCountdown(listing.auctionEndTime, now)}
            </span>
          </>
        )}
      </span>
    );
  } else {
    statusBadge = (
      <span className={overlayPill}>
        <Tag aria-hidden="true" className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
        Buy now
      </span>
    );
  }

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-line bg-surface',
        !preview &&
          'transition-[border-color,box-shadow,transform] duration-300 ease-out-expo hover:border-line-strong hover:shadow-card-hover motion-safe:hover:-translate-y-0.5',
        className
      )}
    >
      {/* Artwork */}
      <div className="relative aspect-square overflow-hidden rounded-t-[15px] bg-surface-2">
        <Image
          src={listingImage(listing)}
          alt=""
          fill
          sizes={sizes ?? (compact ? COMPACT_SIZES : DEFAULT_SIZES)}
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out-expo motion-safe:group-hover:scale-[1.035]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-bg/45 to-transparent" />
        <div
          className={cn(
            'absolute flex items-start justify-between gap-2',
            compact ? 'inset-x-2 top-2 sm:inset-x-3 sm:top-3' : 'inset-x-3 top-3'
          )}
        >
          {statusBadge}
          {typeof listing.favorites === 'number' && (
            <span className={overlayPill}>
              <Heart aria-hidden="true" className="h-3.5 w-3.5 text-fg-muted" strokeWidth={1.75} />
              <span className="tabular-nums">{formatNumber(listing.favorites, { compact: true })}</span>
              <span className="sr-only">favourites</span>
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={cn('flex flex-1 flex-col', compact ? 'p-3 sm:p-4' : 'p-4')}>
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase leading-4 tracking-[0.08em] text-fg-subtle">
          <CategoryIcon category={listing.category} className="h-3.5 w-3.5" />
          {categoryName(listing.category) || 'Other'}
        </p>
        <h3
          id={titleId}
          className={cn(
            'mt-1.5 font-sans font-semibold text-fg',
            compact ? 'text-sm leading-5 sm:text-[15px] sm:leading-6' : 'text-[15px] leading-6'
          )}
        >
          {preview ? (
            <span className="block truncate">{title}</span>
          ) : (
            <Link
              href={href}
              className="block truncate rounded-sm focus-visible:outline-none after:absolute after:inset-0 after:z-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-accent focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-bg"
            >
              {title}
            </Link>
          )}
        </h3>

        {/* Labels share one row and values the next, so both columns line up. */}
        <dl
          className={cn(
            'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1',
            compact ? 'mt-3 sm:mt-4' : 'mt-4'
          )}
        >
          <div className="contents">
            <dt className="col-start-1 row-start-1 text-xs leading-4 text-fg-subtle">{priceLabel}</dt>
            <dd className="col-start-1 row-start-2 min-w-0">
              {compact ? (
                <>
                  <span className="flex sm:hidden">
                    <Price value={priceValue} size="sm" />
                  </span>
                  <span className="hidden sm:flex">
                    <Price value={priceValue} size="md" />
                  </span>
                </>
              ) : (
                <Price value={priceValue} size="md" />
              )}
            </dd>
          </div>
          <div className="contents">
            <dt
              className={cn(
                'col-start-2 row-start-1 text-right text-xs leading-4 text-fg-subtle',
                compact && 'hidden sm:block'
              )}
            >
              Seller
            </dt>
            <dd
              className={cn(
                'col-start-2 row-start-2 min-w-0 items-center justify-end gap-1.5',
                compact ? 'hidden sm:flex' : 'flex'
              )}
            >
              <Identicon address={listing.seller} size={16} />
              <UserName address={listing.seller} viewer={viewerAddress} className="text-xs text-fg-muted" />
            </dd>
          </div>
        </dl>

        <div className={cn('mt-4', compact && 'hidden sm:block')}>{action}</div>
      </div>
    </article>
  );
}

/** Loading placeholder with the same footprint as a ListingCard. */
export function ListingCardSkeleton({ className, compactOnMobile = false }: { className?: string; compactOnMobile?: boolean }) {
  const compact = compactOnMobile;
  return (
    <div aria-hidden="true" className={cn('flex flex-col rounded-2xl border border-line bg-surface', className)}>
      <Skeleton className="aspect-square rounded-b-none rounded-t-[15px]" />
      <div className={compact ? 'p-3 sm:p-4' : 'p-4'}>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-3 h-4 w-3/4" />
        <div className={cn('flex items-end justify-between', compact ? 'mt-4 sm:mt-5' : 'mt-5')}>
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className={cn('flex-col items-end space-y-2', compact ? 'hidden sm:flex' : 'flex')}>
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className={cn('mt-4 h-10 w-full rounded-control', compact && 'hidden sm:block')} />
      </div>
    </div>
  );
}

export { ListingCard };

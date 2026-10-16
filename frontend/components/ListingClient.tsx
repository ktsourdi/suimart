'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ConnectButton } from '@mysten/dapp-kit';
import {
  ArrowRight,
  Box,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Compass,
  Eye,
  Gavel,
  Globe,
  Hash,
  Heart,
  Hourglass,
  Info,
  Maximize2,
  RotateCw,
  SearchX,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Undo2,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { mockListings as seedListings, mockMarketplace, type MockListing } from '../lib/mockData';
import { displayName, knownUser } from '../lib/users';
import { useWallet } from '../lib/useWallet';
import { MOCK_MODE, SUI_NETWORK } from '../lib/config';
import { useSuiClient } from '../lib/suiClient';
import { categoryKey, categoryName, listingImage } from '../lib/categories';
import {
  countdownParts,
  formatCountdown,
  formatDate,
  formatNumber,
  formatSui,
  pad2,
  timeAgo,
  truncateAddress,
  useNow,
  type CountdownParts,
} from '../lib/format';
import { useToast } from './ToastProvider';
import Address from './Address';
import EmptyState from './EmptyState';
import ListingCard from './ListingCard';
import Price from './Price';
import SectionHeading from './SectionHeading';
import UserName from './UserName';
import { CategoryIcon } from './categoryIcons';
import { Identicon } from './ui/Avatar';
import Badge from './ui/Badge';
import Button, { buttonVariants } from './ui/Button';
import { Card } from './ui/Card';
import Input from './ui/Input';
import Rating from './ui/Rating';
import { DETAIL_GRID, ListingDetailSkeleton } from './ListingDetailSkeleton';
import { cn } from './ui/cn';

// types/next-navigation.d.ts stubs next/navigation with useRouter only; declare
// useSearchParams here (a harmless overload once that stub is removed).
declare module 'next/navigation' {
  export function useSearchParams(): URLSearchParams | null;
}

/* ----------------------------------------------------------------------------
   Constants and helpers
---------------------------------------------------------------------------- */

type Pending = 'buy' | 'bid' | 'cancel' | 'settle' | null;
type Outcome = 'bought' | 'cancelled' | 'settled' | null;
type ListingStatus = MockListing['status'];

/** A new bid must beat the leading bid (or the starting price) by at least 5%. */
const MIN_RAISE = 0.05;
/** SUI has 9 decimals (1 SUI = 10^9 MIST). */
const SUI_DECIMALS = 9;
const ENDING_SOON_MS = 60 * 60 * 1000;
const FAVOURITES_KEY = 'suimart:favourites';

const ART_SIZES = '(min-width: 1280px) 620px, (min-width: 1024px) 52vw, (min-width: 768px) 48vw, 100vw';
const RELATED_SIZES = '(min-width: 1280px) 296px, (min-width: 1024px) 23vw, 46vw';
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

/** Rounds up to the cent: 32.7600001 -> 32.76. */
function ceilCents(n: number): number {
  return Math.ceil(n * 100 - 1e-6) / 100;
}

function leadingAmount(listing: MockListing): number {
  return listing.currentBid ?? listing.price;
}

/** The lowest bid the form accepts: 5% above the leading bid, and always strictly above it. */
function minimumNextBid(listing: MockListing): number {
  const leading = leadingAmount(listing);
  return Math.max(ceilCents(leading * (1 + MIN_RAISE)), ceilCents(leading + 0.01));
}

/** Returns an error message for the bid field, or null when the bid is acceptable. */
function validateBid(raw: string, min: number): string | null {
  const text = raw.trim();
  if (!text) return 'Enter the amount you want to bid.';
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) return 'Enter a valid amount in SUI.';
  const decimals = text.includes('.') ? text.split('.')[1].length : 0;
  if (decimals > SUI_DECIMALS) return `SUI supports up to ${SUI_DECIMALS} decimal places.`;
  if (value < min) return `Your bid must be at least ${formatSui(min)} SUI.`;
  return null;
}

function sameAddress(a?: string | null, b?: string | null): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

// Demo listings seen during this visit. The mock marketplace hands out its own objects and
// updates them in place, so a listing that later sells or is cancelled keeps its new status.
const seenListings = new Map<string, MockListing>();

/**
 * The listing with this id. getListings() returns active listings only; in the demo, sold,
 * cancelled and settled listings (linked from the profile's Purchases and Activity, or
 * reached with Back) are still found, with their latest status.
 */
function findListing(items: MockListing[], id: string): MockListing | null {
  if (MOCK_MODE) items.forEach((l) => seenListings.set(l.listing_id, l));
  const active = items.find((l) => l.listing_id === id);
  if (active) return active;
  if (!MOCK_MODE) return null;
  return seenListings.get(id) ?? seedListings.find((l) => l.listing_id === id) ?? null;
}

/** "0x2::devnet_nft::DevNFT" stays as is; a long package address is shortened. */
function shortType(type: string): string {
  const [pkg, ...rest] = type.split('::');
  if (!rest.length) return type;
  return [truncateAddress(pkg, 6, 4), ...rest].join('::');
}

/** "Oct 18 at 9:41 PM" */
function formatMoment(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} at ${time}`;
}

function networkName(): string {
  return `Sui ${SUI_NETWORK.charAt(0).toUpperCase()}${SUI_NETWORK.slice(1)}`;
}

/**
 * Up to four other active listings: same category first, then the same seller, then the most
 * favourited. Without a current listing (not found), simply the most favourited.
 */
function pickRelated(items: MockListing[], current: MockListing | null, count = 4): MockListing[] {
  const byFavourites = (a: MockListing, b: MockListing) => (b.favorites ?? 0) - (a.favorites ?? 0);
  if (!current) return [...items].sort(byFavourites).slice(0, count);
  const rest = items.filter((l) => l.listing_id !== current.listing_id);
  const key = categoryKey(current.category);
  const sameCategory = rest.filter((l) => categoryKey(l.category) === key);
  const sameSeller = rest.filter((l) => !sameCategory.includes(l) && sameAddress(l.seller, current.seller));
  const others = rest
    .filter((l) => !sameCategory.includes(l) && !sameSeller.includes(l))
    .sort(byFavourites);
  return [...sameCategory, ...sameSeller, ...others].slice(0, count);
}

// Favourites are a per-browser convenience; storage can be unavailable (private mode).
function readFavourites(): string[] {
  try {
    const raw = window.localStorage.getItem(FAVOURITES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeFavourite(id: string, on: boolean) {
  try {
    const ids = new Set(readFavourites());
    if (on) ids.add(id);
    else ids.delete(id);
    window.localStorage.setItem(FAVOURITES_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Not persisted; the toggle still works for this visit.
  }
}

/* ----------------------------------------------------------------------------
   Small building blocks
---------------------------------------------------------------------------- */

const NOTE_TONES = {
  neutral: { box: 'border-line-strong bg-surface-2/60', icon: 'text-fg-muted' },
  accent: { box: 'border-accent/25 bg-accent/[0.07]', icon: 'text-accent' },
  success: { box: 'border-success/25 bg-success/[0.07]', icon: 'text-success' },
} as const;

function Note({
  tone = 'neutral',
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof NOTE_TONES;
  icon: LucideIcon;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const t = NOTE_TONES[tone];
  return (
    <div className={cn('flex gap-3 rounded-xl border p-3.5 text-small', t.box, className)}>
      <Icon aria-hidden="true" className={cn('mt-0.5 h-4 w-4 shrink-0', t.icon)} strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium text-fg">{title}</p>}
        {children && <p className={cn('text-fg-muted', !!title && 'mt-0.5')}>{children}</p>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}

/** dapp-kit's connect button, stretched to the width of the panel (real mode only). */
function WalletConnect({ label }: { label: string }) {
  return (
    <div className="[&_button]:h-12 [&_button]:w-full [&_button]:justify-center">
      <ConnectButton connectText={label} />
    </div>
  );
}

function Countdown({ parts, urgent, over }: { parts: CountdownParts; urgent: boolean; over: boolean }) {
  const units = [
    { label: 'Days', value: parts.days },
    { label: 'Hours', value: parts.hours },
    { label: 'Min', value: parts.minutes },
    { label: 'Sec', value: parts.seconds },
  ];
  // Announced only when focused or read; the label skips seconds so it changes once a minute.
  const spoken = over
    ? 'Auction ended'
    : `Ends in ${parts.days} days, ${parts.hours} hours and ${parts.minutes} minutes`;

  return (
    <div role="timer" aria-live="off" aria-label={spoken} className="mt-3 grid grid-cols-4 gap-2 sm:gap-2.5">
      {units.map((u) => (
        <div
          key={u.label}
          aria-hidden="true"
          className="flex flex-col items-center rounded-xl border border-line bg-bg/50 px-1 pb-2.5 pt-3 shadow-inset-line"
        >
          <span
            className={cn(
              'font-display text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums sm:text-[30px]',
              over ? 'text-fg-subtle' : urgent ? 'text-warning' : 'text-fg'
            )}
          >
            {pad2(over ? 0 : u.value)}
          </span>
          <span className="mt-2 text-[11px] font-medium uppercase leading-none tracking-[0.08em] text-fg-subtle">
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function DetailRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[48px] items-center justify-between gap-4 py-2.5 text-small">
      <dt className="flex shrink-0 items-center gap-2 text-fg-subtle">
        <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
        {label}
      </dt>
      <dd className="flex min-w-0 items-center justify-end gap-2 text-right text-fg">{children}</dd>
    </div>
  );
}

function Breadcrumb({ category, title }: { category?: string; title: string }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-1.5 text-small text-fg-subtle">
        <li className="shrink-0">
          <Link href="/#market" className={cn('rounded-sm transition-colors hover:text-fg', FOCUS)}>
            Explore
          </Link>
        </li>
        <li className="flex shrink-0 items-center gap-1.5">
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-fg-subtle/60" strokeWidth={1.75} />
          <span>{categoryName(category) || 'Other'}</span>
        </li>
        <li className="flex min-w-0 items-center gap-1.5">
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-fg-subtle/60" strokeWidth={1.75} />
          <span aria-current="page" className="truncate text-fg-muted">
            {title}
          </span>
        </li>
      </ol>
    </nav>
  );
}

/* ----------------------------------------------------------------------------
   Page
---------------------------------------------------------------------------- */

export default function ListingClient() {
  const searchParams = useSearchParams();
  const listingId = useMemo(() => {
    const fromRouter = searchParams?.get('id');
    if (fromRouter) return fromRouter.trim();
    if (typeof window === 'undefined') return '';
    return (new URL(window.location.href).searchParams.get('id') || '').trim();
  }, [searchParams]);

  const wallet = useWallet();
  const { currentAccount, connect } = wallet;
  const connecting = !!wallet.isLoading;
  const viewer: string | undefined = currentAccount?.address;

  const sui = useSuiClient();
  // useSuiClient() returns a new object on every render; keep the latest in a ref
  // so the loader below runs once per listing id instead of on every render.
  const suiRef = useRef(sui);
  suiRef.current = sui;
  const { showToast } = useToast();

  const [listing, setListing] = useState<MockListing | null>(null);
  const [related, setRelated] = useState<MockListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [pending, setPending] = useState<Pending>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState<string | null>(null);
  const [favourited, setFavourited] = useState(false);
  const bidInputRef = useRef<HTMLInputElement>(null);

  // Phones: a bar pinned to the bottom with the price and the main action, shown while the
  // price panel's action is off-screen and hidden again near the end of the page.
  const [actionEl, setActionEl] = useState<HTMLDivElement | null>(null);
  const [pageEndEl, setPageEndEl] = useState<HTMLDivElement | null>(null);
  const [actionInView, setActionInView] = useState(true);
  const [pageEndNear, setPageEndNear] = useState(false);

  useEffect(() => {
    if (!actionEl || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setActionInView(entry.isIntersecting));
    observer.observe(actionEl);
    return () => observer.disconnect();
  }, [actionEl]);

  useEffect(() => {
    if (!pageEndEl || typeof IntersectionObserver === 'undefined') return;
    // Counts as near a little before it scrolls in, so the bar is gone before it covers the footer.
    const observer = new IntersectionObserver(([entry]) => setPageEndNear(entry.isIntersecting), {
      rootMargin: '0px 0px 96px 0px',
    });
    observer.observe(pageEndEl);
    return () => observer.disconnect();
  }, [pageEndEl]);

  const panelId = useId();
  const minHintId = useId();
  const detailsId = useId();
  const descriptionId = useId();
  const relatedId = useId();

  const fetchListings = useCallback(async (): Promise<MockListing[]> => {
    return MOCK_MODE ? mockMarketplace.getListings() : suiRef.current.getListings();
  }, []);

  // Load the listing (and a few others to show below it) whenever ?id= changes.
  useEffect(() => {
    setBidAmount('');
    setBidError(null);
    setOutcome(null);
    // Without an id there is nothing to find, but the popular listings are still worth showing.
    let mounted = true;
    setLoading(true);
    setLoadFailed(false);
    fetchListings()
      .then((items) => {
        if (!mounted) return;
        const found = findListing(items, listingId);
        setListing(found ? { ...found } : null);
        setRelated(pickRelated(items, found));
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setListing(null);
        setLoadFailed(true);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [listingId, fetchListings, reloadKey]);

  useEffect(() => {
    setFavourited(listingId ? readFavourites().includes(listingId) : false);
  }, [listingId]);

  const pageTitle = listing?.title?.trim();
  useEffect(() => {
    if (!pageTitle) return;
    const previous = document.title;
    const own = `${pageTitle} · SuiMart`;
    document.title = own;
    return () => {
      // After a client-side navigation the next route has already set its own
      // title; only restore when ours is still showing.
      if (document.title === own) document.title = previous;
    };
  }, [pageTitle]);

  const isAuction = !!listing?.isAuction;
  const isActive = (listing?.status ?? 'active') === 'active';
  // Ticks every second while an auction is open, so the countdown stays live.
  const now = useNow(isAuction && isActive ? 1000 : 0);
  const parts = countdownParts(listing?.auctionEndTime, now);
  const auctionOver = isAuction && (parts.ended || !isActive);
  const endingSoon = isAuction && !auctionOver && parts.totalMs < ENDING_SOON_MS;

  const isOwner = sameAddress(viewer, listing?.seller);
  const isLeading = sameAddress(viewer, listing?.highestBidder);
  const hasBids = !!listing?.highestBidder;
  const leadingBid = listing ? leadingAmount(listing) : 0;
  const minBid = listing ? minimumNextBid(listing) : 0;

  /* ------------------------------------------------------------- actions */

  // Re-reads the listing after a transaction. Sold, cancelled and settled listings
  // drop out of the active set; keep the last snapshot with its new status instead.
  const refresh = async (id: string, fallback?: ListingStatus) => {
    const items = await fetchListings();
    const found = findListing(items, id);
    setListing((prev) => {
      if (found) return { ...found };
      if (prev && fallback) return { ...prev, status: fallback, updatedAt: Date.now() };
      return null;
    });
  };

  const runAction = async (
    kind: Exclude<Pending, null>,
    task: () => Promise<unknown>,
    messages: { success: string; failure: string },
    options: { id: string; fallback?: ListingStatus; onSuccess?: () => void }
  ) => {
    setPending(kind);
    try {
      await task();
      await refresh(options.id, options.fallback);
      options.onSuccess?.();
      showToast('success', messages.success);
    } catch (e) {
      console.error(e);
      showToast('error', messages.failure);
    } finally {
      setPending(null);
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (e) {
      console.error(e);
      showToast('error', 'Could not connect the wallet.');
    }
  };

  const handleBuy = async () => {
    if (!currentAccount || !listing || pending) return;
    const l = listing;
    const buyer: string = currentAccount.address;
    await runAction(
      'buy',
      () =>
        MOCK_MODE
          ? mockMarketplace.buyItem(l.listing_id, buyer)
          : suiRef.current.buyItem(l.listing_id, l.itemType, l.price),
      { success: 'Purchase complete.', failure: 'Purchase failed. Please try again.' },
      { id: l.listing_id, fallback: 'sold', onSuccess: () => setOutcome('bought') }
    );
  };

  const handleCancel = async () => {
    if (!currentAccount || !listing || pending) return;
    const l = listing;
    const seller: string = currentAccount.address;
    await runAction(
      'cancel',
      () =>
        MOCK_MODE
          ? mockMarketplace.cancelListing(l.listing_id, seller)
          : suiRef.current.cancelListing(l.listing_id, l.itemType),
      { success: 'Listing cancelled.', failure: 'Cancellation failed. Please try again.' },
      { id: l.listing_id, fallback: 'cancelled', onSuccess: () => setOutcome('cancelled') }
    );
  };

  const handleBid = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!currentAccount || !listing || pending) return;
    const error = validateBid(bidAmount, minBid);
    if (error) {
      setBidError(error);
      bidInputRef.current?.focus();
      return;
    }
    const l = listing;
    const bidder: string = currentAccount.address;
    const value = Number(bidAmount.trim());
    await runAction(
      'bid',
      () =>
        MOCK_MODE
          ? mockMarketplace.placeBid(l.listing_id, value, bidder)
          : suiRef.current.placeBid(l.listing_id, l.itemType, value),
      { success: `Bid placed: ${formatSui(value)} SUI.`, failure: 'Bid failed. Please try again.' },
      {
        id: l.listing_id,
        onSuccess: () => {
          setBidAmount('');
          setBidError(null);
        },
      }
    );
  };

  const handleEndAuction = async () => {
    if (!listing || pending) return;
    const l = listing;
    await runAction(
      'settle',
      () => (MOCK_MODE ? mockMarketplace.endAuction(l.listing_id) : suiRef.current.endAuction(l.listing_id, l.itemType)),
      { success: 'Auction settled.', failure: 'Could not settle the auction. Please try again.' },
      { id: l.listing_id, fallback: l.currentBid ? 'sold' : 'ended', onSuccess: () => setOutcome('settled') }
    );
  };

  const toggleFavourite = () => {
    if (!listing) return;
    const next = !favourited;
    setFavourited(next);
    writeFavourite(listing.listing_id, next);
    showToast(next ? 'success' : 'info', next ? 'Added to your favourites.' : 'Removed from your favourites.');
  };

  const handleShare = async () => {
    if (!listing) return;
    const url = window.location.href;
    const touch = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    try {
      if (touch && typeof navigator.share === 'function') {
        await navigator.share({ title: listing.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast('success', 'Link copied to clipboard.');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      showToast('error', 'Could not copy the link.');
    }
  };

  const onBidChange = (value: string) => {
    setBidAmount(value);
    // Once an error is showing, re-check as the user types so it clears as soon as the bid is valid.
    if (bidError) setBidError(validateBid(value, minBid));
  };

  /* ---------------------------------------------------------- page states */

  const relatedSection =
    related.length > 0 ? (
      <section aria-labelledby={relatedId} className="mt-16 sm:mt-24">
        <SectionHeading
          id={relatedId}
          eyebrow="Keep exploring"
          title={listing ? 'More from the market' : 'Popular right now'}
          action={
            <Link href="/#market" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
              View all listings
              <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          }
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {related.map((item) => (
            <ListingCard
              key={item.listing_id}
              listing={item}
              viewerAddress={viewer ?? null}
              onConnect={MOCK_MODE ? handleConnect : undefined}
              connecting={connecting}
              sizes={RELATED_SIZES}
              compactOnMobile
            />
          ))}
        </div>
      </section>
    ) : null;

  if (loading) return <ListingDetailSkeleton />;

  if (loadFailed && listingId) {
    return (
      <div className="container-page pt-10 sm:pt-14">
        <EmptyState
          size="lg"
          icon={CircleAlert}
          title="We couldn't load this listing"
          text="The network didn't respond. Check your connection and try again."
          action={
            <>
              <Button onClick={() => setReloadKey((k) => k + 1)}>
                <RotateCw aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                Try again
              </Button>
              <Link href="/#market" className={buttonVariants({ variant: 'secondary' })}>
                Back to the market
              </Link>
            </>
          }
        />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container-page pt-10 sm:pt-14">
        <EmptyState
          size="lg"
          icon={SearchX}
          title={listingId ? 'This listing is not available' : 'No listing selected'}
          text={
            listingId
              ? 'It may have sold or been cancelled, or the link is incomplete.'
              : 'Open a listing from the market to see its details.'
          }
          action={
            <>
              <Link href="/#market" className={buttonVariants({ variant: 'primary' })}>
                <Compass aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                Explore listings
              </Link>
              <Link href="/sell" className={buttonVariants({ variant: 'secondary' })}>
                List an item
              </Link>
            </>
          }
        />
        {relatedSection}
      </div>
    );
  }

  /* --------------------------------------------------------------- derived */

  const title = listing.title?.trim() || 'Untitled item';
  const description = listing.description?.trim();
  const image = listingImage(listing);
  const seller = knownUser(listing.seller);
  const favourites = (listing.favorites ?? 0) + (favourited ? 1 : 0);
  const busy = pending !== null;

  let statusBadge: ReactNode;
  if (!isActive) {
    statusBadge =
      listing.status === 'sold' ? (
        <Badge variant="success" dot>
          Sold
        </Badge>
      ) : (
        <Badge variant="neutral" dot>
          {listing.status === 'cancelled' ? 'Cancelled' : 'Ended'}
        </Badge>
      );
  } else if (isAuction) {
    statusBadge = auctionOver ? (
      <Badge variant="neutral" dot>
        Auction ended
      </Badge>
    ) : (
      <Badge variant="warning" dot pulse>
        {endingSoon ? 'Ending soon' : 'Live auction'}
      </Badge>
    );
  } else {
    statusBadge = (
      <Badge variant="accent" dot>
        For sale
      </Badge>
    );
  }

  // What happened after a transaction on this page (or why the listing is closed).
  // In the demo a purchase is recorded on the buyer, so a return visit still shows ownership.
  const boughtByViewer =
    !!viewer &&
    (outcome === 'bought' ||
      (listing.status === 'sold' && !isAuction && !!knownUser(viewer)?.purchases.includes(listing.listing_id)));
  let outcomeNote: ReactNode = null;
  if (!isActive) {
    if (boughtByViewer) {
      outcomeNote = (
        <Note
          tone="success"
          icon={CircleCheck}
          title="You own this item"
          action={
            <Link href="/profile" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
              View in your profile
              <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          }
        >
          {title} has been transferred to your wallet.
        </Note>
      );
    } else if (listing.status === 'cancelled' && isOwner) {
      outcomeNote = (
        <Note icon={Undo2} title="Listing cancelled">
          The item has been returned to your wallet.
        </Note>
      );
    } else if (listing.status === 'sold' && isAuction) {
      outcomeNote = isLeading ? (
        <Note
          tone="success"
          icon={CircleCheck}
          title="You won this auction"
          action={
            <Link href="/profile" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
              View in your profile
              <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          }
        >
          The item has been transferred to your wallet.
        </Note>
      ) : (
        <Note tone="success" icon={Gavel} title="Auction settled">
          Sold for {formatSui(leadingBid)} SUI to {displayName(listing.highestBidder, viewer)}.
        </Note>
      );
    } else if (listing.status === 'ended') {
      outcomeNote = (
        <Note icon={Hourglass} title="Auction closed without bids">
          The item has been returned to the seller.
        </Note>
      );
    } else {
      outcomeNote = (
        <Note icon={Info} title="No longer available">
          This listing has been {listing.status}.
        </Note>
      );
    }
  }

  const connectLabel = isAuction ? 'Connect wallet to bid' : 'Connect wallet to buy';
  const connectAction = MOCK_MODE ? (
    <Button size="lg" className="w-full" onClick={handleConnect} loading={connecting}>
      {!connecting && <Wallet aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
      {connecting ? 'Connecting' : connectLabel}
    </Button>
  ) : (
    <WalletConnect label={connectLabel} />
  );

  const quickBids = [
    { label: 'Min', value: minBid },
    { label: '+10%', value: Math.max(minBid, ceilCents(leadingBid * 1.1)) },
    { label: '+25%', value: Math.max(minBid, ceilCents(leadingBid * 1.25)) },
  ];

  /* ---------------------------------------------------- primary action area */

  let primary: ReactNode;
  if (outcomeNote) {
    primary = outcomeNote;
  } else if (isAuction) {
    if (auctionOver) {
      primary =
        !MOCK_MODE && !currentAccount ? (
          <WalletConnect label="Connect wallet to settle" />
        ) : (
          <div className="space-y-3">
            <Note icon={Hourglass}>
              Bidding has closed. Settling sends the item to the winner and the payment to the seller.
            </Note>
            <Button size="lg" className="w-full" onClick={handleEndAuction} loading={pending === 'settle'} disabled={busy}>
              {pending !== 'settle' && <Gavel aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
              {pending === 'settle' ? 'Settling auction' : 'Settle auction'}
            </Button>
          </div>
        );
    } else if (isOwner) {
      // The contract lets a seller cancel an auction only until the first bid arrives.
      primary = hasBids ? (
        <Note tone="accent" icon={Info} title="This is your auction">
          Bids are held in escrow by the contract. You can settle the auction once it ends.
        </Note>
      ) : (
        <div className="space-y-3">
          <Note tone="accent" icon={Info} title="This is your auction">
            No bids yet. You can cancel it until the first bid arrives, which returns the item to your wallet.
          </Note>
          <Button variant="danger" size="lg" className="w-full" onClick={handleCancel} loading={pending === 'cancel'} disabled={busy}>
            {pending !== 'cancel' && <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
            {pending === 'cancel' ? 'Cancelling auction' : 'Cancel auction'}
          </Button>
        </div>
      );
    } else if (!currentAccount) {
      primary = connectAction;
    } else {
      primary = (
        <form onSubmit={handleBid} noValidate className="space-y-3">
          {isLeading && (
            <Note tone="success" icon={CircleCheck} title="You have the leading bid">
              Bid again to raise it. If you are outbid, your SUI is returned automatically.
            </Note>
          )}
          <Input
            ref={bidInputRef}
            label="Your bid"
            type="number"
            inputMode="decimal"
            min={minBid}
            step="0.01"
            placeholder={minBid.toFixed(2)}
            autoComplete="off"
            inputSize="lg"
            trailing="SUI"
            inputClassName="font-medium tabular-nums"
            value={bidAmount}
            onChange={(e) => onBidChange(e.target.value)}
            onBlur={(e) => {
              if (e.target.value.trim()) setBidError(validateBid(e.target.value, minBid));
            }}
            error={bidError ?? undefined}
            disabled={busy}
            {...(bidError ? {} : { 'aria-describedby': minHintId })}
          />
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Quick bid amounts">
            {quickBids.map((q) => {
              const selected = bidAmount.trim() !== '' && Number(bidAmount) === q.value;
              return (
                <button
                  key={q.label}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setBidAmount(q.value.toFixed(2));
                    setBidError(null);
                  }}
                  aria-label={`Bid ${formatSui(q.value)} SUI`}
                  className={cn(
                    'inline-flex h-8 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-1.5 text-xs tabular-nums sm:gap-1.5 sm:px-2 transition-colors disabled:pointer-events-none disabled:opacity-50',
                    FOCUS,
                    selected
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-line-strong bg-surface-2 text-fg hover:border-fg-subtle/30 hover:bg-surface-3'
                  )}
                >
                  <span className={selected ? 'text-accent/80' : 'text-fg-subtle'}>{q.label}</span>
                  <span className="font-medium">{formatSui(q.value, { compact: true })}</span>
                </button>
              );
            })}
          </div>
          <Button type="submit" size="lg" className="w-full" loading={pending === 'bid'} disabled={busy}>
            {pending !== 'bid' && <Gavel aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
            {pending === 'bid' ? 'Placing bid' : 'Place bid'}
          </Button>
        </form>
      );
    }
  } else if (isOwner) {
    primary = (
      <div className="space-y-3">
        <Note tone="accent" icon={Info} title="This is your listing">
          Cancelling takes it off the market and returns the item to your wallet.
        </Note>
        <Button variant="danger" size="lg" className="w-full" onClick={handleCancel} loading={pending === 'cancel'} disabled={busy}>
          {pending !== 'cancel' && <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
          {pending === 'cancel' ? 'Cancelling listing' : 'Cancel listing'}
        </Button>
      </div>
    );
  } else if (!currentAccount) {
    primary = connectAction;
  } else {
    primary = (
      <Button size="lg" className="w-full" onClick={handleBuy} loading={pending === 'buy'} disabled={busy}>
        {pending !== 'buy' && <ShoppingBag aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
        {pending === 'buy' ? 'Completing purchase' : 'Buy now'}
      </Button>
    );
  }

  const secondaryActions = (
    <div className="mt-2.5 grid grid-cols-2 gap-2.5">
      <Button variant="secondary" onClick={toggleFavourite} aria-pressed={favourited}>
        <Heart
          aria-hidden="true"
          className={cn('h-4 w-4 transition-colors', favourited ? 'fill-danger text-danger' : 'text-fg-muted')}
          strokeWidth={1.75}
        />
        {favourited ? 'Favourited' : 'Favourite'}
      </Button>
      <Button variant="secondary" onClick={handleShare}>
        <Share2 aria-hidden="true" className="h-4 w-4 text-fg-muted" strokeWidth={1.75} />
        Share
      </Button>
    </div>
  );

  /* ------------------------------------------------- mobile action bar */

  // Only while there is something to buy or bid on, and not for the seller.
  const barEligible = isActive && !auctionOver && !isOwner;
  const barVisible = barEligible && !actionInView && !pageEndNear;

  const goToBidForm = () => {
    const reduceMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    actionEl?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    bidInputRef.current?.focus({ preventScroll: true });
  };

  let barAction: ReactNode = null;
  if (!currentAccount) {
    barAction = MOCK_MODE ? (
      <Button className="shrink-0" onClick={handleConnect} loading={connecting}>
        {!connecting && <Wallet aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
        {connecting ? 'Connecting' : 'Connect wallet'}
      </Button>
    ) : (
      <div className="shrink-0 [&_button]:h-10">
        <ConnectButton connectText="Connect wallet" />
      </div>
    );
  } else if (isAuction) {
    barAction = (
      <Button className="shrink-0" onClick={goToBidForm} disabled={busy}>
        <Gavel aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
        Place bid
      </Button>
    );
  } else {
    barAction = (
      <Button className="shrink-0" onClick={handleBuy} loading={pending === 'buy'} disabled={busy}>
        {pending !== 'buy' && <ShoppingBag aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
        {pending === 'buy' ? 'Buying' : 'Buy now'}
      </Button>
    );
  }

  const barLabel = isAuction ? (
    <span className="flex items-center gap-1.5">
      {hasBids ? 'Current bid' : 'Starting price'}
      <span aria-hidden="true" className="h-0.5 w-0.5 rounded-full bg-fg-subtle" />
      <span className={cn('tabular-nums', endingSoon && 'text-warning')}>
        <span className="sr-only">ends in </span>
        {formatCountdown(listing.auctionEndTime, now)}
      </span>
    </span>
  ) : (
    'Price'
  );

  const mobileBar = barEligible ? (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/80 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden',
        'transition-[transform,visibility] duration-300 ease-out-expo motion-reduce:transition-none',
        barVisible ? 'visible translate-y-0' : 'invisible translate-y-full'
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Price label={barLabel} value={leadingBid} size="md" className="min-w-0" />
        {barAction}
      </div>
    </div>
  ) : null;

  const footnote = isAuction
    ? 'Bids are held in escrow by the Move contract. If you are outbid, your SUI is returned automatically.'
    : 'Payment and transfer settle together in a single Move transaction.';

  /* ----------------------------------------------------------------- render */

  return (
    <div className="container-page pt-10 sm:pt-14">
      <Breadcrumb category={listing.category} title={title} />

      <div className={cn('mt-6 sm:mt-8', DETAIL_GRID)}>
        {/* Artwork */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card-hover">
            <Image src={image} alt={title} fill priority sizes={ART_SIZES} className="object-cover" />
            <a
              href={image}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open the artwork in a new tab"
              className={cn(
                'absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-bg/60 text-fg-muted backdrop-blur-md transition-colors hover:bg-bg/80 hover:text-fg',
                FOCUS
              )}
            >
              <Maximize2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
            </a>
          </div>
        </div>

        {/* Summary, price panel, details */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">
              <CategoryIcon category={listing.category} />
              {categoryName(listing.category) || 'Other'}
            </Badge>
            {statusBadge}
          </div>

          <h1 className="mt-4 text-balance break-words font-display text-[30px] font-semibold leading-9 tracking-[-0.025em] text-fg sm:text-h1">
            {title}
          </h1>

          {/* Seller */}
          <div className="mt-6 flex items-center justify-between gap-4 border-y border-line py-4">
            <div className="flex min-w-0 items-center gap-3">
              <Identicon address={listing.seller} size={40} />
              <div className="min-w-0">
                <p className="text-xs leading-4 text-fg-subtle">Listed by</p>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  {seller && <span className="truncate text-sm font-medium text-fg">{seller.name}</span>}
                  <Address address={listing.seller} copy size={seller ? 'xs' : 'sm'} />
                  {isOwner && (
                    <Badge variant="accent" size="sm">
                      You
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {seller && (
              <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex md:hidden lg:flex">
                <span className="text-xs leading-4 text-fg-subtle">Seller rating</span>
                <Rating value={seller.reputation} size="sm" showValue />
              </div>
            )}
          </div>

          {/* Price panel */}
          <section aria-labelledby={panelId} className="mt-6">
            <Card variant="elevated">
              {isAuction ? (
                <>
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                      <h2 id={panelId} className="eyebrow">
                        {listing.status === 'cancelled' ? 'Auction cancelled' : auctionOver ? 'Auction ended' : 'Auction ends in'}
                      </h2>
                      {listing.auctionEndTime && listing.status !== 'cancelled' ? (
                        <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
                          <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
                          <time dateTime={new Date(listing.auctionEndTime).toISOString()}>
                            {auctionOver ? 'Closed' : 'Closes'} {formatMoment(listing.auctionEndTime)}
                          </time>
                        </p>
                      ) : null}
                    </div>
                    <Countdown parts={parts} urgent={endingSoon} over={auctionOver} />
                  </div>

                  <div className="border-t border-line p-5 sm:p-6">
                    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                      <Price
                        label={hasBids ? (auctionOver ? 'Winning bid' : 'Current bid') : 'Starting price'}
                        value={leadingBid}
                        size="xl"
                      />
                      {!auctionOver && (
                        <div id={minHintId}>
                          <Price label="Minimum next bid" value={minBid} size="md" align="end" />
                        </div>
                      )}
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
                      {hasBids ? (
                        <div className="bg-surface px-3.5 py-3">
                          <dt className="text-xs leading-4 text-fg-subtle">Starting price</dt>
                          <dd className="mt-1.5">
                            <Price value={listing.price} size="sm" />
                          </dd>
                        </div>
                      ) : (
                        // The headline already shows the starting price; show when bidding opened instead.
                        <div className="bg-surface px-3.5 py-3">
                          <dt className="text-xs leading-4 text-fg-subtle">Opened</dt>
                          <dd className="mt-1.5 text-sm font-semibold leading-5 text-fg">
                            {listing.createdAt ? (
                              <time dateTime={new Date(listing.createdAt).toISOString()}>
                                {timeAgo(listing.createdAt, { now, style: 'long' })}
                              </time>
                            ) : (
                              'Unknown'
                            )}
                          </dd>
                        </div>
                      )}
                      <div className="min-w-0 bg-surface px-3.5 py-3">
                        <dt className="text-xs leading-4 text-fg-subtle">
                          {hasBids ? (auctionOver ? 'Winner' : 'Leading bidder') : 'Bids'}
                        </dt>
                        <dd className="mt-1.5 flex min-w-0 items-center gap-1.5 text-sm">
                          {hasBids && listing.highestBidder ? (
                            <>
                              <Identicon address={listing.highestBidder} size={16} />
                              <UserName address={listing.highestBidder} viewer={viewer} className="font-medium text-fg" />
                            </>
                          ) : (
                            <span className="text-fg-muted">{auctionOver ? 'No bids' : 'No bids yet'}</span>
                          )}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5">
                      <div ref={setActionEl}>{primary}</div>
                      {secondaryActions}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-5 sm:p-6">
                  <h2 id={panelId} className="sr-only">
                    Price
                  </h2>
                  <div className="flex items-end justify-between gap-4">
                    <Price label={listing.status === 'sold' ? 'Sold for' : 'Price'} value={listing.price} size="xl" />
                    <span className="flex items-center gap-1.5 pb-0.5 text-xs text-fg-subtle">
                      <Tag aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Fixed price
                    </span>
                  </div>
                  <div className="mt-5">
                    <div ref={setActionEl}>{primary}</div>
                    {secondaryActions}
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 border-t border-line px-5 py-4 text-xs leading-5 text-fg-subtle sm:px-6">
                <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" strokeWidth={1.75} />
                <p>
                  {footnote}
                  {MOCK_MODE && ' In this demo the wallet and payments are simulated.'}
                </p>
              </div>
            </Card>
          </section>

          {/* Details */}
          <section aria-labelledby={detailsId} className="mt-6">
            <Card>
              <div className="px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
                <h2 id={detailsId} className="font-display text-h3 font-semibold text-fg">
                  Details
                </h2>
                <dl className="mt-2 divide-y divide-line">
                  <DetailRow icon={Hash} label="Object ID">
                    <Address address={listing.listing_id} kind="Object ID" copy size="xs" />
                  </DetailRow>
                  <DetailRow icon={Box} label="Item type">
                    {listing.itemType ? (
                      <span className="truncate font-mono text-xs text-fg-muted" title={listing.itemType}>
                        {shortType(listing.itemType)}
                      </span>
                    ) : (
                      <span className="text-fg-muted">Unknown</span>
                    )}
                  </DetailRow>
                  <DetailRow icon={isAuction ? Gavel : Tag} label="Sale type">
                    {isAuction ? 'Timed auction' : 'Fixed price'}
                  </DetailRow>
                  <DetailRow icon={CalendarDays} label="Listed">
                    {listing.createdAt ? (
                      <time dateTime={new Date(listing.createdAt).toISOString()} className="tabular-nums">
                        {formatDate(listing.createdAt)}
                        <span className="text-fg-subtle"> · {timeAgo(listing.createdAt)}</span>
                      </time>
                    ) : (
                      <span className="text-fg-muted">Unknown</span>
                    )}
                  </DetailRow>
                  <DetailRow icon={Eye} label="Views">
                    <span className="tabular-nums">{formatNumber(listing.views)}</span>
                  </DetailRow>
                  <DetailRow icon={Heart} label="Favourites">
                    <span className="tabular-nums">{formatNumber(favourites)}</span>
                  </DetailRow>
                  <DetailRow icon={Globe} label="Network">
                    {networkName()}
                    {MOCK_MODE && (
                      <Badge variant="neutral" size="sm">
                        Demo
                      </Badge>
                    )}
                  </DetailRow>
                </dl>
              </div>
            </Card>
          </section>

          {/* Description */}
          <section aria-labelledby={descriptionId} className="mt-6">
            <Card>
              <div className="p-5 sm:p-6">
                <h2 id={descriptionId} className="font-display text-h3 font-semibold text-fg">
                  Description
                </h2>
                <p
                  className={cn(
                    'mt-3 whitespace-pre-line break-words text-body',
                    description ? 'text-fg-muted' : 'text-fg-subtle'
                  )}
                >
                  {description || 'The seller has not added a description.'}
                </p>
              </div>
            </Card>
          </section>
        </div>
      </div>

      {relatedSection}
      <div ref={setPageEndEl} aria-hidden="true" />
      {mobileBar}
    </div>
  );
}

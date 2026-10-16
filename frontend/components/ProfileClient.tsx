'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { ConnectButton } from '@mysten/dapp-kit';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  Coins,
  Gavel,
  Link2,
  Pencil,
  Plus,
  ShoppingBag,
  Star,
  Tag,
  Trophy,
  UserRound,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { PACKAGE_ID, SUI_NETWORK, MOCK_MODE } from '../lib/config';
import { useWallet } from '../lib/useWallet';
import { mockListings as seedListings, mockMarketplace, type MockUser } from '../lib/mockData';
import { useListings } from '../lib/suiClient';
import { categoryName, listingImage } from '../lib/categories';
import { formatDate, formatNumber, formatSui, timeAgo, useNow } from '../lib/format';
import Address from './Address';
import EmptyState from './EmptyState';
import ListingCard, { ListingCardSkeleton } from './ListingCard';
import Price, { SuiDrop } from './Price';
import SectionHeading from './SectionHeading';
import { useOptionalToast } from './ToastProvider';
import { Identicon, identiconPalette } from './ui/Avatar';
import Badge from './ui/Badge';
import Button, { buttonVariants } from './ui/Button';
import { Card, CardDescription, CardTitle } from './ui/Card';
import Input from './ui/Input';
import Modal from './ui/Modal';
import Rating from './ui/Rating';
import Skeleton from './ui/Skeleton';
import Tabs, { type TabItem } from './ui/Tabs';
import Textarea from './ui/Textarea';
import { cn } from './ui/cn';

interface UserProfile {
  username: string;
  bio: string;
  avatarUrl: string;
  reputationScore: number;
  totalSales: number;
  totalPurchases: number;
  joinDate: number;
  verified: boolean;
}

/** A listing as the profile reads it. Mock listings and chain listings both fit. */
interface ProfileListing {
  listing_id: string;
  price: number;
  seller: string;
  title?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  isAuction?: boolean;
  auctionEndTime?: number;
  currentBid?: number;
  highestBidder?: string;
  favorites?: number;
  views?: number;
  status?: string;
  createdAt?: number;
  updatedAt?: number;
}

type TabId = 'listings' | 'bids' | 'purchases' | 'activity' | 'about';
const TAB_IDS: readonly TabId[] = ['listings', 'bids', 'purchases', 'activity', 'about'];

type ActivityKind = 'listed' | 'auction' | 'bid' | 'bought' | 'won' | 'sold' | 'cancelled' | 'ended';

interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  listing: ProfileListing;
  amount: number;
  at: number;
}

// Same names, icons and colours as Recent activity on the home page (MarketStats).
const ACTIVITY_META: Record<ActivityKind, { label: string; icon: LucideIcon; tone: string }> = {
  listed: { label: 'Listed', icon: Tag, tone: 'text-accent' },
  auction: { label: 'Auction opened', icon: Gavel, tone: 'text-warning' },
  bid: { label: 'Bid placed', icon: ArrowUpRight, tone: 'text-success' },
  bought: { label: 'Bought', icon: ShoppingBag, tone: 'text-success' },
  won: { label: 'Auction won', icon: Trophy, tone: 'text-success' },
  sold: { label: 'Sold', icon: Check, tone: 'text-success' },
  cancelled: { label: 'Cancelled', icon: X, tone: 'text-fg-subtle' },
  ended: { label: 'Auction ended', icon: Clock, tone: 'text-fg-subtle' },
};

// Two-up on phones with compact cards, as on the home page.
const GRID = 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4';
const PROFILE_FORM_ID = 'profile-form';
const NAME_MAX = 32;
const BIO_MAX = 160;
const iconProps = { 'aria-hidden': true, strokeWidth: 1.75 } as const;

/* ----------------------------------------------------------------------------
   Helpers
---------------------------------------------------------------------------- */

const sameAddress = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());
const plural = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;
/** What a listing sold (or would sell) for: the leading bid for auctions, the price otherwise. */
const settledPrice = (l: ProfileListing) => (l.isAuction ? l.currentBid ?? l.price : l.price) || 0;
const total = (items: ProfileListing[]) => items.reduce((sum, l) => sum + settledPrice(l), 0);
const newestFirst = (a: ProfileListing, b: ProfileListing) => (b.createdAt ?? 0) - (a.createdAt ?? 0);
/** "hsl(18 78% 60%)" -> "hsl(18 78% 60% / 0.3)" */
const withAlpha = (hsl: string, alpha: number) => hsl.replace(/\)$/, ` / ${alpha})`);

function readTabFromUrl(): TabId {
  if (typeof window === 'undefined') return 'listings';
  const tab = new URLSearchParams(window.location.search).get('tab');
  return TAB_IDS.find((id) => id === tab) ?? 'listings';
}

/** Mirrors the open tab in ?tab= so a reload or a shared link lands on it. */
function writeTabToUrl(tab: TabId) {
  try {
    const url = new URL(window.location.href);
    if (tab === 'listings') url.searchParams.delete('tab');
    else url.searchParams.set('tab', tab);
    // Pass null, not history.state: Next only syncs its router with entries it did not write,
    // and would otherwise put the old URL back on its next render.
    window.history.replaceState(null, '', url.toString());
  } catch {
    // Non-essential: the tab still switches.
  }
}

/* ----------------------------------------------------------------------------
   Page
---------------------------------------------------------------------------- */

export default function ProfileClient() {
  const wallet = useWallet();
  const { currentAccount, connect } = wallet;
  const connecting = Boolean(wallet.isLoading);
  const toast = useOptionalToast();
  const address: string | undefined = currentAccount?.address;

  const { data: chainListings, isLoading: chainListingsLoading } = useListings();
  const [mockListings, setMockListings] = useState<ProfileListing[] | null>(null);
  useEffect(() => {
    if (!MOCK_MODE) return;
    let alive = true;
    mockMarketplace.getListings().then((items) => {
      if (alive) setMockListings(items);
    });
    return () => {
      alive = false;
    };
  }, []);
  const listingsData: ProfileListing[] | null | undefined = MOCK_MODE ? mockListings : chainListings;
  const listingsLoading = MOCK_MODE ? mockListings === null : chainListingsLoading;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [knownUser, setKnownUser] = useState<MockUser | null>(null);
  // The address whose profile has been looked up (so "no profile" is not shown mid-load).
  const [checkedFor, setCheckedFor] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<SuiClient | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(readTabFromUrl);

  // Form state
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarError, setAvatarError] = useState<string | undefined>();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const client = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });
      setProvider(client);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!currentAccount || !provider) return;
    const accountAddress: string = currentAccount.address;

    try {
      setLoading(true);
      // This would fetch the user profile from the blockchain. For now it is a local
      // profile, seeded from the demo's mock users when the address is one of them.
      const user = MOCK_MODE ? await mockMarketplace.getUser(accountAddress) : null;
      const firstListedAt = MOCK_MODE
        ? seedListings
            .filter((l) => sameAddress(l.seller, accountAddress))
            .reduce((earliest, l) => Math.min(earliest, l.createdAt), Date.now())
        : Date.now();
      const mockProfile: UserProfile = {
        username: user?.name ?? '',
        bio: '',
        avatarUrl: '',
        reputationScore: user ? Math.round(user.reputation * 20) : 0,
        totalSales: 0,
        totalPurchases: user?.purchases.length ?? 0,
        joinDate: firstListedAt,
        verified: false,
      };
      setKnownUser(user);
      setProfile(mockProfile);
      setUsername(mockProfile.username);
      setBio(mockProfile.bio);
      setAvatarUrl(mockProfile.avatarUrl);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrorMessage('Failed to fetch profile.');
    } finally {
      setLoading(false);
      setCheckedFor(accountAddress);
    }
  }, [currentAccount, provider]);

  useEffect(() => {
    if (currentAccount) {
      fetchProfile();
    }
  }, [currentAccount, fetchProfile]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast?.showToast('error', 'Could not connect the wallet.');
    }
  };

  const handleCreateProfile = async () => {
    if (!currentAccount || !PACKAGE_ID) {
      setErrorMessage('Please connect your wallet and configure the package ID.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      // This would call the create_profile function on the blockchain
      // For now, we'll just update the local state
      const newProfile: UserProfile = {
        username: username.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        reputationScore: 0,
        totalSales: 0,
        totalPurchases: 0,
        joinDate: Date.now(),
        verified: false,
      };
      setProfile(newProfile);
      syncForm(newProfile);
      setIsEditing(false);
      toast?.showToast('success', 'Profile created.');
    } catch (error) {
      console.error('Error creating profile:', error);
      setErrorMessage('Failed to create profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentAccount || !PACKAGE_ID) {
      setErrorMessage('Please connect your wallet and configure the package ID.');
      return;
    }
    if (!profile) return handleCreateProfile();

    try {
      setSaving(true);
      setErrorMessage(null);

      // This would call the update_profile function on the blockchain
      // For now, we'll just update the local state
      const updatedProfile: UserProfile = {
        ...profile,
        username: username.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
      };
      setProfile(updatedProfile);
      syncForm(updatedProfile);
      setIsEditing(false);
      toast?.showToast('success', 'Profile updated.');
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  function syncForm(p: UserProfile | null) {
    setUsername(p?.username ?? '');
    setBio(p?.bio ?? '');
    setAvatarUrl(p?.avatarUrl ?? '');
    setAvatarError(undefined);
  }

  const openEditor = () => {
    setErrorMessage(null);
    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
    syncForm(profile);
  };

  // The dialog focuses its first control (Close); start on the name field instead.
  useEffect(() => {
    if (isEditing) nameInputRef.current?.focus();
  }, [isEditing]);

  const onSubmitProfile = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (avatarUrl.trim() && !isHttpUrl(avatarUrl)) {
      setAvatarError('Use a full image link that starts with https://');
      avatarInputRef.current?.focus();
      return;
    }
    setAvatarError(undefined);
    void (profile ? handleUpdateProfile() : handleCreateProfile());
  };

  // On phones the tab row scrolls sideways: keep the open tab in view (?tab=activity lands off-screen).
  useEffect(() => {
    const list = tabsRef.current?.querySelector<HTMLElement>('[role="tablist"]');
    const tab = list?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!list || !tab) return;
    const listBox = list.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();
    if (tabBox.left < listBox.left) list.scrollLeft -= listBox.left - tabBox.left;
    else if (tabBox.right > listBox.right) list.scrollLeft += tabBox.right - listBox.right;
  }, [activeTab, listingsLoading, address]);

  const selectTab = (id: string) => {
    const next = TAB_IDS.find((t) => t === id) ?? 'listings';
    setActiveTab(next);
    writeTabToUrl(next);
  };

  /* ---------------------------------------------------------------- data */
  const data = useMemo(() => {
    const active = listingsData ?? [];
    // In the demo the seed listings are the marketplace's own objects, so sold and
    // cancelled items keep their latest status there; active ones also cover new listings.
    const byId = new Map<string, ProfileListing>();
    if (MOCK_MODE) seedListings.forEach((l) => byId.set(l.listing_id, l));
    active.forEach((l) => byId.set(l.listing_id, l));
    const all = Array.from(byId.values());

    const mine = all.filter((l) => sameAddress(l.seller, address));
    const firstListedAt = mine.reduce<number | null>(
      (earliest, l) => (l.createdAt && (earliest === null || l.createdAt < earliest) ? l.createdAt : earliest),
      null
    );
    const listed = active.filter((l) => sameAddress(l.seller, address)).sort(newestFirst);
    const sold = mine.filter((l) => l.status === 'sold');
    const bids = active
      .filter((l) => l.isAuction && sameAddress(l.highestBidder, address) && !sameAddress(l.seller, address))
      .sort((a, b) => (a.auctionEndTime ?? 0) - (b.auctionEndTime ?? 0));
    const purchaseIds = new Set(knownUser?.purchases ?? []);
    const isWon = (l: ProfileListing) => !!l.isAuction && l.status === 'sold' && sameAddress(l.highestBidder, address);
    const purchases = all
      .filter((l) => !sameAddress(l.seller, address) && (purchaseIds.has(l.listing_id) || isWon(l)))
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

    const events: ActivityEvent[] = [];
    for (const l of mine) {
      events.push({ id: `${l.listing_id}:listed`, kind: l.isAuction ? 'auction' : 'listed', listing: l, amount: l.price, at: l.createdAt ?? 0 });
      if (l.status === 'sold') events.push({ id: `${l.listing_id}:sold`, kind: 'sold', listing: l, amount: settledPrice(l), at: l.updatedAt ?? 0 });
      if (l.status === 'cancelled') events.push({ id: `${l.listing_id}:cancelled`, kind: 'cancelled', listing: l, amount: l.price, at: l.updatedAt ?? 0 });
      if (l.status === 'ended') events.push({ id: `${l.listing_id}:ended`, kind: 'ended', listing: l, amount: l.price, at: l.updatedAt ?? 0 });
    }
    for (const l of bids) {
      events.push({ id: `${l.listing_id}:bid`, kind: 'bid', listing: l, amount: settledPrice(l), at: l.updatedAt ?? 0 });
    }
    for (const l of purchases) {
      events.push({ id: `${l.listing_id}:bought`, kind: isWon(l) ? 'won' : 'bought', listing: l, amount: settledPrice(l), at: l.updatedAt ?? 0 });
    }
    events.sort((a, b) => b.at - a.at);

    const soldValue = total(sold);
    const spent = total(purchases);
    return {
      listed,
      sold,
      bids,
      purchases,
      events,
      soldValue,
      spent,
      volume: soldValue + spent,
      liveAuctions: listed.filter((l) => l.isAuction).length,
      firstListedAt,
    };
  }, [listingsData, address, knownUser]);

  /* ------------------------------------------------------- not connected */
  if (!currentAccount || !address) {
    return (
      <div className="container-page pt-10 sm:pt-14">
        <SectionHeading
          as="h1"
          eyebrow="Profile"
          title="Your profile"
          description="Your listings, bids, purchases and activity, in one place."
        />
        <EmptyState
          className="mt-8 sm:mt-10"
          size="lg"
          icon={Wallet}
          title="Connect a wallet to continue"
          text={
            MOCK_MODE
              ? 'The demo wallet already holds a few listings and a leading bid. It is simulated, so nothing is sent to the network.'
              : 'Connect a Sui wallet to see the listings, bids and purchases tied to your address.'
          }
          action={
            <>
              {MOCK_MODE ? (
                <Button onClick={handleConnect} loading={connecting} className="w-full sm:w-auto">
                  {!connecting && <Wallet className="h-4 w-4" {...iconProps} />}
                  {connecting ? 'Connecting' : 'Connect demo wallet'}
                </Button>
              ) : (
                <ConnectButton connectText="Connect wallet" />
              )}
              <Link href="/" className={buttonVariants({ variant: 'secondary', className: 'w-full sm:w-auto' })}>
                Back to marketplace
              </Link>
            </>
          }
        />
      </div>
    );
  }

  /* ----------------------------------------------------------- connected */
  const profileReady = checkedFor === address && !loading;
  const displayName = profile?.username.trim() || 'Your wallet';
  const rating = knownUser?.reputation ?? (profile ? profile.reputationScore / 20 : 0);
  const count = (n: number) => (listingsLoading ? undefined : n);

  const tabs: TabItem[] = [
    {
      id: 'listings',
      label: 'Listings',
      count: count(data.listed.length),
      content: listingsLoading ? (
        <GridSkeleton />
      ) : data.listed.length > 0 ? (
        <div className={GRID}>
          {data.listed.map((listing) => (
            <ListingCard key={listing.listing_id} listing={listing} viewerAddress={address} compactOnMobile />
          ))}
          <NewListingTile />
        </div>
      ) : (
        <EmptyState
          icon={Tag}
          title="No active listings"
          text="List an item at a fixed price or as a timed auction. It shows up here and on the market."
          action={
            <>
              <Link href="/sell" className={buttonVariants({ variant: 'primary' })}>
                <Plus className="h-4 w-4" {...iconProps} />
                List an item
              </Link>
              <Link href="/sell?mode=auction" className={buttonVariants({ variant: 'secondary' })}>
                <Gavel className="h-4 w-4" {...iconProps} />
                Start an auction
              </Link>
            </>
          }
        />
      ),
    },
    {
      id: 'bids',
      label: 'Bids',
      count: count(data.bids.length),
      content: listingsLoading ? (
        <GridSkeleton />
      ) : data.bids.length > 0 ? (
        <>
          <PanelNote>
            <Badge variant="success" size="sm" dot>
              Leading
            </Badge>
            <span>
              You hold the highest bid on {plural(data.bids.length, 'live auction')}. Bids settle when the auction
              closes.
            </span>
          </PanelNote>
          <div className={GRID}>
            {data.bids.map((listing) => (
              <ListingCard key={listing.listing_id} listing={listing} viewerAddress={address} compactOnMobile />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={Gavel}
          title="No active bids"
          text="Auctions where you hold the highest bid show up here until they close."
          action={
            <Link href="/#market" className={buttonVariants({ variant: 'secondary' })}>
              Browse auctions
              <ArrowRight className="h-4 w-4 text-fg-subtle" {...iconProps} />
            </Link>
          }
        />
      ),
    },
    {
      id: 'purchases',
      label: 'Purchases',
      count: count(data.purchases.length),
      content: listingsLoading ? (
        <GridSkeleton />
      ) : data.purchases.length > 0 ? (
        <>
          <PanelNote>
            <span>
              {plural(data.purchases.length, 'item')} bought for{' '}
              <span className="font-medium tabular-nums text-fg">{formatSui(data.spent)} SUI</span> in total.
            </span>
          </PanelNote>
          <div className={GRID}>
            {data.purchases.map((listing) => (
              <ListingCard key={listing.listing_id} listing={listing} viewerAddress={address} compactOnMobile />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="No purchases yet"
          text={
            MOCK_MODE
              ? 'Items you buy show up here with the price you paid.'
              : 'Purchases made with this wallet will show up here.'
          }
          action={
            <Link href="/" className={buttonVariants({ variant: 'primary' })}>
              Explore listings
              <ArrowRight className="h-4 w-4" {...iconProps} />
            </Link>
          }
        />
      ),
    },
    {
      id: 'activity',
      label: 'Activity',
      count: count(data.events.length),
      content: listingsLoading ? (
        <ActivitySkeleton />
      ) : data.events.length > 0 ? (
        <ActivityList events={data.events} />
      ) : (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          text="Listings, bids and purchases from this wallet show up here as they happen."
        />
      ),
    },
    {
      id: 'about',
      label: 'About',
      content: (
        <AboutPanel
          address={address}
          walletLabel={currentAccount.label}
          profile={profile}
          ready={profileReady}
          rating={rating}
          firstListedAt={listingsLoading ? null : data.firstListedAt}
          onEdit={openEditor}
        />
      ),
    },
  ];

  return (
    <div className="container-page pt-10 sm:pt-14">
      {errorMessage && !isEditing && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage(null)} className="mb-6" />
      )}

      <ProfileHeader
        address={address}
        displayName={displayName}
        profile={profile}
        ready={profileReady}
        rating={rating}
        firstListedAt={listingsLoading ? null : data.firstListedAt}
        onEdit={openEditor}
      />

      <StatsBand
        loading={listingsLoading}
        stats={[
          {
            label: 'Listed',
            icon: Tag,
            value: formatNumber(data.listed.length),
            caption:
              data.liveAuctions > 0
                ? plural(data.liveAuctions, 'live auction')
                : data.listed.length > 0
                  ? 'All fixed price'
                  : 'Nothing listed yet',
          },
          {
            label: 'Sold',
            icon: CircleCheck,
            value: formatNumber(data.sold.length),
            caption: `${formatSui(data.soldValue)} SUI earned`,
          },
          {
            label: 'Purchased',
            icon: ShoppingBag,
            value: formatNumber(data.purchases.length),
            caption: `${formatSui(data.spent)} SUI spent`,
          },
          {
            label: 'Volume',
            icon: Coins,
            value: formatSui(data.volume, { compact: true }),
            unit: true,
            caption: 'Sales and purchases',
          },
        ]}
      />

      <section ref={tabsRef} aria-labelledby="profile-sections" className="mt-12 sm:mt-16">
        <h2 id="profile-sections" className="sr-only">
          Listings, bids, purchases and activity
        </h2>
        <Tabs label="Profile sections" tabs={tabs} activeTab={activeTab} onTabChange={selectTab} panelClassName="mt-8" />
      </section>

      <Modal
        isOpen={isEditing}
        onClose={closeEditor}
        size="lg"
        title={profile ? 'Edit profile' : 'Create profile'}
        description={
          MOCK_MODE
            ? 'Shown on your profile. In this demo it is kept for this visit only.'
            : 'Your name, bio and avatar, as shown on your profile.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeEditor}>
              Cancel
            </Button>
            <Button type="submit" form={PROFILE_FORM_ID} loading={saving}>
              {profile ? 'Save changes' : 'Create profile'}
            </Button>
          </>
        }
      >
        <form id={PROFILE_FORM_ID} onSubmit={onSubmitProfile} noValidate className="space-y-5">
          {errorMessage && <ErrorAlert message={errorMessage} />}

          <div className="hidden items-center gap-3.5 rounded-xl border border-line bg-surface-2/50 p-3.5 sm:flex">
            <ProfileAvatar address={address} avatarUrl={isHttpUrl(avatarUrl) ? avatarUrl : ''} size={44} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">{username.trim() || 'Your wallet'}</p>
              <Address address={address} size="xs" />
            </div>
            <span className="ml-auto text-xs text-fg-subtle">Preview</span>
          </div>

          <Input
            ref={nameInputRef}
            label="Display name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. aster.sui"
            maxLength={NAME_MAX}
            autoComplete="nickname"
            helperText="Leave it empty to show “Your wallet”."
          />
          <Textarea
            label="Bio"
            optional
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What you collect, make or trade."
            maxLength={BIO_MAX}
            showCount
            rows={3}
          />
          <Input
            ref={avatarInputRef}
            label="Avatar URL"
            optional
            type="url"
            inputMode="url"
            value={avatarUrl}
            onChange={(e) => {
              setAvatarUrl(e.target.value);
              if (avatarError) setAvatarError(undefined);
            }}
            placeholder="https://example.com/avatar.jpg"
            leading={<Link2 />}
            error={avatarError}
            helperText="Leave it empty to use your address gradient."
          />
        </form>
      </Modal>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Header
---------------------------------------------------------------------------- */

function ProfileAvatar({ address, avatarUrl, size }: { address: string; avatarUrl?: string; size: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [avatarUrl]);

  if (avatarUrl && isHttpUrl(avatarUrl) && !failed) {
    return (
      // A user-supplied link on any host: next/image only serves allow-listed hosts, so this stays a plain img.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="block shrink-0 rounded-full bg-surface-3 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return <Identicon address={address} size={size} />;
}

function ProfileHeader({
  address,
  displayName,
  profile,
  ready,
  rating,
  firstListedAt,
  onEdit,
}: {
  address: string;
  displayName: string;
  profile: UserProfile | null;
  ready: boolean;
  rating: number;
  /** When this wallet first listed an item, if it has. */
  firstListedAt: number | null;
  onEdit: () => void;
}) {
  // The banner washes the wallet's identicon colours into the panel, with a touch of Sui blue.
  const banner = useMemo(() => {
    const p = identiconPalette(address);
    return [
      `radial-gradient(55% 170% at 6% 0%, ${withAlpha(p.from, 0.36)}, transparent 72%)`,
      `radial-gradient(40% 120% at 46% 0%, ${withAlpha(p.spot, 0.1)}, transparent 70%)`,
      `radial-gradient(50% 160% at 96% 0%, rgb(var(--accent) / 0.22), transparent 72%)`,
      `linear-gradient(180deg, ${withAlpha(p.to, 0.2)}, transparent 90%)`,
    ].join(', ');
  }, [address]);

  return (
    <section
      aria-labelledby="profile-name"
      aria-busy={!ready || undefined}
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]"
    >
      <div aria-hidden="true" className="relative h-28 sm:h-36 lg:h-40" style={{ backgroundImage: banner }}>
        {/* A fine dot texture that fades out towards the content. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.09) 1px, transparent 1.2px)',
            backgroundSize: '14px 14px',
            WebkitMaskImage: 'linear-gradient(180deg, #000 10%, transparent 85%)',
            maskImage: 'linear-gradient(180deg, #000 10%, transparent 85%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-surface" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fg/20 to-transparent" />
      </div>

      <div className="grid px-5 pb-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-6 sm:px-8 sm:pb-8">
        <div className="relative -mt-12 sm:-mt-14">
          <span className="inline-flex rounded-full bg-surface p-1.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.7)]">
            <ProfileAvatar address={address} avatarUrl={profile?.avatarUrl} size={88} />
          </span>
        </div>

        <div className="order-last mt-6 grid grid-cols-2 gap-2.5 sm:order-none sm:col-start-2 sm:row-start-1 sm:mt-0 sm:flex sm:self-end">
          <Button variant="secondary" onClick={onEdit} disabled={!ready}>
            {profile || !ready ? (
              <Pencil className="h-4 w-4" {...iconProps} />
            ) : (
              <UserRound className="h-4 w-4" {...iconProps} />
            )}
            {profile || !ready ? 'Edit profile' : 'Create profile'}
          </Button>
          <Link href="/sell" className={buttonVariants({ variant: 'primary' })}>
            <Plus className="h-4 w-4" {...iconProps} />
            List an item
          </Link>
        </div>

        <div className="mt-4 min-w-0 sm:col-span-2 sm:mt-5">
          {ready ? (
            <>
              <h1
                id="profile-name"
                className="flex min-w-0 items-center gap-2 font-display text-[30px] font-semibold leading-9 tracking-[-0.025em] text-fg sm:text-h1"
              >
                <span className="truncate">{displayName}</span>
                {profile?.verified && (
                  <BadgeCheck className="h-6 w-6 shrink-0 text-accent" aria-label="Verified" strokeWidth={1.75} />
                )}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-small text-fg-muted">
                <Address address={address} copy size="sm" />
                {rating > 0 ? (
                  <span className="inline-flex items-center gap-2">
                    <Rating value={rating} size="sm" showValue />
                    <span className="text-fg-subtle">Reputation</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-fg-subtle">
                    <Star className="h-4 w-4" {...iconProps} />
                    No ratings yet
                  </span>
                )}
                {firstListedAt ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-fg-subtle" {...iconProps} />
                    First listing
                    <time dateTime={new Date(firstListedAt).toISOString()}>{formatDate(firstListedAt)}</time>
                  </span>
                ) : null}
              </div>

              {profile?.bio ? (
                <p className="mt-4 max-w-2xl whitespace-pre-line text-body text-fg-muted">{profile.bio}</p>
              ) : profile ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="focus-ring -mx-1 mt-3 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-small font-medium text-accent transition-colors hover:text-accent-hover"
                >
                  <Plus className="h-4 w-4" {...iconProps} />
                  Add a bio
                </button>
              ) : (
                <p className="mt-4 max-w-2xl text-small text-fg-subtle">
                  No profile yet. Create one to show a name and a short bio next to your listings.
                </p>
              )}
            </>
          ) : (
            <>
              <h1 id="profile-name">
                <span className="sr-only">Loading profile</span>
                <span aria-hidden="true" className="skeleton block h-9 w-56 max-w-full" />
              </h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="mt-5 h-4 w-72 max-w-full" />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   Stats
---------------------------------------------------------------------------- */

interface Stat {
  label: string;
  icon: LucideIcon;
  value: string;
  caption: string;
  /** Show the SUI unit after the value. */
  unit?: boolean;
}

function StatsBand({ stats, loading }: { stats: Stat[]; loading: boolean }) {
  return (
    <section aria-label="Overview" className="mt-5 sm:mt-6">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
        {stats.map(({ label, icon: Icon, value, caption, unit }) => (
          <div key={label} className="flex min-w-0 flex-col bg-surface px-5 py-5 sm:px-6 sm:py-6">
            <dt className="flex items-center gap-2 text-small font-medium text-fg-muted">
              <Icon className="h-4 w-4 text-fg-subtle" {...iconProps} />
              {label}
            </dt>
            <dd className="mt-3 flex min-h-[32px] items-baseline gap-1.5">
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <>
                  <span className="font-display text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-fg sm:text-[30px]">
                    {value}
                  </span>
                  {unit && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-fg-subtle sm:text-[13px]">
                      <SuiDrop size={10} />
                      SUI
                    </span>
                  )}
                </>
              )}
            </dd>
            <dd className="mt-2 truncate text-xs text-fg-subtle">{loading ? <Skeleton className="h-3 w-24" /> : caption}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   Tab panels
---------------------------------------------------------------------------- */

function PanelNote({ children }: { children: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-small text-fg-muted">{children}</div>;
}

function GridSkeleton() {
  return (
    <div className={GRID} aria-busy="true">
      <span className="sr-only">Loading</span>
      {/* One row of placeholders at every breakpoint (2 / 3 / 4 columns). */}
      {['block', 'block', 'hidden lg:block', 'hidden xl:block'].map((visibility, i) => (
        <div key={i} className={visibility}>
          <ListingCardSkeleton className="h-full" compactOnMobile />
        </div>
      ))}
    </div>
  );
}

/** The last tile of the listings grid: a dashed card that starts a new listing. */
function NewListingTile() {
  return (
    <Link
      href="/sell"
      className="focus-ring group flex min-h-[12rem] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-line-strong bg-surface/30 p-4 text-center sm:p-6 transition-colors duration-200 hover:border-accent/40 hover:bg-accent/[0.04]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent ring-1 ring-inset ring-accent/20 transition-transform duration-300 ease-out-expo motion-safe:group-hover:scale-105">
        <Plus className="h-5 w-5" {...iconProps} />
      </span>
      <span>
        <span className="block font-display text-h3 font-semibold text-fg">List another item</span>
        <span className="mt-1 block text-small text-fg-muted">Fixed price or a timed auction.</span>
      </span>
    </Link>
  );
}

function ActivityList({ events }: { events: ActivityEvent[] }) {
  const now = useNow(60_000);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <ol className="divide-y divide-line">
        {events.map((event) => {
          const meta = ACTIVITY_META[event.kind];
          const Icon = meta.icon;
          const l = event.listing;
          const title = l.title?.trim() || 'Untitled item';
          const category = categoryName(l.category);
          return (
            <li key={event.id} className="group relative flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-2/60 sm:gap-4 sm:px-5">
              <div className="relative shrink-0">
                <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-inset ring-line">
                  <Image src={listingImage(l)} alt="" fill sizes="44px" className="object-cover" />
                </div>
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface-3 ring-2 ring-surface transition-colors group-hover:ring-surface-2',
                    meta.tone
                  )}
                >
                  <Icon className="h-3 w-3" strokeWidth={2} />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/listing?id=${encodeURIComponent(l.listing_id)}`}
                  className="block truncate text-sm font-medium text-fg after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-accent"
                >
                  {title}
                </Link>
                <p className="mt-0.5 truncate text-small">
                  <span className={meta.tone}>{meta.label}</span>
                  {category && <span className="text-fg-subtle"> · {category}</span>}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <Price value={event.amount} size="sm" />
                {event.at > 0 && (
                  <time dateTime={new Date(event.at).toISOString()} title={formatDate(event.at)} className="text-xs text-fg-subtle">
                    {timeAgo(event.at, { now })}
                  </time>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface" aria-busy="true">
      <span className="sr-only">Loading</span>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-line px-4 py-3.5 first:border-t-0 sm:px-5">
          <Skeleton className="h-11 w-11 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-small text-fg-subtle">{label}</dt>
      <dd className="min-w-0 text-sm text-fg">{children}</dd>
    </div>
  );
}

function PanelCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        {action}
      </div>
      <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6">{children}</div>
    </Card>
  );
}

function AboutPanel({
  address,
  walletLabel,
  profile,
  ready,
  rating,
  firstListedAt,
  onEdit,
}: {
  address: string;
  walletLabel?: string;
  profile: UserProfile | null;
  ready: boolean;
  rating: number;
  firstListedAt: number | null;
  onEdit: () => void;
}) {
  const notSet = <span className="text-fg-subtle">Not set</span>;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      {!ready ? (
        <Card className="p-6" aria-busy="true">
          <span className="sr-only">Loading profile</span>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-2 h-4 w-48" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      ) : profile ? (
        <PanelCard
          title="Profile"
          description="Name, bio and avatar shown on this page."
          action={
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" {...iconProps} />
              Edit
            </Button>
          }
        >
          <dl className="divide-y divide-line">
            <DetailRow label="Display name">{profile.username || notSet}</DetailRow>
            <DetailRow label="Bio">
              {profile.bio ? <span className="whitespace-pre-line text-fg-muted">{profile.bio}</span> : notSet}
            </DetailRow>
            <DetailRow label="Reputation">
              {rating > 0 ? (
                <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Rating value={rating} size="sm" showValue />
                  <span className="text-small text-fg-subtle">
                    Score {profile.reputationScore} / 100
                  </span>
                </span>
              ) : (
                <span className="text-fg-muted">No ratings yet</span>
              )}
            </DetailRow>
            <DetailRow label="First listing">
              {firstListedAt ? formatDate(firstListedAt) : <span className="text-fg-muted">Nothing listed yet</span>}
            </DetailRow>
            <DetailRow label="Avatar">
              {profile.avatarUrl ? (
                <span className="block truncate font-mono text-xs text-fg-muted" title={profile.avatarUrl}>
                  {profile.avatarUrl}
                </span>
              ) : (
                <span className="text-fg-muted">Generated from your address</span>
              )}
            </DetailRow>
          </dl>
        </PanelCard>
      ) : (
        <EmptyState
          icon={UserRound}
          title="Set up your profile"
          text="Add a display name, a short bio and an avatar. Buyers see them next to your listings."
          action={
            <Button onClick={onEdit}>
              <Plus className="h-4 w-4" {...iconProps} />
              Create profile
            </Button>
          }
        />
      )}

      <PanelCard title="Wallet" description="The account this profile belongs to.">
        <dl className="divide-y divide-line">
          <DetailRow label="Address">
            <Address address={address} copy full size="sm" />
          </DetailRow>
          <DetailRow label="Wallet">{walletLabel || (MOCK_MODE ? 'Demo wallet' : 'Connected wallet')}</DetailRow>
          <DetailRow label="Network">
            <span className="inline-flex items-center gap-2">
              <span className="capitalize">{SUI_NETWORK}</span>
              {MOCK_MODE ? (
                <Badge variant="warning" size="sm" dot>
                  Simulated
                </Badge>
              ) : (
                <Badge variant="success" size="sm" dot>
                  Live
                </Badge>
              )}
            </span>
          </DetailRow>
          {!MOCK_MODE && (
            <DetailRow label="Marketplace">
              <Address address={PACKAGE_ID} copy kind="Package ID" size="sm" />
            </DetailRow>
          )}
        </dl>
      </PanelCard>
    </div>
  );
}

function ErrorAlert({ message, onDismiss, className }: { message: string; onDismiss?: () => void; className?: string }) {
  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger', className)}
    >
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" {...iconProps} />
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mr-1.5 -mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-danger/80 transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X className="h-4 w-4" {...iconProps} />
        </button>
      )}
    </div>
  );
}

'use client';

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConnectButton } from '@mysten/dapp-kit';
import {
  Check,
  CircleAlert,
  CircleCheck,
  Eye,
  FlaskConical,
  Gavel,
  ShieldCheck,
  Tag,
  Undo2,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useWallet } from '../lib/useWallet';
import { mockMarketplace } from '../lib/mockData';
import { MOCK_MODE } from '../lib/config';
import { useSuiClient } from '../lib/suiClient';
import { LISTING_CATEGORIES, listingImage } from '../lib/categories';
import { useToast } from './ToastProvider';
import SectionHeading from './SectionHeading';
import ListingCard from './ListingCard';
import Price, { SuiDrop } from './Price';
import Address from './Address';
import { CATEGORY_ICONS } from './categoryIcons';
import Button, { buttonVariants } from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Select from './ui/Select';
import { SegmentedControl } from './ui/Tabs';
import { Identicon } from './ui/Avatar';
import Badge from './ui/Badge';
import { cn } from './ui/cn';

// types/next-navigation.d.ts stubs next/navigation with useRouter only; declare
// useSearchParams here (a harmless overload once that stub is removed).
declare module 'next/navigation' {
  export function useSearchParams(): URLSearchParams | null;
}

type ListingMode = 'fixed' | 'auction';

interface ValidationErrors {
  title?: string;
  description?: string;
  price?: string;
  category?: string;
  duration?: string;
  itemObjectId?: string;
  itemType?: string;
}

// The Move contract accepts auctions from 1 hour to 7 days.
const DURATION_OPTIONS = [
  { value: '1', label: '1 hour' },
  { value: '6', label: '6 hours' },
  { value: '12', label: '12 hours' },
  { value: '24', label: '1 day' },
  { value: '72', label: '3 days' },
  { value: '120', label: '5 days' },
  { value: '168', label: '7 days' },
];
const DEFAULT_DURATION = '24';
const HOUR_MS = 60 * 60 * 1000;

// Contract limits (MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH in Suimart.move).
const TITLE_MAX = 100;
const DESCRIPTION_MAX = 500;

// Seller shown on the preview card before a wallet is connected. The card shows "You".
const PREVIEW_SELLER = '0x0000000000000000000000000000000000000000';

function modeFromParam(param: string | null | undefined): ListingMode | null {
  if (param === 'auction') return 'auction';
  if (param === 'fixed') return 'fixed';
  return null;
}

function parsePrice(value: string): number | null {
  const n = parseFloat(value);
  return isNaN(n) || n <= 0 ? null : n;
}

export default function SellClient() {
  const sui = useSuiClient();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams?.get('mode');

  const [mode, setMode] = useState<ListingMode>(() => modeFromParam(modeParam) ?? 'fixed');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [itemObjectId, setItemObjectId] = useState('');
  const [itemType, setItemType] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const wallet = useWallet();
  const { currentAccount, connect } = wallet;
  const connecting: boolean = !!wallet.isLoading;
  const needsDemoWallet = MOCK_MODE && !currentAccount;

  const isAuction = mode === 'auction';
  const durationHours = parseInt(duration, 10);
  const durationMs = (isNaN(durationHours) ? 0 : durationHours) * HOUR_MS;
  const durationLabel = DURATION_OPTIONS.find((o) => o.value === duration)?.label ?? `${duration} hours`;

  /* ------------------------------------------------------------ ?mode= */
  // /auction redirects to /sell?mode=auction; follow the query when it changes.
  useEffect(() => {
    const fromQuery = modeFromParam(modeParam);
    if (fromQuery) setMode(fromQuery);
  }, [modeParam]);

  const changeMode = (next: ListingMode) => {
    setMode(next);
    if (validationErrors.price || validationErrors.duration) {
      setValidationErrors({ ...validationErrors, price: undefined, duration: undefined });
    }
  };

  /* ------------------------------------------------------- focus + redirect */
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLSelectElement>(null);
  const objectIdRef = useRef<HTMLInputElement>(null);
  const itemTypeRef = useRef<HTMLInputElement>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  /* --------------------------------------------------------------- validate */
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!title.trim()) {
      errors.title = 'Title is required.';
    } else if (title.length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    }

    if (!description.trim()) {
      errors.description = 'Description is required.';
    } else if (description.length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    }

    if (!price.trim()) {
      errors.price = isAuction ? 'Starting price is required.' : 'Price is required.';
    } else {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        errors.price = isAuction ? 'Starting price must be a positive number.' : 'Price must be a positive number.';
      }
    }

    if (!category) {
      errors.category = 'Category is required.';
    }

    if (isAuction && (isNaN(durationHours) || durationHours < 1 || durationHours > 168)) {
      errors.duration = 'Duration must be between 1 hour and 7 days.';
    }

    if (!MOCK_MODE) {
      if (!itemObjectId.trim()) {
        errors.itemObjectId = 'Object ID is required in real mode.';
      }
      if (!itemType.trim()) {
        errors.itemType = 'Item type is required in real mode.';
      }
    }

    setValidationErrors(errors);

    // Take keyboard and screen-reader users to the first field that needs fixing.
    const order: [keyof ValidationErrors, { current: HTMLElement | null }][] = [
      ['title', titleRef],
      ['description', descriptionRef],
      ['category', categoryRef],
      ['price', priceRef],
      ['duration', durationRef],
      ['itemObjectId', objectIdRef],
      ['itemType', itemTypeRef],
    ];
    const first = order.find(([key]) => errors[key]);
    first?.[1].current?.focus();

    return Object.keys(errors).length === 0;
  };

  const clearError = (key: keyof ValidationErrors) => {
    if (validationErrors[key]) {
      setValidationErrors({ ...validationErrors, [key]: undefined });
    }
  };

  /* ----------------------------------------------------------------- submit */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!currentAccount) {
      setErrorMessage('Please connect your wallet first.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const priceNum = parseFloat(price);
      if (MOCK_MODE) {
        await mockMarketplace.createListing({
          title: title.trim(),
          description: description.trim(),
          price: priceNum,
          category,
          seller: currentAccount.address,
          itemType: '0x2::devnet_nft::DevNFT',
          isAuction,
          ...(isAuction ? { auctionEndTime: Date.now() + durationMs } : {}),
        });
      } else if (isAuction) {
        await sui.createAuction({
          itemType: itemType.trim(),
          itemObjectId: itemObjectId.trim(),
          price: priceNum,
          // Bids must reach the starting price.
          minBid: priceNum,
          durationMs,
          title: title.trim(),
          description: description.trim(),
          category,
        });
      } else {
        await sui.createListing({
          itemType: itemType.trim(),
          itemObjectId: itemObjectId.trim(),
          price: priceNum,
          title: title.trim(),
          description: description.trim(),
          category,
        });
      }

      setSuccessMessage(
        isAuction ? 'Auction created. Taking you to the marketplace…' : 'Listing created. Taking you to the marketplace…'
      );
      showToast('success', isAuction ? 'Your auction is live.' : 'Your listing is live.');

      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('');
      setDuration(DEFAULT_DURATION);
      setItemObjectId('');
      setItemType('');
      setValidationErrors({});

      // Redirect after a short delay
      clearTimeout(redirectTimer.current);
      redirectTimer.current = setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Failed to create listing:', error);
      setErrorMessage(
        isAuction ? 'Failed to create the auction. Please try again.' : 'Failed to create listing. Please try again.'
      );
      showToast('error', isAuction ? 'Failed to create the auction.' : 'Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------- preview */
  const priceValue = parsePrice(price) ?? 0;
  const previewSeller = currentAccount?.address ?? PREVIEW_SELLER;
  // Set when the auction toggle or duration changes, so the preview countdown ticks down naturally.
  const previewEndTime = useMemo(() => (isAuction ? Date.now() + durationMs : undefined), [isAuction, durationMs]);
  const endsAtLabel = new Date(Date.now() + durationMs).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const previewListing = {
    listing_id: 'preview',
    title: title.trim(),
    price: priceValue,
    seller: previewSeller,
    category: category || undefined,
    imageUrl: listingImage({ category }),
    isAuction,
    auctionEndTime: previewEndTime,
    status: 'active',
  };

  /* ------------------------------------------------------- section progress */
  const detailsComplete = !!title.trim() && title.length >= 3 && !!description.trim() && description.length >= 10;
  const categoryComplete = !!category;
  const pricingComplete = parsePrice(price) !== null;
  const onChainComplete = !!itemObjectId.trim() && !!itemType.trim();

  /* ----------------------------------------------------------------- submit button */
  const submitLabel = loading
    ? isAuction
      ? 'Creating auction…'
      : 'Creating listing…'
    : !currentAccount
      ? MOCK_MODE
        ? 'Connect demo wallet'
        : 'Connect wallet to list'
      : isAuction
        ? 'Create auction'
        : 'Create listing';
  const SubmitIcon = !currentAccount ? Wallet : isAuction ? Gavel : Tag;

  return (
    <div className="container-page pt-10 sm:pt-14">
      <SectionHeading
        as="h1"
        eyebrow="Create listing"
        title="List an item"
        description="Sell at a fixed price or run a timed auction. Buyers see your listing the moment it is created."
      />

      <form
        noValidate
        onSubmit={handleSubmit}
        aria-busy={loading || undefined}
        className="mt-10 grid grid-cols-1 gap-y-10 sm:mt-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-x-10 lg:gap-y-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-x-16"
      >
        {/* ------------------------------------------------------------ fields */}
        <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-1">
          {!currentAccount && (
            <div className="flex flex-col gap-4 rounded-2xl border border-accent/20 bg-accent/[0.06] p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="flex min-w-0 flex-1 items-start gap-3.5 sm:items-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent ring-1 ring-inset ring-accent/20">
                  <Wallet aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">Connect a wallet to list</p>
                  <p className="mt-0.5 text-small text-fg-muted">
                    {MOCK_MODE
                      ? 'The demo wallet is simulated: no extension, keys or real SUI needed. You can fill in the form first.'
                      : 'Listing signs one transaction from your wallet. You can fill in the form first.'}
                  </p>
                </div>
              </div>
              {MOCK_MODE ? (
                <Button variant="secondary" loading={connecting} onClick={() => connect()} className="w-full sm:w-auto">
                  {!connecting && <Wallet aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
                  {connecting ? 'Connecting' : 'Connect demo wallet'}
                </Button>
              ) : (
                <div className="shrink-0">
                  <ConnectButton connectText="Connect wallet" />
                </div>
              )}
            </div>
          )}

          {/* 1. Details */}
          <FormSection
            id="sell-details"
            step={1}
            title="Details"
            description="What buyers see on the card and the listing page."
            complete={detailsComplete}
          >
            <Input
              ref={titleRef}
              label="Title"
              placeholder="e.g. Meridian 014, edition 3 of 25"
              value={title}
              maxLength={TITLE_MAX}
              autoComplete="off"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setTitle(e.target.value);
                clearError('title');
              }}
              error={validationErrors.title}
              helperText="At least 3 characters. Name, edition and number help buyers find it."
              disabled={loading}
              required
            />
            <Textarea
              ref={descriptionRef}
              label="Description"
              placeholder="Provenance, edition, what the buyer receives…"
              rows={5}
              value={description}
              maxLength={DESCRIPTION_MAX}
              showCount
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                setDescription(e.target.value);
                clearError('description');
              }}
              error={validationErrors.description}
              helperText="At least 10 characters."
              disabled={loading}
              required
            />
          </FormSection>

          {/* 2. Category */}
          <FormSection
            id="sell-category"
            step={2}
            title="Category"
            description="Where the listing appears when buyers filter the market."
            complete={categoryComplete}
          >
            <div>
              <div
                role="radiogroup"
                aria-labelledby="sell-category-title"
                aria-required="true"
                aria-invalid={validationErrors.category ? true : undefined}
                aria-describedby={validationErrors.category ? 'sell-category-error' : undefined}
                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              >
                {LISTING_CATEGORIES.map((c, index) => {
                  const Icon = CATEGORY_ICONS[c.id];
                  const selected = category === c.id;
                  return (
                    <label key={c.id} className="relative block">
                      <input
                        ref={index === 0 ? categoryRef : undefined}
                        type="radio"
                        name="category"
                        value={c.id}
                        checked={selected}
                        disabled={loading}
                        onChange={() => {
                          setCategory(c.id);
                          clearError('category');
                        }}
                        className="peer sr-only"
                      />
                      <span
                        className={cn(
                          'relative flex h-full cursor-pointer flex-col gap-2.5 rounded-control border p-3 transition-[border-color,background-color,color] duration-150',
                          'peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface',
                          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                          selected
                            ? 'border-accent/50 bg-accent/[0.08] text-fg'
                            : validationErrors.category
                              ? 'border-danger/40 bg-surface-2/60 text-fg-muted hover:bg-surface-2 hover:text-fg'
                              : 'border-line-strong bg-surface-2/60 text-fg-muted hover:border-fg-subtle/30 hover:bg-surface-2 hover:text-fg'
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          className={cn('h-[18px] w-[18px] transition-colors', selected ? 'text-accent' : 'text-fg-subtle')}
                          strokeWidth={1.75}
                        />
                        <span className="text-[13px] font-medium leading-5">{c.name}</span>
                        {selected && (
                          <span
                            aria-hidden="true"
                            className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-fg"
                          >
                            <Check className="h-3 w-3" strokeWidth={2.5} />
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
              {validationErrors.category && <FieldError id="sell-category-error">{validationErrors.category}</FieldError>}
            </div>
          </FormSection>

          {/* 3. Pricing */}
          <FormSection
            id="sell-pricing"
            step={3}
            title="Pricing"
            description="Choose how the item sells."
            complete={pricingComplete}
          >
            <div>
              <SegmentedControl<ListingMode>
                aria-label="Listing type"
                value={mode}
                onChange={changeMode}
                fullWidth
                className="sm:max-w-sm"
                options={[
                  { value: 'fixed', label: 'Fixed price', icon: Tag, disabled: loading },
                  { value: 'auction', label: 'Auction', icon: Gavel, disabled: loading },
                ]}
              />
              <p className="mt-3 text-small text-fg-muted">
                {isAuction
                  ? 'Buyers bid until the timer runs out and the highest bid wins. Outbid buyers are refunded automatically.'
                  : 'The first buyer to pay your price gets the item, settled in one transaction.'}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                ref={priceRef}
                label={isAuction ? 'Starting price' : 'Price'}
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={price}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setPrice(e.target.value);
                  clearError('price');
                }}
                trailing={
                  <span className="inline-flex items-center gap-1.5">
                    <SuiDrop size={10} />
                    SUI
                  </span>
                }
                inputClassName="tabular-nums"
                error={validationErrors.price}
                helperText={isAuction ? 'Bidding opens at this price.' : 'Exactly what the buyer pays.'}
                disabled={loading}
                required
              />
              {isAuction && (
                <Select
                  ref={durationRef}
                  label="Duration"
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                    clearError('duration');
                  }}
                  options={DURATION_OPTIONS}
                  error={validationErrors.duration}
                  helperText={`Ends around ${endsAtLabel}`}
                  disabled={loading}
                  required
                />
              )}
            </div>
          </FormSection>

          {/* 4. On-chain item (real mode only) */}
          {!MOCK_MODE && (
            <FormSection
              id="sell-object"
              step={4}
              title="On-chain item"
              description="The object you are listing. The listing holds it until it sells or you cancel."
              complete={onChainComplete}
            >
              <Input
                ref={objectIdRef}
                label="Item object ID"
                placeholder="0x…"
                value={itemObjectId}
                autoComplete="off"
                spellCheck={false}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setItemObjectId(e.target.value);
                  clearError('itemObjectId');
                }}
                inputClassName="font-mono text-[13px]"
                error={validationErrors.itemObjectId}
                disabled={loading}
                required
              />
              <Input
                ref={itemTypeRef}
                label="Item type"
                placeholder="0x…::module::Type"
                value={itemType}
                autoComplete="off"
                spellCheck={false}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setItemType(e.target.value);
                  clearError('itemType');
                }}
                inputClassName="font-mono text-[13px]"
                error={validationErrors.itemType}
                helperText="The fully qualified Move type of the object."
                disabled={loading}
                required
              />
            </FormSection>
          )}
        </div>

        {/* ---------------------------------------------------- preview + summary */}
        <aside
          aria-label="Listing preview and summary"
          className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <div className="lg:top-20 lg:[@media(min-height:900px)]:sticky">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="eyebrow">Live preview</h2>
              <p className="text-xs text-fg-subtle">As buyers will see it</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:items-start lg:grid-cols-1">
              <ListingCard
                listing={previewListing}
                viewerAddress={previewSeller}
                preview
                sizes="(min-width: 1280px) 360px, (min-width: 1024px) 320px, (min-width: 640px) 45vw, 92vw"
              />

              <div className="space-y-4">
                <section aria-labelledby="sell-summary-title" className="rounded-2xl border border-line bg-surface p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 id="sell-summary-title" className="font-display text-[15px] font-semibold leading-6 text-fg">
                      Summary
                    </h2>
                    <Badge variant={isAuction ? 'warning' : 'neutral'} size="sm">
                      {isAuction ? (
                        <Gavel aria-hidden="true" strokeWidth={1.75} />
                      ) : (
                        <Tag aria-hidden="true" strokeWidth={1.75} />
                      )}
                      {isAuction ? `Auction · ${durationLabel}` : 'Fixed price'}
                    </Badge>
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-fg-muted">{isAuction ? 'Starting price' : 'Price'}</dt>
                      <dd>
                        <Price value={priceValue} size="sm" />
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="flex flex-wrap items-baseline gap-x-2 text-fg-muted">
                        Marketplace fee
                        {MOCK_MODE && <span className="text-xs text-fg-subtle">Free in this demo</span>}
                      </dt>
                      <dd className="font-medium tabular-nums text-fg">0%</dd>
                    </div>
                  </dl>
                  <div aria-hidden="true" className="my-4 h-px bg-line" />
                  <div className="flex items-end justify-between gap-4">
                    <span className="pb-0.5 text-sm text-fg-muted">
                      {isAuction ? 'You receive at least' : 'You receive'}
                    </span>
                    <Price value={priceValue} size="lg" />
                  </div>
                </section>

                {/* Left out of the desktop sidebar so the sticky column fits the screen. */}
                <section aria-labelledby="sell-notes-title" className="rounded-2xl border border-line p-5 lg:hidden">
                  <h2 id="sell-notes-title" className="eyebrow">
                    Good to know
                  </h2>
                  <ul className="mt-3 space-y-2.5 text-small text-fg-muted">
                    <NoteItem icon={Eye}>Shows up in Explore as soon as it is created.</NoteItem>
                    <NoteItem icon={Undo2}>
                      {isAuction ? 'You can cancel until the first bid arrives.' : 'You can cancel any time before it sells.'}
                    </NoteItem>
                    {MOCK_MODE ? (
                      <NoteItem icon={FlaskConical}>Demo build: nothing is signed and no SUI moves.</NoteItem>
                    ) : (
                      <NoteItem icon={ShieldCheck}>Settled on Sui by the SuiMart Move contract.</NoteItem>
                    )}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------------ actions */}
        <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-2">
          {errorMessage && (
            <Notice tone="danger" role="alert">
              {errorMessage}
            </Notice>
          )}
          {successMessage && (
            <Notice tone="success" role="status">
              {successMessage}{' '}
              <Link href="/" className="font-medium underline decoration-success/40 underline-offset-2 hover:decoration-success">
                Go now
              </Link>
            </Notice>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex min-w-0 items-center justify-center gap-2 text-small text-fg-muted sm:mr-auto sm:justify-start">
              {currentAccount ? (
                <>
                  <span className="text-fg-subtle">Listing as</span>
                  <Identicon address={currentAccount.address} size={18} />
                  <Address address={currentAccount.address} size="sm" />
                </>
              ) : (
                <>
                  <Wallet aria-hidden="true" className="h-4 w-4 text-fg-subtle" strokeWidth={1.75} />
                  No wallet connected
                </>
              )}
            </div>
            <Link href="/" className={buttonVariants({ variant: 'ghost', size: 'lg', className: 'w-full sm:w-auto' })}>
              Cancel
            </Link>
            <Button
              type={needsDemoWallet ? 'button' : 'submit'}
              onClick={needsDemoWallet ? () => connect() : undefined}
              disabled={!currentAccount && !MOCK_MODE}
              loading={loading || (needsDemoWallet && connecting)}
              size="lg"
              className="w-full sm:w-auto sm:min-w-[184px]"
            >
              {!loading && !(needsDemoWallet && connecting) && (
                <SubmitIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
              )}
              {needsDemoWallet && connecting ? 'Connecting' : submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Local building blocks
---------------------------------------------------------------------------- */

function FormSection({
  id,
  step,
  title,
  description,
  complete,
  children,
}: {
  id: string;
  step: number;
  title: string;
  description: string;
  complete: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="rounded-2xl border border-line bg-surface">
      <div className="flex items-start gap-3.5 border-b border-line px-5 py-4 sm:px-6">
        <span
          aria-hidden="true"
          className={cn(
            'mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors duration-200',
            complete ? 'border-accent/30 bg-accent/10 text-accent' : 'border-line-strong bg-surface-2 text-fg-muted'
          )}
        >
          {complete ? <Check className="h-3.5 w-3.5" strokeWidth={2.25} /> : step}
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="font-display text-h3 font-semibold text-fg">
            {title}
            {complete && <span className="sr-only"> (complete)</span>}
          </h2>
          <p className="mt-0.5 text-small text-fg-muted">{description}</p>
        </div>
      </div>
      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-[13px] leading-5 text-danger">
      <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
      <span>{children}</span>
    </p>
  );
}

function NoteItem({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />
      <span>{children}</span>
    </li>
  );
}

function Notice({ tone, role, children }: { tone: 'danger' | 'success'; role: 'alert' | 'status'; children: ReactNode }) {
  const Icon = tone === 'danger' ? CircleAlert : CircleCheck;
  return (
    <div
      role={role}
      className={cn(
        'flex items-start gap-3 rounded-control border px-4 py-3 text-sm leading-6 motion-safe:animate-fade-in',
        tone === 'danger' ? 'border-danger/25 bg-danger/10 text-danger' : 'border-success/25 bg-success/10 text-success'
      )}
    >
      <Icon aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" strokeWidth={1.75} />
      <p className="min-w-0">{children}</p>
    </div>
  );
}

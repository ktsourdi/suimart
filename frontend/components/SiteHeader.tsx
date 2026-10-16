'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton, useDisconnectWallet } from '@mysten/dapp-kit';
import {
  ChevronDown,
  CirclePlus,
  Compass,
  Copy,
  LogOut,
  Menu as MenuIcon,
  UserRound,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { MOCK_MODE, SUI_NETWORK } from '../lib/config';
import { useWallet } from '../lib/useWallet';
import { truncateAddress } from '../lib/format';
import { useOptionalToast } from './ToastProvider';
import { Identicon } from './ui/Avatar';
import Button from './ui/Button';
import { Menu, MenuItem, MenuSeparator } from './ui/Dropdown';
import Tooltip from './ui/Tooltip';
import { cn } from './ui/cn';

// types/next-navigation.d.ts stubs next/navigation with useRouter only; declare
// usePathname here (a harmless overload once that stub is removed).
declare module 'next/navigation' {
  export function usePathname(): string | null;
}

/* ----------------------------------------------------------------------------
   Brand
---------------------------------------------------------------------------- */

/** The SuiMart mark: a droplet in an accent-gradient tile. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={cn('shrink-0', className)}>
      <defs>
        <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8CC4FF" />
          <stop offset="0.45" stopColor="#4DA2FF" />
          <stop offset="1" stopColor="#1F62D6" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id}-tile)`} />
      <rect width="32" height="32" rx="9" fill={`url(#${id}-shine)`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.22" />
      <path
        fill="#06080F"
        fillOpacity="0.92"
        d="M16 6.4c-.32 0-.62.14-.83.4-2.35 2.86-6.37 8.2-6.37 12.08a7.2 7.2 0 0 0 14.4 0c0-3.88-4.02-9.22-6.37-12.08a1.07 1.07 0 0 0-.83-.4Z"
      />
      <path
        fill="none"
        stroke="#74B7FF"
        strokeWidth="1.6"
        strokeLinecap="round"
        d="M12.4 19.3a3.7 3.7 0 0 0 3.6 3.3"
      />
    </svg>
  );
}

/** Mark + "SuiMart" wordmark, linking home. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="SuiMart home"
      className={cn('focus-ring group/logo inline-flex shrink-0 items-center gap-2.5 rounded-lg', className)}
    >
      <LogoMark className="transition-transform duration-300 ease-out-expo motion-safe:group-hover/logo:-rotate-6" />
      <span className="font-display text-[17px] font-semibold tracking-[-0.02em] text-fg">SuiMart</span>
    </Link>
  );
}

/* ----------------------------------------------------------------------------
   Navigation
---------------------------------------------------------------------------- */

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  { href: '/', label: 'Explore', icon: Compass, match: (p) => p === '/' || p.startsWith('/listing') },
  { href: '/sell', label: 'Sell', icon: CirclePlus, match: (p) => p.startsWith('/sell') || p.startsWith('/auction') },
  { href: '/profile', label: 'Profile', icon: UserRound, match: (p) => p.startsWith('/profile') },
];

const DEMO_EXPLAINER = `Demo build: listings and the wallet are simulated. Nothing is sent to ${SUI_NETWORK}.`;

function DemoPill() {
  return (
    <Tooltip content={DEMO_EXPLAINER} side="bottom" align="end" className="hidden sm:inline-flex">
      <span
        tabIndex={0}
        className="focus-ring inline-flex h-8 cursor-default items-center gap-2 rounded-full border border-line-strong bg-surface-2/60 px-3 text-xs font-medium text-fg-muted"
      >
        <span aria-hidden="true" className="relative flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-warning/50 motion-safe:animate-ping" />
          <span className="relative h-2 w-2 rounded-full bg-warning" />
        </span>
        <span className="text-fg">Demo</span>
        <span aria-hidden="true" className="hidden text-fg-subtle lg:inline">
          ·
        </span>
        <span className="hidden capitalize lg:inline">{SUI_NETWORK}</span>
      </span>
    </Tooltip>
  );
}

/* ----------------------------------------------------------------------------
   Wallet
---------------------------------------------------------------------------- */

function useWalletControls() {
  const wallet = useWallet();
  const { mutateAsync: disconnectReal } = useDisconnectWallet();
  const toast = useOptionalToast();
  const address: string | undefined = wallet.currentAccount?.address;

  const connect = useCallback(async () => {
    try {
      await wallet.connect();
    } catch (e) {
      console.error(e);
      toast?.showToast('error', 'Could not connect the wallet.');
    }
  }, [wallet, toast]);

  const disconnect = useCallback(async () => {
    try {
      if (MOCK_MODE) await wallet.disconnect();
      else await disconnectReal();
      toast?.showToast('info', 'Wallet disconnected.');
    } catch (e) {
      console.error(e);
      toast?.showToast('error', 'Could not disconnect the wallet.');
    }
  }, [wallet, disconnectReal, toast]);

  const copyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast?.showToast('success', 'Address copied to clipboard.');
    } catch {
      toast?.showToast('error', 'Could not copy the address.');
    }
  }, [address, toast]);

  return { address, connecting: !!wallet.isLoading, connect, disconnect, copyAddress };
}

type WalletControls = ReturnType<typeof useWalletControls>;

function AccountSummary({ address }: { address: string }) {
  return (
    <div className="flex items-center gap-3">
      <Identicon address={address} size={36} />
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-fg">{MOCK_MODE ? 'Demo wallet' : 'Connected wallet'}</p>
        <p className="truncate font-mono text-xs text-fg-subtle" title={address}>
          {truncateAddress(address, 8, 6)}
        </p>
      </div>
    </div>
  );
}

function WalletControl({ controls }: { controls: WalletControls }) {
  const { address, connecting, connect, disconnect, copyAddress } = controls;

  if (!address) {
    if (!MOCK_MODE) return <ConnectButton connectText="Connect wallet" />;
    return (
      <Button onClick={connect} loading={connecting} className="px-3.5 sm:px-4">
        {!connecting && <Wallet aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
        {connecting ? (
          'Connecting'
        ) : (
          <>
            <span className="sm:hidden">Connect</span>
            <span className="hidden sm:inline">Connect wallet</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <Menu
      align="end"
      label="Wallet"
      header={<AccountSummary address={address} />}
      trigger={(props) => (
        <button
          {...props}
          aria-label={`Wallet ${truncateAddress(address)}`}
          className="focus-ring group inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface-2/70 pl-1.5 pr-2.5 text-sm font-medium text-fg transition-colors hover:border-fg-subtle/30 hover:bg-surface-3 aria-expanded:bg-surface-3"
        >
          <Identicon address={address} size={28} />
          <span className="hidden font-mono text-[13px] tracking-tight sm:inline">{truncateAddress(address)}</span>
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 text-fg-subtle transition-transform duration-200 group-aria-expanded:rotate-180"
            strokeWidth={1.75}
          />
        </button>
      )}
    >
      <MenuItem icon={UserRound} href="/profile">
        View profile
      </MenuItem>
      <MenuItem icon={CirclePlus} href="/sell">
        List an item
      </MenuItem>
      <MenuItem icon={Copy} onSelect={copyAddress}>
        Copy address
      </MenuItem>
      <MenuSeparator />
      <MenuItem icon={LogOut} tone="danger" onSelect={disconnect}>
        Disconnect
      </MenuItem>
    </Menu>
  );
}

/* ----------------------------------------------------------------------------
   Mobile sheet
---------------------------------------------------------------------------- */

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function MobileSheet({
  open,
  onClose,
  pathname,
  controls,
  id,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  controls: WalletControls;
  id: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const { address, connecting, connect, disconnect } = controls;

  return createPortal(
    <div className="fixed inset-0 z-[60] md:hidden">
      <div aria-hidden="true" className="absolute inset-0 bg-bg/70 backdrop-blur-sm motion-safe:animate-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col border-l border-line-strong bg-surface shadow-popover motion-safe:animate-sheet-in"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <Logo />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="focus-ring -mr-2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <nav aria-label="Main" className="flex flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'focus-ring flex h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors',
                  active ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg'
                )}
              >
                <Icon aria-hidden="true" className={cn('h-5 w-5', active ? 'text-accent' : 'text-fg-subtle')} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mx-5 h-px bg-line" />

        <div className="flex flex-col gap-3 p-5">
          <p className="eyebrow">Wallet</p>
          {address ? (
            <>
              <div className="rounded-xl border border-line bg-surface-2/60 p-3">
                <AccountSummary address={address} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-control border border-line-strong bg-surface-2 text-sm font-medium text-fg transition-colors hover:bg-surface-3"
                >
                  <UserRound aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                  Profile
                </Link>
                <Button
                  variant="danger"
                  onClick={async () => {
                    await disconnect();
                    onClose();
                  }}
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                  Disconnect
                </Button>
              </div>
            </>
          ) : MOCK_MODE ? (
            <Button onClick={connect} loading={connecting} className="w-full">
              {!connecting && <Wallet aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />}
              {connecting ? 'Connecting' : 'Connect demo wallet'}
            </Button>
          ) : (
            <ConnectButton connectText="Connect wallet" />
          )}
        </div>

        {MOCK_MODE && (
          <div className="mt-auto p-5">
            <div className="flex gap-3 rounded-xl border border-warning/20 bg-warning/[0.06] p-3.5">
              <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warning" />
              <p className="text-[13px] leading-5 text-fg-muted">
                <span className="font-medium text-fg">Demo on {SUI_NETWORK}.</span> Listings and the wallet are simulated;
                nothing is sent to the network.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ----------------------------------------------------------------------------
   Header
---------------------------------------------------------------------------- */

export default function SiteHeader() {
  const pathname = usePathname() || '/';
  const controls = useWalletControls();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sheetId = useId();

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  // Close the sheet after navigating.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close the sheet if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!menuOpen) return;
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => mq.matches && setMenuOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/60">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />

        <span aria-hidden="true" className="hidden h-5 w-px bg-line-strong md:block" />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'focus-ring inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors',
                  active ? 'bg-surface-2 text-fg shadow-inset-line' : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {MOCK_MODE && <DemoPill />}
          <WalletControl controls={controls} />
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? sheetId : undefined}
            className="focus-ring -mr-1.5 inline-flex h-10 w-10 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg md:hidden"
          >
            <MenuIcon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <MobileSheet open={menuOpen} onClose={closeMenu} pathname={pathname} controls={controls} id={sheetId} />
    </header>
  );
}

export { SiteHeader };

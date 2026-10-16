import { useEffect, useState } from 'react';

// Formatting helpers shared by every page. Pure functions, except useNow().

const suiFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** 15.5 -> "15.50", 1234.5 -> "1,234.50". `compact` gives "12.4K" for big values. */
export function formatSui(value: number | undefined | null, options: { compact?: boolean } = {}): string {
  const n = typeof value === 'number' && isFinite(value) ? value : 0;
  if (options.compact && Math.abs(n) >= 10_000) return compactFormatter.format(n);
  return suiFormatter.format(n);
}

/** 1234 -> "1,234"; with compact, 12400 -> "12.4K". */
export function formatNumber(value: number | undefined | null, options: { compact?: boolean } = {}): string {
  const n = typeof value === 'number' && isFinite(value) ? value : 0;
  if (options.compact && Math.abs(n) >= 10_000) return compactFormatter.format(n);
  return n.toLocaleString('en-US');
}

/** "0x1234567890abcdef…" -> "0x1234…5678". `lead` counts the 0x prefix. */
export function truncateAddress(address: string | undefined | null, lead = 6, tail = 4): string {
  if (!address) return '';
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Oct 14, 2026" */
export function formatDate(ts: number | undefined | null): string {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Relative time. short (default): "just now", "5m ago", "3h ago", "2d ago", then a date.
 * long: "5 minutes ago", "3 hours ago", "2 days ago".
 */
export function timeAgo(
  ts: number | undefined | null,
  options: { now?: number; style?: 'short' | 'long' } = {}
): string {
  if (!ts) return '';
  const now = options.now ?? Date.now();
  const diff = Math.max(0, now - ts);
  const long = options.style === 'long';
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return long ? `${m} minute${m === 1 ? '' : 's'} ago` : `${m}m ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return long ? `${h} hour${h === 1 ? '' : 's'} ago` : `${h}h ago`;
  }
  const d = Math.floor(diff / DAY);
  if (d <= 30) return long ? `${d} day${d === 1 ? '' : 's'} ago` : `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Milliseconds left, never negative. */
  totalMs: number;
  ended: boolean;
}

/** Splits the time left until endTs. An undefined end counts as ended. */
export function countdownParts(endTs: number | undefined | null, now: number = Date.now()): CountdownParts {
  const totalMs = endTs ? Math.max(0, endTs - now) : 0;
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor(totalSeconds / 3_600) % 24,
    minutes: Math.floor(totalSeconds / 60) % 60,
    seconds: totalSeconds % 60,
    totalMs,
    ended: totalMs <= 0,
  };
}

/** Short countdown: "2d 4h", "3h 12m", "8m 05s", "42s" or "Ended". */
export function formatCountdown(endTs: number | undefined | null, now: number = Date.now()): string {
  const p = countdownParts(endTs, now);
  if (p.ended) return 'Ended';
  if (p.days > 0) return `${p.days}d ${p.hours}h`;
  if (p.hours > 0) return `${p.hours}h ${p.minutes}m`;
  if (p.minutes > 0) return `${p.minutes}m ${pad2(p.seconds)}s`;
  return `${p.seconds}s`;
}

/** 5 -> "05" */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * The current time, re-rendering every `intervalMs` (default 1s) for live countdowns.
 * Pass 0 (or a negative number) to stop ticking, e.g. `useNow(isAuction ? 1000 : 0)`.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

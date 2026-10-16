'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { truncateAddress } from '../lib/format';
import { useOptionalToast } from './ToastProvider';
import { cn } from './ui/cn';

export interface AddressProps {
  address: string;
  /** Show a copy button (copies the full address, confirms with a toast). */
  copy?: boolean;
  /** Characters kept at the start (including 0x) and end. Defaults 6 / 4. */
  lead?: number;
  tail?: number;
  /** Show the whole address (wraps); otherwise "0x1234…5678". */
  full?: boolean;
  /** What the copy toast calls it ("Address", "Object ID"). */
  kind?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const sizes = {
  xs: 'text-xs',
  sm: 'text-[13px]',
  md: 'text-sm',
};

/** A wallet address or object id in mono, truncated as 0x1234…5678, with an optional copy button. */
export default function Address({
  address,
  copy = false,
  lead = 6,
  tail = 4,
  full = false,
  kind = 'Address',
  size = 'sm',
  className,
}: AddressProps) {
  const toast = useOptionalToast();
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast?.showToast('success', `${kind} copied to clipboard.`);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      toast?.showToast('error', `Could not copy the ${kind.toLowerCase()}.`);
    }
  };

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5', className)}>
      <span
        title={address}
        className={cn('font-mono tracking-tight text-fg-muted', sizes[size], full ? 'break-all' : 'truncate')}
      >
        {full ? address : truncateAddress(address, lead, tail)}
      </span>
      {copy && (
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? `${kind} copied` : `Copy ${kind.toLowerCase()}`}
          className="relative z-10 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {copied ? (
            <Check aria-hidden="true" className="h-3.5 w-3.5 text-success" strokeWidth={2} />
          ) : (
            <Copy aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
        </button>
      )}
    </span>
  );
}

export { Address };

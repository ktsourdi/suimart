'use client';

import { TriangleAlert } from 'lucide-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { MOCK_MODE, PACKAGE_ID, SUI_NETWORK } from '../lib/config';

const EMPTY_PACKAGE = '0x0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Rendered once by the layout, under the header. In MOCK_MODE it renders nothing
 * (the header's "Demo" pill covers it). In real mode it is a slim amber notice
 * while the package id is missing or no wallet is connected.
 */
export default function NetworkBanner() {
  const account = useCurrentAccount();
  const missingPackage = !PACKAGE_ID || PACKAGE_ID === EMPTY_PACKAGE;

  if (MOCK_MODE) return null;
  if (!missingPackage && account) return null;

  return (
    <div role="status" className="border-b border-warning/15 bg-warning/[0.06]">
      <div className="container-page flex min-h-10 items-center gap-2.5 py-2 text-[13px] leading-5 text-fg-muted">
        <TriangleAlert aria-hidden="true" className="h-4 w-4 shrink-0 text-warning" strokeWidth={1.75} />
        {missingPackage ? (
          <p>
            <span className="font-medium text-fg">Marketplace package not set.</span> Add{' '}
            <code className="rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-fg">
              NEXT_PUBLIC_MARKETPLACE_PACKAGE
            </code>{' '}
            to .env.local.
          </p>
        ) : (
          <p>
            Connect a wallet to use the marketplace on <span className="font-medium capitalize text-fg">{SUI_NETWORK}</span>.
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import { PACKAGE_ID, SUI_NETWORK } from '../lib/config';
import { useCurrentAccount } from '@mysten/dapp-kit';

export default function NetworkBanner() {
  const account = useCurrentAccount();
  const missingPackage = !PACKAGE_ID || PACKAGE_ID === '0x0000000000000000000000000000000000000000000000000000000000000000';

  if (!missingPackage && account) return null;

  return (
    <div className="w-full bg-[#fff8e2] border-b border-[#f5cf54] text-[#8d6e15]">
      <div className="max-w-7xl mx-auto px-6 py-2 text-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#f5cf54] rounded-full"></span>
          {missingPackage ? (
            <span>
              Marketplace package not set. Add <code className="px-1 bg-white border rounded">NEXT_PUBLIC_MARKETPLACE_PACKAGE</code> to .env.local.
            </span>
          ) : (
            <span>
              Connect a wallet to use the marketplace on <strong>{SUI_NETWORK}</strong>.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
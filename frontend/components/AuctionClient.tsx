'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Gavel, LoaderCircle } from 'lucide-react';
import { buttonVariants } from './ui/Button';

const AUCTION_FORM = '/sell?mode=auction';

/** /auction is an alias: it opens the Sell form with the Auction option selected. */
export default function AuctionClient() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sell page with auction mode. Replace, so Back does not bounce here again.
    router.replace(AUCTION_FORM);
  }, [router]);

  return (
    <div className="container-page flex justify-center py-24 sm:py-32">
      <div role="status" aria-live="polite" className="flex max-w-sm flex-col items-center text-center">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning ring-1 ring-inset ring-warning/20">
          <span aria-hidden="true" className="absolute -inset-2 rounded-full border border-warning/10" />
          <Gavel aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <h1 className="mt-6 font-display text-h3 font-semibold text-fg">Opening the auction form</h1>
        <p className="mt-1.5 inline-flex items-center gap-2 text-sm text-fg-muted">
          <LoaderCircle aria-hidden="true" className="h-4 w-4 text-fg-subtle motion-safe:animate-spin" strokeWidth={1.75} />
          Taking you to Sell with Auction selected…
        </p>
        <Link href={AUCTION_FORM} className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'mt-6' })}>
          Continue
          <ArrowRight aria-hidden="true" className="h-4 w-4 text-fg-subtle" strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
}

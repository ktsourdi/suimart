import { Suspense } from 'react';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { ListingDetailSkeleton } from '../../components/ListingDetailSkeleton';

export const metadata: Metadata = {
  title: 'Listing',
  description: 'Price, live auction status and on-chain details for a SuiMart listing.',
};

// The detail view reads ?id= and the wallet in the browser, so it renders on the
// client only. The skeleton matches its layout while the chunk and data load.
const ListingClient = dynamic(() => import('../../components/ListingClient'), {
  ssr: false,
  loading: () => <ListingDetailSkeleton />,
});

export default function ListingPage() {
  return (
    <Suspense fallback={<ListingDetailSkeleton />}>
      <ListingClient />
    </Suspense>
  );
}

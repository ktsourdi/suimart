import dynamic from 'next/dynamic';

const ListingClient = dynamic(() => import('../../components/ListingClient'), { ssr: false });

export default function ListingPage() {
  return <ListingClient />;
}
import dynamic from "next/dynamic";

const AuctionClient = dynamic(() => import("../../components/AuctionClient"), { ssr: false });

export default function AuctionPage() {
  return <AuctionClient />;
}
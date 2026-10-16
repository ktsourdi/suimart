import type { Metadata } from "next";
import dynamic from "next/dynamic";

const AuctionClient = dynamic(() => import("../../components/AuctionClient"), { ssr: false });

export const metadata: Metadata = {
  title: "Create an auction",
  description: "Start a timed auction on SuiMart.",
};

export default function AuctionPage() {
  return <AuctionClient />;
}

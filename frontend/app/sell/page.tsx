import dynamic from "next/dynamic";

const SellClient = dynamic(() => import("../../components/SellClient"), { ssr: false });

export default function SellPage() {
  return <SellClient />;
}
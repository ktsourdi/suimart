import { Suspense } from "react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

const SellClient = dynamic(() => import("../../components/SellClient"), { ssr: false });

export const metadata: Metadata = {
  title: "List an item",
  description: "List an item on SuiMart at a fixed price or as a timed auction.",
};

// SellClient reads ?mode= with useSearchParams, which needs a Suspense boundary.
export default function SellPage() {
  return (
    <Suspense fallback={null}>
      <SellClient />
    </Suspense>
  );
}

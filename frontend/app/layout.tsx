import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import ToastProvider from "../components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

// Dynamically import WalletProvider with SSR disabled
const WalletProvider = dynamic(() => import("../components/WalletProvider"), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "Suimart - Decentralized Marketplace",
  description: "Buy and sell digital items on the Sui blockchain",
  keywords: "sui, blockchain, marketplace, nft, defi",
  openGraph: {
    title: "Suimart - Decentralized Marketplace",
    description: "Buy and sell digital items on the Sui blockchain",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <WalletProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
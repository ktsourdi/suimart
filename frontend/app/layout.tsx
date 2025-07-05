import { Inter } from "next/font/google";
import "../styles/globals.css";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import type { ReactNode, ReactElement } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Suimart",
  description: "Peer-to-peer marketplace on Sui blockchain",
};

interface RootLayoutProps {
  children: ReactNode;
}

// Load the wallet-provider only in the browser so that any
// window-specific code inside @mysten/wallet-kit never runs during
// the Next.js build / prerendering step.
const WalletContextProvider = dynamic(
  () => import("../components/WalletProvider").then((m) => m.WalletContextProvider),
  { ssr: false }
);

export default function RootLayout({ children }: RootLayoutProps): ReactElement {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}
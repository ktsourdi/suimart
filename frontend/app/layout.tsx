// @ts-nocheck

import { Inter } from "next/font/google";
import "../styles/globals.css";
import { WalletContextProvider } from "../components/WalletProvider";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Suimart",
  description: "Peer-to-peer marketplace on Sui blockchain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { WalletContextProvider } from "../components/WalletProvider";
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

export default function RootLayout({ children }: RootLayoutProps): ReactElement {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}
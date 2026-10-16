import "../styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import dynamic from "next/dynamic";
import ToastProvider from "../components/ToastProvider";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import NetworkBanner from "../components/NetworkBanner";

// types/next-font.d.ts stubs next/font/google with Inter only; declare the two
// other loaders used here (harmless overloads once that stub is removed).
declare module "next/font/google" {
  export function Inter_Tight(options: GoogleFontOptions): LoadedFont;
  export function JetBrains_Mono(options: GoogleFontOptions): LoadedFont;
}

type LoadedFont = { className: string; variable?: string; style?: unknown };

/** The CSS-variable class of a next/font result. */
const fontVariable = (font: { className: string }) => (font as LoadedFont).variable ?? "";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontDisplay = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// WalletProvider (dapp-kit) is browser-only, so everything that reads the wallet,
// including the header, renders inside it on the client.
const WalletProvider = dynamic(() => import("../components/WalletProvider"), {
  ssr: false,
});

const TITLE = "SuiMart · Peer-to-peer marketplace on Sui";
const DESCRIPTION =
  "Buy, sell and bid on digital items on Sui. Fixed-price sales and live auctions, settled by Move smart contracts.";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: "%s · SuiMart",
  },
  description: DESCRIPTION,
  applicationName: "SuiMart",
  keywords: ["sui", "move", "marketplace", "auction", "nft", "web3"],
  authors: [{ name: "Hellenic Web3", url: "https://www.hellenicweb3.com" }],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "SuiMart",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#06080F",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontVariable(fontSans)} ${fontVariable(fontDisplay)} ${fontVariable(fontMono)}`}
      suppressHydrationWarning
    >
      <body className="bg-bg font-sans text-fg antialiased">
        <WalletProvider>
          <ToastProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[80] focus:rounded-control focus:bg-accent focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-accent-fg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
            >
              Skip to content
            </a>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <NetworkBanner />
              <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
                {children}
              </main>
              <SiteFooter />
            </div>
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}

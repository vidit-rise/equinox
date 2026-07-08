import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SWRProvider } from "./swr-provider";
import { HeaderNavigation } from "@/core/components/HeaderNavigation";
import { ErrorSystemBoundary } from "@/core/components/ErrorSystemBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  title: "Equinox AMM | Stellar Swap Protocol",
  description: "A decentralized constant-product AMM built on the Stellar Blockchain using Soroban Smart Contracts. Instant SST ↔ XLM swaps, liquidity provision, and live on-chain event streaming.",
  openGraph: {
    title: "Equinox AMM",
    description: "Premium liquidity and token swaps on Stellar Testnet",
    url: "https://equinox-amm.pages.dev",
    siteName: "Equinox AMM",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Equinox AMM",
    description: "Premium liquidity and token swaps on Stellar Testnet",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorSystemBoundary>
          <SWRProvider>
            <HeaderNavigation />
            {children}
          </SWRProvider>
        </ErrorSystemBoundary>
      </body>
    </html>
  );
}

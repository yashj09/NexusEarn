import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Web3Provider from "@/providers/Web3Provider";
import { cookieToInitialState } from "wagmi";
import { config } from "@/lib/web3/wagmiConfig";
import { ClientProviders } from "@/providers/ClientProviders";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexusEarn - Adaptive Multi-Chain Yield Optimizer",
  description:
    "Maximize your stablecoin yields across all chains with intelligent rebalancing powered by Avail Nexus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(config);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider initialState={initialState}>
          <ErrorBoundary>
            <ClientProviders>{children}</ClientProviders>
          </ErrorBoundary>
        </Web3Provider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../providers/Auth";
import { PreferencesProvider } from "../lib/hooks/usePreferences";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ToastContainer } from "../components/ToastContainer";
import { KeyboardShortcuts } from "../components/KeyboardShortcuts";
import { KeepStandaloneNavigation } from "../components/KeepStandaloneNavigation";
import { PWAInstallPrompt } from "../components/PWAInstallPrompt";
import { ServiceWorkerUpdate } from "../components/ServiceWorkerUpdate";
import { SafeAreaInsets } from "../components/SafeAreaInsets";
import { ThemeSync } from "../components/ThemeSync";
import Script from "next/script";
import React from "react";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
  variable: "--font-sans",
  fallback: ["system-ui", "Segoe UI", "sans-serif"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-mono",
  fallback: ["ui-monospace", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "LiftLedger — The training log",
    template: "%s | LiftLedger",
  },
  description:
    "A day-based workout ledger you can install on your phone. Log strength, cardio, and calisthenics. Import Strong or Hevy. PRs, streaks, and friends stay in sync.",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  keywords: ["workout tracker", "fitness app", "exercise log", "strength training", "cardio tracker"],
  authors: [{ name: "LiftLedger" }],
  openGraph: {
    title: "LiftLedger",
    description: "Track your workouts, achieve your goals",
    type: "website",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "LiftLedger",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LiftLedger",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14532d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plexSans.className} ${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
        <Script id="ios-safe-area" strategy="beforeInteractive">
          {`(function(){try{var theme="system";try{var raw=localStorage.getItem("@liftledger:preferences");if(raw){var p=JSON.parse(raw);if(p&&p.theme)theme=p.theme;}}catch(e){}var dark=theme==="dark"||(theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark)document.documentElement.classList.add("dark");}catch(e){}})();`}
        </Script>
        <ErrorBoundary>
          <AuthProvider>
            <PreferencesProvider>
              <SafeAreaInsets />
              <ThemeSync />
              <KeyboardShortcuts />
              <KeepStandaloneNavigation />
              {children}
              <ToastContainer />
              <PWAInstallPrompt />
              <ServiceWorkerUpdate />
            </PreferencesProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

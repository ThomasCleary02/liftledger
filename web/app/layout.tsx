import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../providers/Auth";
import { PreferencesProvider } from "../lib/hooks/usePreferences";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ToastContainer } from "../components/ToastContainer";
import { KeyboardShortcuts } from "../components/KeyboardShortcuts";
import { PWAInstallPrompt } from "../components/PWAInstallPrompt";
import { ServiceWorkerUpdate } from "../components/ServiceWorkerUpdate";
import { SafeAreaInsets } from "../components/SafeAreaInsets";
import { ThemeSync } from "../components/ThemeSync";
import Script from "next/script";
import React from "react";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "LiftLedger - Track Your Workouts, Achieve Your Goals",
  description: "Track your workouts, achieve your goals. Log strength, cardio, and calisthenics with PRs, streaks, and weekly summaries.",
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
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script id="ios-safe-area" strategy="beforeInteractive">
          {`(function(){try{var n=window.navigator;var ios=/iPad|iPhone|iPod/.test(n.userAgent)||(n.platform==="MacIntel"&&n.maxTouchPoints>1);var standalone=n.standalone===true||window.matchMedia("(display-mode: standalone)").matches;if(ios&&standalone){var r=document.documentElement;r.classList.add("ios-standalone");r.style.setProperty("--safe-area-top-floor","45px");r.style.setProperty("--safe-area-bottom-floor","32px");}var theme="system";try{var raw=localStorage.getItem("@liftledger:preferences");if(raw){var p=JSON.parse(raw);if(p&&p.theme)theme=p.theme;}}catch(e){}var dark=theme==="dark"||(theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark)document.documentElement.classList.add("dark");}catch(e){}})();`}
        </Script>
        <ErrorBoundary>
          <AuthProvider>
            <PreferencesProvider>
              <SafeAreaInsets />
              <ThemeSync />
              <KeyboardShortcuts />
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

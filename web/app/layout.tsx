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
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LiftLedger - Track Your Workouts, Achieve Your Goals",
  description: "Track your workouts, achieve your goals. Log strength training, cardio, and calisthenics exercises with detailed analytics and personal records.",
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
        <ErrorBoundary>
          <AuthProvider>
            <PreferencesProvider>
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

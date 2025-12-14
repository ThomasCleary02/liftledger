import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "LiftLedger - Train Smarter. Track Better.",
    template: "%s | LiftLedger",
  },
  description: "Simple workout logging, cross-platform access, and offline-ready tracking for your fitness journey.",
  keywords: ["workout tracker", "fitness app", "exercise log", "strength training", "cardio tracker", "calisthenics"],
  openGraph: {
    title: "LiftLedger - Train Smarter. Track Better.",
    description: "Simple workout logging, cross-platform access, and offline-ready tracking for your fitness journey.",
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
  twitter: {
    card: "summary",
    title: "LiftLedger - Train Smarter. Track Better.",
    description: "Simple workout logging, cross-platform access, and offline-ready tracking for your fitness journey.",
  },
};

export default function MarketingLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <>{children}</>;
  }
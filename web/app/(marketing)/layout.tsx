import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "LiftLedger - Train Smarter. Track Better.",
    template: "%s | LiftLedger",
  },
  description: "A web workout tracker you can install on your phone. Log strength, cardio, and calisthenics with analytics that stay in sync.",
  keywords: ["workout tracker", "fitness app", "exercise log", "strength training", "cardio tracker", "calisthenics"],
  openGraph: {
    title: "LiftLedger - Train Smarter. Track Better.",
    description: "A web workout tracker you can install on your phone. Log strength, cardio, and calisthenics with analytics that stay in sync.",
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
    description: "A web workout tracker you can install on your phone. Log strength, cardio, and calisthenics with analytics that stay in sync.",
  },
};

export default function MarketingLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <>{children}</>;
  }
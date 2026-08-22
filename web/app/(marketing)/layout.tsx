import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: {
    default: "The training log",
    template: "%s | LiftLedger",
  },
  description:
    "A day-based workout ledger you can install on your phone. Log strength, cardio, and calisthenics. Import Strong or Hevy. PRs, streaks, and friends stay in sync.",
  keywords: ["workout tracker", "fitness app", "exercise log", "strength training", "cardio tracker", "calisthenics", "PWA"],
  openGraph: {
    title: "LiftLedger — The training log",
    description:
      "A day-based workout ledger you can install on your phone. Log strength, cardio, and calisthenics. Import Strong or Hevy.",
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
    title: "LiftLedger — The training log",
    description:
      "A day-based workout ledger you can install on your phone. Log strength, cardio, and calisthenics. Import Strong or Hevy.",
  },
};

export default function MarketingLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <>{children}</>;
  }
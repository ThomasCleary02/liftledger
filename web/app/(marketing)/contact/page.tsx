import type { Metadata } from "next";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write LiftLedger about the log, imports, or your account.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-mono text-sm uppercase tracking-[0.16em]">Back</span>
        </Link>

        <p className="kicker mb-3 text-center">The office</p>
        <h1 className="mb-4 text-center text-4xl font-semibold text-gray-900 md:text-5xl">Write us</h1>
        <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-gray-600">
          Imports that broke, a missing lift, or something you want in the book.
        </p>

        <div className="rounded-md border border-gray-200 bg-white p-8 text-center md:p-12">
          <div className="mb-6 inline-flex items-center justify-center rounded-md bg-brand p-4">
            <Mail className="h-6 w-6 text-brand-fg" />
          </div>
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Email</h2>
          <p className="mb-6 text-gray-600">We usually reply within a couple of days.</p>
          <a
            href="mailto:contact@liftledger.fit"
            className="inline-flex items-center gap-2 rounded-md bg-brand px-8 py-4 text-sm font-semibold tracking-wide text-brand-fg hover:bg-brand-deep"
          >
            <Mail className="h-5 w-5" />
            contact@liftledger.fit
          </a>
        </div>
      </div>
    </div>
  );
}

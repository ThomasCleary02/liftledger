import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - LiftLedger",
  description: "LiftLedger Terms of Service - Read our terms and conditions for using the app.",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
          LiftLedger Terms of Service
        </h1>
        <p className="mb-12 text-gray-600">
          Effective date: November 6, 2025
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <p className="text-lg text-gray-700">
            Welcome to LiftLedger! By using our app or website, you agree to the following terms.
          </p>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">1. Using LiftLedger</h2>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>You must provide accurate information when creating an account.</li>
              <li>Keep your login credentials secure.</li>
              <li>You may not misuse the app or attempt to hack or disrupt its functionality.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">2. Content & Data</h2>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>Your workout data and analytics are stored securely in Firebase.</li>
              <li>LiftLedger is provided "as-is"; results may vary.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">3. Liability & Disclaimer</h2>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>We are not responsible for injury, loss, or any consequences from using the app.</li>
              <li>LiftLedger is intended for personal fitness tracking only.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">4. Governing Law</h2>
            <p className="text-gray-700">
              These terms are governed by the laws of Maryland, USA.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">5. Contact</h2>
            <p className="text-gray-700">
              Questions about terms? Email us at{" "}
              <a
                href="mailto:contact@liftledger.fit"
                className="text-black underline hover:text-gray-700"
              >
                contact@liftledger.fit
              </a>.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">6. Changes</h2>
            <p className="text-gray-700">
              We may update these terms; users will be notified via the app or website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

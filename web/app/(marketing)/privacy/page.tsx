import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - LiftLedger",
  description: "LiftLedger Privacy Policy - Learn how we collect, use, and protect your data.",
};

export default function PrivacyPolicy() {
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
          LiftLedger Privacy Policy
        </h1>
        <p className="mb-12 text-gray-600">
          Effective date: November 6, 2025
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <p className="text-lg text-gray-700">
            LiftLedger ("we", "our", "the app") respects your privacy. This policy explains what data we collect, why, and how we use it.
          </p>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">1. Information We Collect</h2>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li><strong>Account info:</strong> email address, optional name.</li>
              <li><strong>Workout & analytics data:</strong> exercises, logs, progress statistics.</li>
              <li><strong>Device info:</strong> type, OS version, basic usage analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">2. How We Use Your Data</h2>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>To provide and improve the app's features.</li>
              <li>To store your progress and account information.</li>
              <li>To send optional updates or notifications (only if you opt in).</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">3. Data Sharing & Storage</h2>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>We store data securely in Firebase / Firestore.</li>
              <li>We do not sell your data.</li>
              <li>We may share anonymized analytics for improving the app.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">4. Your Rights</h2>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>Access, update, or delete your account data anytime.</li>
              <li>
                Contact us at{" "}
                <a
                  href="mailto:contact@liftledger.fit"
                  className="text-black underline hover:text-gray-700"
                >
                  contact@liftledger.fit
                </a>{" "}
                for privacy inquiries.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">5. Third-Party Services</h2>
            <p className="text-gray-700">
              Firebase, Netlify, Zoho Mail. These providers have their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">6. Changes to this Policy</h2>
            <p className="text-gray-700">
              We may update this policy; the latest version will always be posted in the app and on the website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

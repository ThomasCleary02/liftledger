import type { Metadata } from "next";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us - LiftLedger",
  description: "Get in touch with LiftLedger. Have questions? We'd love to hear from you.",
};

export default function ContactPage() {
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

        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-black p-4">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Get In Touch
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Have questions, feedback, or need support? We'd love to hear from you.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 md:p-12">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-xl bg-black p-4">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Email Us
            </h2>
            <p className="mb-6 text-gray-600">
              Send us an email and we'll get back to you as soon as possible.
            </p>
            <a
              href="mailto:contact@liftledger.fit"
              className="inline-flex items-center gap-2 rounded-xl bg-black px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
            >
              <Mail className="h-5 w-5" />
              contact@liftledger.fit
            </a>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-8 md:p-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            What We Can Help With
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                <span className="text-sm font-semibold text-gray-700">1</span>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-gray-900">Technical Support</h3>
                <p className="text-gray-600">
                  Issues with the app, syncing problems, or feature questions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                <span className="text-sm font-semibold text-gray-700">2</span>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-gray-900">Feature Requests</h3>
                <p className="text-gray-600">
                  Have an idea for a new feature? We're always looking to improve.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                <span className="text-sm font-semibold text-gray-700">3</span>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-gray-900">Account Help</h3>
                <p className="text-gray-600">
                  Questions about your account, data, or privacy concerns.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                <span className="text-sm font-semibold text-gray-700">4</span>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-gray-900">General Feedback</h3>
                <p className="text-gray-600">
                  Share your experience, suggestions, or anything else on your mind.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            We typically respond within 24-48 hours. Thank you for your patience!
          </p>
        </div>
      </div>
    </div>
  );
}

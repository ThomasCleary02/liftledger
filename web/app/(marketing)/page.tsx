"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../providers/Auth";
import { 
  Dumbbell, 
  BarChart3, 
  Smartphone, 
  Settings, 
  Trophy,
  Mail,
  ArrowRight,
  Clock,
  Monitor
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Full Viewport Height */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 py-20">
        <div className="mx-auto w-full max-w-7xl">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-8 inline-flex items-center justify-center rounded-3xl bg-black p-6">
              <Dumbbell className="h-12 w-12 text-white" />
            </div>
            
            <h1 className="mb-6 text-5xl font-bold text-gray-900 md:text-6xl lg:text-7xl">
              LiftLedger
            </h1>
            <p className="mb-4 text-2xl font-semibold text-gray-700 md:text-3xl">
              Track Your Strength, Anywhere
            </p>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 md:text-xl">
              Your web and mobile app for tracking strength, analytics, and personal progress.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => router.push("/workouts")}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-black px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 sm:w-auto"
              >
                Open App
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={scrollToFeatures}
                className="w-full rounded-xl border-2 border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-900 transition-all hover:border-gray-400 active:scale-95 sm:w-auto"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 md:py-32">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Everything You Need
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Powerful features to track your fitness journey and achieve your goals
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1: Track Workouts */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3">
                <Dumbbell className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Track Workouts</h3>
              <p className="text-gray-600">
                Log exercises, sets, and reps with ease. Support for strength training, cardio, and calisthenics.
              </p>
            </div>

            {/* Feature 2: Analytics */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex rounded-xl bg-purple-100 p-3">
                <BarChart3 className="h-6 w-6 text-purple-700" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Analytics</h3>
              <p className="text-gray-600">
                See PRs, cardio stats, and progress trends. Visualize your journey with detailed charts and insights.
              </p>
            </div>

            {/* Feature 3: Multi-platform */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex rounded-xl bg-green-100 p-3">
                <Smartphone className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Multi-platform Access</h3>
              <p className="text-gray-600">
                Use on web or mobile, share data seamlessly. Your workouts sync across all your devices.
              </p>
            </div>

            {/* Feature 4: Unit Preferences */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex rounded-xl bg-orange-100 p-3">
                <Settings className="h-6 w-6 text-orange-700" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Unit Preferences</h3>
              <p className="text-gray-600">
                Switch between lbs/kg, km/miles, and more. Customize the app to match your preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="bg-gray-50 px-4 py-20 md:py-32">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Available Everywhere
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Access your workouts on any device, anywhere you go
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Web App */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-4">
                <div className="rounded-xl bg-black p-4">
                  <Monitor className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Web App</h3>
                  <p className="text-sm text-gray-500">Available Now</p>
                </div>
              </div>
              <p className="mb-6 text-gray-600">
                Access your workouts from any browser. Full-featured experience on desktop and tablet with real-time sync.
              </p>
              <button
                onClick={() => router.push("/workouts")}
                className="w-full rounded-xl bg-black px-6 py-3 text-base font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              >
                Try Web App
              </button>
            </div>

            {/* Mobile App */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
              <div className="mb-6 flex items-center gap-4">
                <div className="rounded-xl bg-black p-4">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Mobile App</h3>
                  <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5">
                    <Clock className="h-3 w-3 text-amber-700" />
                    <span className="text-xs font-semibold text-amber-700">In Development</span>
                  </div>
                </div>
              </div>
              <p className="mb-6 text-gray-600">
                Track workouts on the go with our native mobile app. Coming soon to iOS and Android with full feature parity.
              </p>
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <Clock className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="text-sm font-medium text-gray-600">Mobile app coming soon</p>
                <p className="mt-1 text-xs text-gray-500">
                  Stay tuned for updates
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started CTA */}
      <section className="px-4 py-20 md:py-32">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-900 to-black p-12 text-center shadow-xl md:p-16">
            <Trophy className="mx-auto mb-6 h-16 w-16 text-yellow-400" />
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
              Start Tracking Today
            </h2>
            <p className="mb-8 text-lg text-gray-300 md:text-xl">
              Join thousands of users tracking their fitness journey with LiftLedger
            </p>
            <button
              onClick={() => router.push("/workouts")}
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-black shadow-lg transition-all hover:bg-gray-100 active:scale-95"
            >
              Get Started
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section - Simplified */}
      <section className="bg-gray-50 px-4 py-20 md:py-32">
        <div className="mx-auto w-full max-w-4xl">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-black p-3">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Get In Touch
            </h2>
            <p className="mb-8 text-lg text-gray-600">
              Have questions? We'd love to hear from you.
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
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-12">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">
                © 2025 LiftLedger. All rights reserved.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a
                href="/privacy"
                className="text-gray-600 hover:text-black hover:underline"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-gray-600 hover:text-black hover:underline"
              >
                Terms of Service
              </a>
              <a
                href="mailto:contact@liftledger.fit"
                className="text-gray-600 hover:text-black hover:underline"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

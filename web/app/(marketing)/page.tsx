import Link from "next/link";
import {
  Dumbbell,
  BarChart3,
  Smartphone,
  Trophy,
  Mail,
  ArrowRight,
  Monitor,
  Upload,
  Moon,
  Sparkles,
} from "lucide-react";
import { BrandMark } from "../../components/BrandMark";

function FeatureCard({
  icon: Icon,
  well,
  iconColor,
  title,
  body,
}: {
  icon: typeof Dumbbell;
  well: string;
  iconColor: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-6 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
      <div className={`mb-4 inline-flex rounded-md p-3 ${well}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{body}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_31px,rgb(20_83_45/0.10)_31px,rgb(20_83_45/0.10)_32px)]" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="kicker mb-4">Workout log · PWA</p>
            <BrandMark size="lg" />
            <h1 className="mt-8 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-gray-900 md:text-5xl">
              The training log that looks like a ledger, not another gym app.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-gray-600">
              One page per day for strength, cardio, and calisthenics. Import Strong or Hevy, or start today. Add it to your home screen — there is no App Store listing yet.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                href="/day/today"
                prefetch
                className="group flex items-center justify-center gap-2 rounded-md bg-brand px-8 py-4 text-sm font-semibold tracking-wide text-brand-fg shadow-md shadow-brand/20 transition-colors hover:bg-brand-deep"
              >
                Open the log
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="rounded-md border border-brand-deep/40 bg-paper px-8 py-4 text-center text-sm font-semibold text-brand-deep hover:bg-brand-muted"
              >
                How it works
              </a>
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-6 shadow-[0_1px_0_rgb(20_83_45/0.18)]">
            <div className="mb-4 flex items-baseline justify-between border-b border-gray-200 pb-3">
              <p className="kicker">Today</p>
              <p className="font-mono text-sm text-gray-500">Entry 047</p>
            </div>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Squat</span>
                <span className="font-semibold tabular-nums text-gray-900">5 × 225 lb</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Bench</span>
                <span className="font-semibold tabular-nums text-gray-900">5 × 185 lb</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Row</span>
                <span className="font-semibold tabular-nums text-gray-900">8 × 155 lb</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-dashed border-gray-200 pt-3">
                <span className="kicker">Volume</span>
                <span className="font-semibold tabular-nums text-brand">12,340 lb</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-20 md:py-32">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-16 text-center">
            <p className="kicker mb-3">The log</p>
            <h2 className="mb-4 text-4xl font-semibold text-gray-900 md:text-5xl">
              Everything in the book
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Built for the gym floor: fast logging, honest streaks, and a ledger you can actually reread.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Dumbbell}
              well="bg-brand/15"
              iconColor="text-brand"
              title="One page per day"
              body="Strength sets, cardio, and calisthenics on the same date. Last-set hints, supersets, and a rest timer between work."
            />
            <FeatureCard
              icon={Upload}
              well="bg-info-muted"
              iconColor="text-info"
              title="Bring an old log"
              body="Import a Strong or Hevy CSV, map a spreadsheet, paste from Notes, or start from PPL, 5/3/1, or Starting Strength."
            />
            <FeatureCard
              icon={BarChart3}
              well="bg-success-muted"
              iconColor="text-success"
              title="The books"
              body="PRs, volume, cardio, and a week-at-a-glance. Share a week as an image. Filter week, month, year, or the whole ledger."
            />
            <FeatureCard
              icon={Moon}
              well="bg-warning-muted"
              iconColor="text-warning"
              title="Rest is in the streak"
              body="Mark rest days so recovery still counts. Injured / skip days stay in the log but do not pad the streak."
            />
            <FeatureCard
              icon={Sparkles}
              well="bg-brand/15"
              iconColor="text-brand"
              title="A note when it matters"
              body="After you save, the log can flag a PR or a simple progress note. No cloud coach, no waiting on the gym floor."
            />
            <FeatureCard
              icon={Trophy}
              well="bg-info-muted"
              iconColor="text-info"
              title="Friends and the board"
              body="Add people by username, put a face on the board, and compare volume, cardio, and consistency."
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:py-32">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-16 text-center">
            <p className="kicker mb-3">Carry it</p>
            <h2 className="mb-4 text-4xl font-semibold text-gray-900 md:text-5xl">
              Browser or home screen
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              LiftLedger is a web app. Same log on your laptop and your phone. Install it for one tap — we are not in the App Store yet.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-white p-8 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
              <div className="mb-6 flex items-center gap-4">
                <div className="rounded-md bg-brand p-4">
                  <Monitor className="h-8 w-8 text-brand-fg" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">In the browser</h3>
                  <p className="font-mono text-sm text-gray-500">Desktop, tablet, or phone</p>
                </div>
              </div>
              <p className="mb-6 text-gray-600">
                Logging, analytics, friends, and settings from any modern browser. Data syncs when you are online.
              </p>
              <Link
                href="/day/today"
                prefetch
                className="block w-full rounded-md bg-brand px-6 py-3 text-center text-sm font-semibold tracking-wide text-brand-fg hover:bg-brand-deep"
              >
                Open the log
              </Link>
            </div>

            <div className="rounded-md border border-gray-200 bg-white p-8 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
              <div className="mb-6 flex items-center gap-4">
                <div className="rounded-md bg-brand p-4">
                  <Smartphone className="h-8 w-8 text-brand-fg" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">On your home screen</h3>
                  <p className="font-mono text-sm text-gray-500">iPhone and Android</p>
                </div>
              </div>
              <p className="mb-4 text-gray-600">
                Add to Home Screen for a full-screen log with no store download.
              </p>
              <ul className="mb-6 space-y-2 font-mono text-sm text-gray-600">
                <li>
                  <span className="font-semibold text-gray-900">iPhone:</span> Share → Add to Home Screen
                </li>
                <li>
                  <span className="font-semibold text-gray-900">Android:</span> Chrome menu → Install app
                </li>
              </ul>
              <Link
                href="/login"
                prefetch
                className="block w-full rounded-md border border-brand-deep/40 bg-paper px-6 py-3 text-center text-sm font-semibold text-brand-deep hover:bg-brand-muted"
              >
                Sign the log
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:py-32">
        <div className="mx-auto w-full max-w-4xl">
          <div className="brand-panel rounded-md p-12 text-center md:p-16">
            <p className="kicker mb-4">Start a page</p>
            <h2 className="mb-4 text-4xl font-semibold text-white md:text-5xl">
              Open today&apos;s entry
            </h2>
            <p className="mb-8 text-lg text-gray-300 md:text-xl">
              Import a log or start blank. Rest days keep the streak. Injured days stay honest.
            </p>
            <Link
              href="/day/today"
              prefetch
              className="group inline-flex items-center gap-2 rounded-md bg-brand px-8 py-4 text-sm font-semibold tracking-wide text-brand-fg hover:bg-brand-deep"
            >
              Get started
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="kicker mb-4">The office</p>
          <h2 className="mb-4 text-4xl font-semibold text-gray-900 md:text-5xl">Write us</h2>
          <p className="mb-8 text-lg text-gray-600">Questions, imports that broke, or a feature you want in the book.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-md bg-brand px-8 py-4 text-sm font-semibold tracking-wide text-brand-fg hover:bg-brand-deep"
          >
            <Mail className="h-5 w-5" />
            Contact
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white px-4 py-12">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center md:text-left">
            <BrandMark size="sm" />
            <p className="mt-3 text-sm text-gray-600">© 2026 LiftLedger. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-sm">
            <Link href="/privacy" className="text-gray-600 hover:text-brand hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-600 hover:text-brand hover:underline">
              Terms
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-brand hover:underline">
              Contact
            </Link>
            <Link href="/login" className="text-brand hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { FileText, MessageSquare, Share2, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-10" />
        <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI Interview Bot
          </span>
          <Link
            href="/setup"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Get Started
          </Link>
        </nav>

        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Smart Interview
            </span>
            <br />
            Questions in Seconds
          </h1>
          <p className="mt-6 text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto">
            Paste a Job Description, let AI generate tailored interview
            questions, then share a link for adaptive candidate interviews.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Start Creating Interviews
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-indigo-600 px-8 py-4 text-lg font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
            >
              Danh sách Job
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<FileText className="h-8 w-8 text-indigo-500" />}
            title="Auto-Analyze JD"
            description="AI extracts key skills and generates relevant interview questions from any Job Description."
            gradient="from-indigo-500/10 to-blue-500/10"
          />
          <FeatureCard
            icon={<MessageSquare className="h-8 w-8 text-purple-500" />}
            title="Adaptive Interview"
            description="AI conducts the interview with smart follow-ups based on candidate responses."
            gradient="from-purple-500/10 to-pink-500/10"
          />
          <FeatureCard
            icon={<Share2 className="h-8 w-8 text-pink-500" />}
            title="Easy Sharing"
            description="Generate a unique link to send candidates. No sign-up needed."
            gradient="from-pink-500/10 to-orange-500/10"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="space-y-6">
          <Step number={1} title="Paste Job Description" description="Copy and paste the JD into the setup form" />
          <Step number={2} title="Select Skills & Edit Questions" description="Choose which skills to assess and customize the AI-generated questions" />
          <Step number={3} title="Share Interview Link" description="Generate a unique URL and send it to your candidate" />
          <Step number={4} title="Review Results" description="Candidate completes the adaptive interview, then exports results for your review" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-text-muted)]">
        AI Interview Bot — Prototype Demo
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${gradient} border border-[var(--color-border)] p-8 hover:shadow-lg transition-shadow`}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-[var(--color-text-muted)]">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-[var(--color-text-muted)]">{description}</p>
      </div>
    </div>
  );
}

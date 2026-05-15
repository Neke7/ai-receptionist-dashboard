// File path: src/app/hvac-demo/page.tsx
//
// Audio files expected at:
//   public/audio/routine.mp3
//   public/audio/emergency.mp3
//   public/audio/quick-question.mp3
//
// Font: Fraunces loaded via layout.tsx (separate edit required — see deployment notes)

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oxphi for HVAC — AI Receptionist for Houston HVAC Contractors",
  description:
    "Stop missing calls when you're on the job. Aria answers your phones 24/7, qualifies customers, and texts you every lead. Built for Houston HVAC owner-operators.",
};

const DEMO_PHONE = "(346) 597-9218";
const DEMO_PHONE_TEL = "+13465979218";
const SIGNUP_URL = "/signup";

const calls = [
  {
    id: "routine",
    label: "Routine Appointment",
    customer: "John Martinez",
    summary:
      "A homeowner calls about a rattling AC. Aria captures the details and schedules the visit — the way every missed call should have gone.",
    duration: "3:19",
    file: "/audio/routine.mp3",
  },
  {
    id: "emergency",
    label: "Emergency Triage",
    customer: "Sarah Williams",
    summary:
      "AC dies in summer. The caller's 78-year-old mother is in the home. Aria recognizes the vulnerable person, escalates to emergency, and commits to a 15-minute callback.",
    duration: "2:16",
    file: "/audio/emergency.mp3",
  },
  {
    id: "quick-question",
    label: "Pricing Inquiry",
    customer: "Mike Thompson",
    summary:
      "Customer asks about tune-up pricing. Aria correctly defers to the technician for an on-site quote, then captures the appointment request.",
    duration: "3:07",
    file: "/audio/quick-question.mp3",
  },
];

const features = [
  {
    title: "Answers every call",
    body: "Monday morning, Saturday night, or in the middle of an install. Aria picks up while you stay on the tools.",
  },
  {
    title: "Triages the urgent ones",
    body: "She knows the difference between a rattling AC and a 78-year-old without cooling in July. Critical calls get flagged immediately.",
  },
  {
    title: "Captures every detail",
    body: "Name, address, the actual problem, preferred time, gate codes, dog warnings. Everything dispatch needs, nothing missed.",
  },
  {
    title: "Texts you in real time",
    body: "The moment a call ends, you get the lead on your phone. No checking voicemails between jobs.",
  },
  {
    title: "Trained on HVAC",
    body: "Customized for your services, your pricing language, your service area. She speaks your trade.",
  },
  {
    title: "Dashboard with every call",
    body: "Listen to recordings, read transcripts, see what's coming through your phones — even when you're not picking up.",
  },
];

export default function HvacDemoPage() {
  return (
    <div className="relative min-h-screen text-foreground antialiased overflow-hidden">
      {/* Ambient indigo glow — top-right */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[140px]"
      />
      {/* Ambient cyan glow — bottom-left */}
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[140px]"
      />

      {/* HEADER */}
      <header className="relative border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <a href="/" className="font-serif text-2xl tracking-tight text-foreground">
            Oxphi
          </a>
          <a
            href={`tel:${DEMO_PHONE_TEL}`}
            className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Try the demo:{" "}
            <span className="text-foreground">{DEMO_PHONE}</span>
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
                For Houston HVAC Contractors
              </p>
              <h1 className="font-serif text-5xl lg:text-7xl leading-[1.05] tracking-tight text-foreground mb-8">
                Stop missing calls
                <br />
                <span className="italic text-muted-foreground">
                  when you&apos;re on the job.
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-10">
                Aria is an AI receptionist trained specifically for HVAC
                owner-operators. She answers your phones 24/7, qualifies callers,
                books appointments, and texts you every lead — so the next $400
                service call doesn&apos;t walk to a competitor.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={`tel:${DEMO_PHONE_TEL}`}
                  className="btn-primary group inline-flex items-center justify-center"
                >
                  Call the demo — {DEMO_PHONE}
                  <svg
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </a>
                <a
                  href={SIGNUP_URL}
                  className="btn-secondary inline-flex items-center justify-center"
                >
                  Book a call
                </a>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                Pretend you&apos;re a customer of{" "}
                <em className="font-serif italic text-foreground">
                  Houston Premier HVAC
                </em>{" "}
                — call the number above and tell Aria your AC is broken. See how
                she handles it.
              </p>
            </div>

            {/* Stats sidebar */}
            <div className="lg:col-span-5 lg:pl-10 lg:border-l lg:border-white/5">
              <div className="space-y-10">
                <div>
                  <p className="font-serif text-5xl text-foreground mb-2 tracking-tight">
                    5–15
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Calls a week most Houston HVAC owners miss to voicemail.
                  </p>
                </div>
                <div className="border-t border-white/5 pt-10">
                  <p className="font-serif text-5xl text-foreground mb-2 tracking-tight">
                    $1,600
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Average monthly revenue lost from those missed calls, at one
                    $400 service call a week.
                  </p>
                </div>
                <div className="border-t border-white/5 pt-10">
                  <p className="font-serif text-5xl text-foreground mb-2 tracking-tight">
                    48 hrs
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    From signup to Aria answering your phones, trained on your
                    business.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEMOS */}
      <section className="relative border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="mb-16 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Hear Aria in action
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl tracking-tight text-foreground leading-tight">
              Three real calls. Three different situations.{" "}
              <span className="italic text-muted-foreground">
                One AI handling all of them.
              </span>
            </h2>
          </div>

          <div className="space-y-12">
            {calls.map((call, idx) => (
              <article
                key={call.id}
                className="grid lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-white/5 last:border-b-0 last:pb-0"
              >
                <div className="lg:col-span-1">
                  <span className="font-serif text-4xl text-white/15 tracking-tight">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="lg:col-span-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                    {call.label} · {call.duration}
                  </p>
                  <h3 className="font-serif text-2xl text-foreground mb-3 tracking-tight">
                    {call.customer}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {call.summary}
                  </p>
                </div>
                <div className="lg:col-span-7 flex items-center">
                  <div className="w-full surface p-4">
                    <audio
                      controls
                      preload="metadata"
                      src={call.file}
                      className="w-full"
                      aria-label={`Demo call — ${call.label}`}
                    >
                      Your browser does not support audio playback.{" "}
                      <a
                        href={call.file}
                        className="text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Download the recording
                      </a>
                    </audio>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="mb-16 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
              What you get
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl tracking-tight text-foreground leading-tight">
              A full receptionist.{" "}
              <span className="italic text-muted-foreground">
                Without the salary.
              </span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12">
            {features.map((f, idx) => (
              <div key={idx} className="border-t border-white/10 pt-6">
                <p className="font-mono text-xs text-muted-foreground mb-3">
                  {String(idx + 1).padStart(2, "0")}
                </p>
                <h3 className="font-serif text-xl text-foreground mb-3 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="relative border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Pricing
              </p>
              <h2 className="font-serif text-4xl lg:text-5xl tracking-tight text-foreground leading-tight mb-6">
                Simple.{" "}
                <span className="italic text-muted-foreground">
                  No contracts.
                </span>
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                One-time setup covers Aria&apos;s configuration for your specific
                business. Monthly is flat — no per-minute fees, no per-call
                charges, no surprises.
              </p>
            </div>

            <div className="lg:col-span-7 lg:pl-10 lg:border-l lg:border-white/5">
              <div className="space-y-8">
                <div className="flex items-baseline justify-between border-b border-white/5 pb-6">
                  <div>
                    <p className="font-serif text-3xl text-foreground mb-1 tracking-tight">
                      Setup
                    </p>
                    <p className="text-sm text-muted-foreground">
                      One-time. Aria configured for your business in 48 hours.
                    </p>
                  </div>
                  <p className="font-serif text-5xl text-foreground tracking-tight">
                    $497
                  </p>
                </div>

                <div className="flex items-baseline justify-between border-b border-white/5 pb-6">
                  <div>
                    <p className="font-serif text-3xl text-foreground mb-1 tracking-tight">
                      Monthly
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Unlimited calls. Dashboard included. Cancel anytime.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-5xl text-foreground tracking-tight">
                      $397
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">/month</p>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={SIGNUP_URL}
                    className="btn-primary group inline-flex items-center justify-center w-full sm:w-auto"
                  >
                    Book a call to get started
                    <svg
                      className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </a>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Or try the demo first: call{" "}
                    <a
                      href={`tel:${DEMO_PHONE_TEL}`}
                      className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                    >
                      {DEMO_PHONE}
                    </a>{" "}
                    and see how Aria works.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28 text-center">
          <h2 className="font-serif text-4xl lg:text-6xl tracking-tight text-foreground leading-tight mb-8 max-w-3xl mx-auto">
            The next call you miss{" "}
            <span className="italic text-muted-foreground">
              is a customer your competitor gets.
            </span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={`tel:${DEMO_PHONE_TEL}`}
              className="btn-primary inline-flex items-center justify-center"
            >
              Call the demo — {DEMO_PHONE}
            </a>
            <a
              href={SIGNUP_URL}
              className="btn-secondary inline-flex items-center justify-center"
            >
              Book a call to get started
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative">
        <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-serif text-xl text-foreground mb-1 tracking-tight">
              Oxphi
            </p>
            <p className="text-sm text-muted-foreground">
              AI receptionist for home services. Built in Houston.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-muted-foreground">
            <a
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </a>
            <a
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <a
              href="mailto:support@oxphi.io"
              className="hover:text-foreground transition-colors"
            >
              support@oxphi.io
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

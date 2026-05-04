import { cookies } from "next/headers";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Brain,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Mic,
  PhoneCall,
  PlayCircle,
  Sparkles,
  Star,
} from "lucide-react";

const FEATURES = [
  {
    icon: PhoneCall,
    title: "Never Miss a Call",
    body:
      "Oxphi answers every inbound call 24/7 — nights, weekends, during the rush. No voicemails, no lost leads.",
  },
  {
    icon: FileText,
    title: "Instant Call Summaries",
    body:
      "Every conversation is transcribed and summarized automatically so your team can skim the outcome in seconds.",
  },
  {
    icon: Brain,
    title: "Lead Scoring",
    body:
      "Hot, warm, and cold leads ranked 0–100 out of the box. Prioritize follow-ups by intent signal, not gut feeling.",
  },
  {
    icon: Building2,
    title: "Multi-Business Support",
    body:
      "Run multiple locations or brands from one Oxphi account, each with its own agent, branding, and routing.",
  },
  {
    icon: Mic,
    title: "Call Recordings",
    body:
      "Audio of every call stored securely — play back the exact moment a booking happened or a deal stalled.",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    body:
      "Email + Slack alerts the instant a call wraps, with caller info, outcome, and lead temperature in one tap.",
  },
];

type Tier = {
  id: "starter" | "pro" | "enterprise";
  name: string;
  price: string;
  tagline: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    tagline: "For small teams getting started.",
    features: [
      "100 included calls / month",
      "$0.50 per extra call",
      "Email notifications",
      "Call summaries & recordings",
      "Standard support",
    ],
    cta: "Start with Starter",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$149",
    tagline: "For growing businesses with higher call volume.",
    features: [
      "500 included calls / month",
      "$0.35 per extra call",
      "Email + Slack notifications",
      "Advanced lead scoring",
      "Priority support",
    ],
    cta: "Go Pro",
    featured: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$399",
    tagline: "For high-volume teams with enterprise needs.",
    features: [
      "2,000 included calls / month",
      "$0.25 per extra call",
      "Multi-location routing",
      "SSO & custom integrations",
      "Dedicated success manager",
    ],
    cta: "Talk to sales",
  },
];

const TESTIMONIALS = [
  {
    name: "Carla Reyes",
    role: "Owner, Aurora Med Spa",
    quote:
      "Oxphi books appointments while I'm treating clients. Our no-show rate dropped because callers get real-time confirmations — and I stopped dreading the after-hours voicemails.",
    stat: "3× more bookings after 5pm",
  },
  {
    name: "Marco Bellini",
    role: "General Manager, Tavola Pasta House",
    quote:
      "Friday-night reservations used to ring out. Now Oxphi answers the 14th call at the same time it answers the first. The lead scoring tells me which party wants a full buyout vs. a two-top.",
    stat: "Zero missed reservations in 60 days",
  },
  {
    name: "Dr. Priya Shah",
    role: "Lead Dentist, Elmwood Family Dental",
    quote:
      "The Slack alerts are the killer feature. My front desk sees a 'Hot' lead hit the channel and follows up in 30 seconds. Oxphi feels like a second receptionist that never takes lunch.",
    stat: "42% faster callback time",
  },
];

const FAQS = [
  {
    q: "How does Oxphi answer my calls?",
    a: "Forward your business number (or port it in) to the Oxphi AI agent we provision for you. Callers are greeted by a natural-sounding voice trained on your services, hours, and booking rules — no IVR tree, no hold music.",
  },
  {
    q: "Can Oxphi actually book appointments?",
    a: "Yes. Oxphi integrates with common scheduling tools and can capture preferred date/time during the call, mark the appointment as booked, and send a confirmation email to the caller on the spot.",
  },
  {
    q: "What about phone numbers — do I need a new one?",
    a: "No. Keep your existing business line. Most customers set up a simple call-forwarding rule so Oxphi only answers when you can't, or takes every call while you focus on the work in front of you.",
  },
  {
    q: "How accurate is the lead scoring?",
    a: "Every call is scored 0–100 using signals from the conversation — outcome, contact details, scheduling intent, and success markers — and bucketed into Hot, Warm, or Cold. The logic is transparent and you can audit the score on every call page.",
  },
  {
    q: "How do I cancel or change plans?",
    a: "Upgrade, downgrade, or cancel from your billing page at any time. Billing is month-to-month on Starter and Pro, with no long-term contract.",
  },
];

function GradientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[140px]" />
      <div className="absolute -bottom-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-[140px]" />
      <div className="absolute left-[-10%] top-1/3 h-[440px] w-[440px] rounded-full bg-indigo-400/10 blur-[140px]" />
    </div>
  );
}

function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0b10]/70 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/landing" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight">Oxphi</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="transition hover:text-foreground">
            Pricing
          </a>
          <a href="#testimonials" className="transition hover:text-foreground">
            Customers
          </a>
          <a href="#faq" className="transition hover:text-foreground">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-b from-indigo-500 to-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-indigo-500"
          >
            Start free
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <GradientBackdrop />
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-20 pt-20 text-center md:px-8 md:pb-32 md:pt-32">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Live for beta customers
        </div>

        <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Your Front Desk,{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-sky-300 bg-clip-text text-transparent">
            Always On
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
          Oxphi answers every call, books appointments 24/7, and turns conversations
          into qualified leads — so you never miss another customer.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-indigo-500"
          >
            Start Free Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-foreground transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <PlayCircle className="h-4 w-4" />
            Watch Demo
          </a>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-indigo-400" />
            No credit card required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-indigo-400" />
            Cancel anytime
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-indigo-400" />
            Setup in minutes
          </span>
        </div>

        {/* Product preview placeholder card */}
        <div className="relative mt-16 w-full max-w-5xl">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-indigo-500/20 via-indigo-500/5 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#10121a]">
            <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-[11px] text-muted-foreground">
                oxphi.app · Dashboard
              </span>
            </div>
            <div id="demo" className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4">
              <div className="surface p-4 md:col-span-1">
                <div className="text-xs text-muted-foreground">Calls today</div>
                <div className="mt-1 text-2xl font-semibold">128</div>
                <div className="mt-1 text-xs text-emerald-300">+42% vs. yesterday</div>
              </div>
              <div className="surface p-4 md:col-span-1">
                <div className="text-xs text-muted-foreground">Booked</div>
                <div className="mt-1 text-2xl font-semibold">37</div>
                <div className="mt-1 text-xs text-emerald-300">29% conversion</div>
              </div>
              <div className="surface p-4 md:col-span-2">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Latest call · Carla R.</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/25 bg-orange-400/10 px-2 py-0.5 text-[10px] font-medium text-orange-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                    Hot · 92
                  </span>
                </div>
                <div className="text-sm">
                  Booked a deep-cleaning for Thursday 3 PM. Asked about
                  whitening add-on.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-medium uppercase tracking-wider text-indigo-300">
            Everything your front desk wishes it had
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built to capture every caller, not just the easy ones.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Oxphi handles the parts of customer intake that are tedious, expensive,
            or impossible at 2 AM — and feeds your team clean data the moment a call ends.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="surface group p-6 transition hover:-translate-y-0.5 hover:border-indigo-400/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 text-indigo-300 ring-1 ring-inset ring-indigo-500/20 transition group-hover:from-indigo-500/30">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing({ loggedIn }: { loggedIn: boolean }) {
  const planHref = (id: Tier["id"]) =>
    loggedIn ? `/billing?checkout=${id}` : `/signup?plan=${id}`;
  return (
    <section id="pricing" className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-medium uppercase tracking-wider text-indigo-300">
            Simple, usage-friendly pricing
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Pick a plan that fits your call volume.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Every plan includes full lead scoring, summaries, recordings, and
            integrations. Upgrade or cancel anytime from your billing page.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={[
                "relative flex flex-col rounded-xl border p-7 transition",
                tier.featured
                  ? "border-indigo-500/40 bg-gradient-to-b from-indigo-500/[0.06] to-[#10121a] shadow-xl shadow-indigo-500/10"
                  : "border-white/5 bg-[#10121a] hover:border-white/10",
              ].join(" ")}
            >
              {tier.featured ? (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-0.5 text-[10px] font-medium uppercase tracking-wider text-indigo-200">
                  Most popular
                </span>
              ) : null}

              <div className="text-sm font-medium text-muted-foreground">
                {tier.name}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">
                  {tier.price}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{tier.tagline}</p>

              <ul className="mt-6 space-y-2.5 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-white/5">
                <Link
                  href={planHref(tier.id)}
                  className={[
                    "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition",
                    tier.featured
                      ? "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-indigo-500"
                      : "border border-white/10 bg-white/[0.03] text-foreground hover:border-white/20 hover:bg-white/[0.06]",
                  ].join(" ")}
                >
                  {tier.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices in USD. Billing is month-to-month — no contracts, no setup fees.
        </p>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-medium uppercase tracking-wider text-indigo-300">
            Loved by local businesses
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            The front desk that pays for itself in a week.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex h-full flex-col rounded-xl border border-white/5 bg-[#10121a] p-7 transition hover:border-white/10"
            >
              <div className="mb-4 flex items-center gap-0.5 text-amber-300">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                “{t.quote}”
              </blockquote>
              <div className="mt-6 flex items-start justify-between gap-3 border-t border-white/5 pt-4">
                <figcaption>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </figcaption>
                <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-200">
                  {t.stat}
                </span>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-3xl px-4 py-20 md:px-8 md:py-28">
        <div className="text-center">
          <div className="text-xs font-medium uppercase tracking-wider text-indigo-300">
            Frequently asked questions
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to know.
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((item, idx) => (
            <details
              key={item.q}
              open={idx === 0}
              className="group rounded-xl border border-white/5 bg-[#10121a] p-5 transition hover:border-white/10 open:border-indigo-400/20"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-foreground">
                {item.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180 group-open:text-indigo-300" />
              </summary>
              <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-[#10121a] to-[#10121a] p-10 md:p-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Stop losing calls. Start winning customers.
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Spin up an Oxphi receptionist in under five minutes. Your first
              hundred calls are on us.
            </p>
            <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-indigo-500"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-foreground transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 md:flex-row md:items-start md:justify-between md:px-8">
        <div className="max-w-sm">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight">Oxphi</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            The always-on front desk that answers every call, books the
            appointment, and scores the lead — so your team can focus on the
            work that matters.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:min-w-[560px]">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Product
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="#features"
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Account
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  Sign up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Company
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="#testimonials"
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  Customers
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@oxphi.com"
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Legal
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <div>© {new Date().getFullYear()} Oxphi. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/terms" className="transition hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/privacy" className="transition hover:text-foreground">
              Privacy Policy
            </Link>
            <a
              href="mailto:support@oxphi.com"
              className="transition hover:text-foreground"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default async function LandingPage() {
  // The login cookie is httpOnly, so we inspect it server-side to decide
  // whether pricing CTAs should route to /signup (anonymous) or straight to
  // Stripe checkout via /billing (already authenticated).
  const cookieStore = await cookies();
  const loggedIn = Boolean(cookieStore.get("client_api_key")?.value?.trim());

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0b10] text-foreground">
      <NavBar />
      <Hero />
      <Features />
      <Pricing loggedIn={loggedIn} />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

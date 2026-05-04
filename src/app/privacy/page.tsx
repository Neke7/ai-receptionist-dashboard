import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy · Oxphi",
  description:
    "How Oxphi collects, uses, and protects information when you use our AI phone receptionist service.",
};

const LAST_UPDATED = "May 4, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0b10] text-foreground">
      <header className="border-b border-white/5">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-5 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight">Oxphi</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to home</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-12 md:px-8 md:py-16">
        <div className="mb-10">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="space-y-10 text-[15px] leading-7 text-foreground/90">
          <Section id="introduction" title="1. Introduction">
            <p>
              Oxphi (&ldquo;Oxphi,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
              or &ldquo;our&rdquo;) provides an AI phone receptionist that
              answers inbound calls for home services businesses such as HVAC,
              plumbing, electrical, and roofing companies. This Privacy Policy
              explains what information we collect, how we use it, who we
              share it with, and the rights you have over it.
            </p>
            <p>
              This policy applies to two groups of people:
            </p>
            <ul>
              <li>
                <strong>Customers</strong> &mdash; the business owners and
                authorized users who sign up for an Oxphi account and use our
                dashboard.
              </li>
              <li>
                <strong>Callers</strong> &mdash; the end users who phone a
                number powered by Oxphi and speak with one of our customers&rsquo;
                AI agents.
              </li>
            </ul>
            <p>
              When we use the Service to handle calls on behalf of a Customer,
              the Customer is the controller of the resulting call data and
              Oxphi is the processor. Callers with privacy questions about a
              specific business should contact that business directly.
            </p>
          </Section>

          <Section
            id="information-we-collect"
            title="2. Information We Collect"
          >
            <h3 className="mt-2 text-base font-semibold text-foreground">
              From Customers
            </h3>
            <p>
              When you create an Oxphi account or use the dashboard, we
              collect:
            </p>
            <ul>
              <li>
                <strong>Account information</strong> &mdash; your name, email
                address, phone number, and password.
              </li>
              <li>
                <strong>Business information</strong> &mdash; your company
                name, business type, service area, agent configuration, and
                routing preferences.
              </li>
              <li>
                <strong>Billing information</strong> &mdash; payment method
                details (handled by our payment processor), billing address,
                plan, and invoice history.
              </li>
              <li>
                <strong>Usage data</strong> &mdash; pages viewed, features
                used, IP address, browser, device, and approximate location
                derived from your IP.
              </li>
              <li>
                <strong>Support communications</strong> &mdash; messages you
                send to <a href="mailto:support@oxphi.com">support@oxphi.com</a>{" "}
                or through other support channels.
              </li>
            </ul>

            <h3 className="mt-6 text-base font-semibold text-foreground">
              About Callers
            </h3>
            <p>
              When someone calls a phone number powered by Oxphi, the Service
              processes the conversation and may collect:
            </p>
            <ul>
              <li>
                <strong>Voice recordings</strong> of the call from the moment
                the AI agent answers.
              </li>
              <li>
                <strong>Transcripts</strong> &mdash; written, time-coded
                versions of the recording.
              </li>
              <li>
                <strong>Caller identifiers</strong> &mdash; the inbound phone
                number, and any name the caller provides.
              </li>
              <li>
                <strong>Service-related details</strong> the caller shares
                during the conversation, including the address where service
                is needed, the nature of the issue (for example, a leaking
                water heater), preferred appointment times, and any other
                information offered.
              </li>
              <li>
                <strong>Call metadata</strong> &mdash; start and end time,
                duration, call outcome, and AI-generated lead score and
                summary.
              </li>
            </ul>
            <p>
              We do not knowingly request, store, or process payment card
              numbers, Social Security numbers, or other sensitive financial
              identifiers from callers. If a caller volunteers that
              information unprompted, we recommend you redact it from
              transcripts after the fact.
            </p>
          </Section>

          <Section id="how-we-collect" title="3. How We Collect Information">
            <ul>
              <li>
                <strong>Directly from Customers</strong> when you sign up,
                configure your agent, update billing details, or contact
                support.
              </li>
              <li>
                <strong>Automatically through phone calls</strong> &mdash; our
                telephony layer captures audio and metadata for every inbound
                call answered by your AI agent.
              </li>
              <li>
                <strong>Automatically through the dashboard</strong> &mdash; we
                use cookies and similar technologies to keep you logged in,
                remember your preferences, and measure how the dashboard is
                used.
              </li>
            </ul>
          </Section>

          <Section id="how-we-use" title="4. How We Use Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>
                Operate the Service &mdash; answer calls, transcribe and
                summarize them, score leads, and route the result to your
                dispatch destinations.
              </li>
              <li>
                Improve AI accuracy &mdash; tune and evaluate prompts, models,
                and lead-scoring logic so future calls are handled better.
              </li>
              <li>
                Bill you &mdash; calculate included calls, overages, and
                process payments through our payment processor.
              </li>
              <li>
                Provide customer support and respond to your questions.
              </li>
              <li>
                Maintain security &mdash; detect and prevent fraud, abuse,
                spam, and unauthorized access.
              </li>
              <li>
                Meet legal obligations &mdash; comply with applicable law,
                legal process, and enforce our{" "}
                <Link href="/terms">Terms of Service</Link>.
              </li>
              <li>
                Communicate with Customers about product updates, service
                changes, and (where you have opted in) marketing.
              </li>
            </ul>
            <p>
              We do not use call recordings or transcripts to train
              general-purpose AI models that would be made available to other
              customers or to the public.
            </p>
          </Section>

          <Section id="recording" title="5. Call Recording Disclosure">
            <p>
              <strong>Every call answered by Oxphi is recorded and
              transcribed.</strong> This is a core part of how the Service
              works &mdash; without recording, we cannot transcribe, summarize,
              or score leads.
            </p>
            <ul>
              <li>
                A recording disclosure is played as part of the standard agent
                greeting at the start of every call.
              </li>
              <li>
                The United States has a mix of one-party and two-party (or
                &ldquo;all-party&rdquo;) consent states. In two-party consent
                jurisdictions, all parties on the call must be informed before
                a recording begins.
              </li>
              <li>
                <strong>Customers</strong> are responsible for compliance with
                the recording consent laws that apply to their business and
                their callers. If you operate across state lines, take calls
                from outside the United States, or modify the standard agent
                greeting, you are responsible for ensuring lawful disclosure
                by other means.
              </li>
              <li>
                If a caller asks the agent not to record the call, the agent
                will explain that recording is part of how the Service works
                and the caller may end the call.
              </li>
            </ul>
          </Section>

          <Section id="sharing" title="6. Sharing of Information">
            <h3 className="mt-2 text-base font-semibold text-foreground">
              With our service providers
            </h3>
            <p>
              We share information with the third parties that help us
              deliver the Service, including:
            </p>
            <ul>
              <li>
                <strong>Retell AI</strong> &mdash; voice agent runtime and
                orchestration.
              </li>
              <li>
                <strong>Twilio</strong> &mdash; phone numbers, telephony, and
                call routing.
              </li>
              <li>
                <strong>OpenAI and Anthropic</strong> &mdash; language models
                used to power conversation, summarization, and lead scoring.
              </li>
              <li>
                Cloud hosting, payment processing, email delivery, error
                monitoring, and analytics providers we use to run the Service.
              </li>
            </ul>
            <p>
              These providers act under written agreements that limit how
              they may use the information we share with them.
            </p>

            <h3 className="mt-6 text-base font-semibold text-foreground">
              With the Customer
            </h3>
            <p>
              Call recordings, transcripts, summaries, lead scores, and
              caller-provided details are shared with the Customer who owns
              the phone number that received the call. The Customer can view
              and export this data through the Oxphi dashboard. If you are a
              caller and want to know how the business uses your information,
              please contact the business directly.
            </p>

            <h3 className="mt-6 text-base font-semibold text-foreground">
              For legal reasons
            </h3>
            <p>
              We may disclose information if we believe in good faith that
              disclosure is required to comply with a subpoena, court order,
              or other legal process; to cooperate with law enforcement; to
              enforce our Terms of Service; or to protect the rights,
              property, or safety of Oxphi, our customers, or the public.
            </p>

            <h3 className="mt-6 text-base font-semibold text-foreground">
              What we never do
            </h3>
            <p>
              We do not sell personal information to third parties, and we do
              not share call recordings, transcripts, or caller details with
              third-party advertisers or data brokers for marketing purposes.
            </p>
          </Section>

          <Section id="retention" title="7. Data Retention">
            <p>
              We retain Customer account information and call data for the
              duration of the Customer&rsquo;s subscription and for a
              reasonable archival period after cancellation, so that records
              remain available for billing reconciliation, dispute resolution,
              and legal compliance.
            </p>
            <p>
              Customers may request earlier deletion of specific call
              recordings or transcripts, or of their account in full, by
              emailing{" "}
              <a href="mailto:support@oxphi.com">support@oxphi.com</a>. We
              will honor verifiable deletion requests subject to any
              overriding legal retention obligation.
            </p>
          </Section>

          <Section id="security" title="8. Data Security">
            <p>
              We protect information using industry-standard practices,
              including:
            </p>
            <ul>
              <li>
                Encryption of data in transit (TLS) between your browser, our
                servers, and our service providers.
              </li>
              <li>
                Encryption at rest for call recordings, transcripts, and
                account data stored in our infrastructure.
              </li>
              <li>
                Role-based access controls so that only authorized personnel
                can access production systems.
              </li>
              <li>
                Logging and monitoring to detect unusual activity, and a
                process for responding to suspected security incidents.
              </li>
            </ul>
            <p>
              No system is perfectly secure. If you become aware of a
              potential security issue, please report it to{" "}
              <a href="mailto:support@oxphi.com">support@oxphi.com</a> so we
              can investigate.
            </p>
          </Section>

          <Section id="rights" title="9. Your Rights">
            <p>
              Depending on where you live, you may have the right to:
            </p>
            <ul>
              <li>
                Access the personal information we hold about you and receive
                a copy of it.
              </li>
              <li>Correct information that is inaccurate or out of date.</li>
              <li>
                Delete your information, subject to limited exceptions (for
                example, where we must keep records for legal or accounting
                reasons).
              </li>
              <li>
                Receive your information in a portable, machine-readable
                format.
              </li>
              <li>
                Object to or restrict certain types of processing, where
                applicable.
              </li>
            </ul>
            <p>
              <strong>California residents</strong> have additional rights
              under the California Consumer Privacy Act (CCPA), including the
              right to know what categories of personal information we
              collect, the right to delete that information, and the right
              not to be discriminated against for exercising those rights.
            </p>
            <p>
              <strong>Residents of the European Economic Area, the United
              Kingdom, and Switzerland</strong> have rights under the GDPR
              and similar laws, including the right to lodge a complaint with
              your local supervisory authority.
            </p>
            <p>
              To exercise any of these rights, email{" "}
              <a href="mailto:support@oxphi.com">support@oxphi.com</a>. If
              you are a caller, you generally need to direct your request to
              the business that operates the phone number you called &mdash;
              they are the controller of that data.
            </p>
          </Section>

          <Section id="children" title="10. Children's Privacy">
            <p>
              The Service is intended for businesses and is not directed at
              children under the age of 13. We do not knowingly collect
              personal information from children. If you believe a child has
              provided personal information to us, please contact{" "}
              <a href="mailto:support@oxphi.com">support@oxphi.com</a> and we
              will take steps to delete it.
            </p>
          </Section>

          <Section
            id="international"
            title="11. International Data Transfers"
          >
            <p>
              Oxphi is based in the United States, and our infrastructure and
              service providers are primarily located in the United States.
              If you access the Service from outside the United States, you
              understand that your information will be processed in the
              United States, which may have data protection rules that differ
              from those of your home country. By using the Service, you
              consent to that processing.
            </p>
          </Section>

          <Section id="changes" title="12. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we
              make material changes, we will update the &ldquo;Last
              updated&rdquo; date at the top of this page and notify active
              Customers through email or an in-product message. Your
              continued use of the Service after the effective date means you
              accept the updated policy.
            </p>
          </Section>

          <Section id="contact" title="13. How to Contact Us">
            <p>
              Questions, requests, or concerns about this Privacy Policy or
              your information? Email us at{" "}
              <a href="mailto:support@oxphi.com">support@oxphi.com</a>.
            </p>
          </Section>
        </div>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <div>© {new Date().getFullYear()} Oxphi. All rights reserved.</div>
          <div className="flex items-center gap-4">
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
      </footer>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
        {title}
      </h2>
      <div className="prose-block mt-4 space-y-4 text-foreground/85 [&_a]:text-indigo-400 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-indigo-300 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:text-foreground/85">
        {children}
      </div>
    </section>
  );
}

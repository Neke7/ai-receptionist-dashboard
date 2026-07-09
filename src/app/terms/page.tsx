import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service · Oxphi",
  description:
    "The terms governing your use of Oxphi's AI phone receptionist service.",
};

const LAST_UPDATED = "May 7, 2026";

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="space-y-10 text-[15px] leading-7 text-foreground/90">
          <section>
            <p>
              These Terms of Service (the &ldquo;Terms&rdquo;) are an agreement
              between you and Oxphi (&ldquo;Oxphi,&rdquo; &ldquo;we,&rdquo;
              &ldquo;us,&rdquo; or &ldquo;our&rdquo;) and govern your access to
              and use of the Oxphi AI phone receptionist service, including our
              website, dashboard, APIs, and related software (collectively, the
              &ldquo;Service&rdquo;). Please read them carefully.
            </p>
          </section>

          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>
              By accepting these Terms (including by signing an order form or
              using the Service in any way), you agree to be bound by these
              Terms. If you do not agree, you may not use the Service. If you
              are using the Service on behalf of a business, you represent that
              you have the authority to bind that business to these Terms, and
              references to &ldquo;you&rdquo; include that business.
            </p>
          </Section>

          <Section id="service" title="2. Description of Service">
            <p>
              Oxphi provides an AI phone receptionist designed for home
              services businesses, including HVAC, plumbing, electrical, and
              roofing companies. The Service answers inbound phone calls on
              your behalf using a configured AI agent, captures caller
              information, transcribes and summarizes the conversation, scores
              the lead, and routes the result to your dispatch team or other
              destinations you configure.
            </p>
            <p>
              The exact features available to you depend on the service tier
              or plan defined in your agreement and any custom configuration we
              have agreed to in writing.
            </p>
          </Section>

          <Section id="eligibility" title="3. Eligibility">
            <p>
              You must be at least 18 years old and the owner of, or an
              authorized representative for, a legitimate business in order to
              use the Service. The Service is not intended for personal,
              consumer, or household use, and we may suspend accounts that
              appear to be used for those purposes.
            </p>
          </Section>

          <Section
            id="account"
            title="4. Account Registration and Security"
          >
            <p>
              Oxphi accounts are not self-serve. We provision accounts after a
              sales and onboarding process and issue access credentials (such
              as an API key) directly to the customer. You are responsible for:
            </p>
            <ul>
              <li>Keeping your access credentials confidential.</li>
              <li>
                All activity that takes place through your account, including
                actions taken by your employees, contractors, or anyone you
                give access to.
              </li>
              <li>
                Notifying us promptly at{" "}
                <a href="mailto:support@oxphi.io">support@oxphi.io</a> if you
                suspect your credentials have been compromised or your account
                has been used without authorization.
              </li>
              <li>
                Ensuring that the person setting up the account is at least 18
                years old and authorized to act on behalf of the business.
              </li>
            </ul>
          </Section>

          <Section id="acceptable-use" title="5. Acceptable Use Policy">
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>
                Violate any law, regulation, or third-party right, including
                telemarketing, robocalling, and consumer protection laws such
                as the TCPA.
              </li>
              <li>
                Place outbound calls, send messages, or otherwise initiate
                contact in a way that constitutes spam, harassment, or
                deception.
              </li>
              <li>
                Impersonate another person or business, or misrepresent the
                identity, role, or capabilities of the AI agent in a way that
                could mislead callers.
              </li>
              <li>
                Attempt to manipulate, jailbreak, reverse-engineer, or abuse
                the AI agents to produce harmful, illegal, or off-purpose
                output.
              </li>
              <li>
                Probe, scan, or test the vulnerability of the Service, or
                circumvent any security or rate-limiting mechanism.
              </li>
              <li>
                Interfere with, disrupt, or place an unreasonable load on the
                Service or its underlying infrastructure.
              </li>
            </ul>
            <p>
              We may suspend or terminate accounts that violate this policy,
              with or without notice.
            </p>
          </Section>

          <Section
            id="recording"
            title="6. Phone Recording and Consent"
          >
            <p>
              The Service records and transcribes every inbound call so that
              you can review what was said, what was promised, and how leads
              were handled. By using the Service, you acknowledge and agree to
              the following:
            </p>
            <ul>
              <li>
                Inbound calls answered by your Oxphi AI agent are recorded and
                transcribed by default. You will not be able to use the
                Service without recording enabled.
              </li>
              <li>
                Oxphi includes a recording disclosure in the standard agent
                greeting (for example, a phrase indicating that the call may
                be recorded for quality and training purposes).
              </li>
              <li>
                The United States has both one-party and two-party (or
                &ldquo;all-party&rdquo;) consent states. In two-party consent
                jurisdictions, every party on the call must be informed before
                a recording begins.
              </li>
              <li>
                <strong>You</strong> are solely responsible for determining
                which recording consent laws apply to your business and your
                callers, and for any additional disclosures required by your
                jurisdiction. This includes situations where you operate
                across state lines or take calls from regions outside the
                United States.
              </li>
              <li>
                If you change the agent greeting in a way that removes or
                obscures the standard recording disclosure, you assume full
                responsibility for ensuring lawful disclosure by other means.
              </li>
            </ul>
            <p>
              Oxphi does not provide legal advice. If you are unsure how
              recording consent laws apply to your business, consult qualified
              counsel before going live.
            </p>
          </Section>

          <Section
            id="billing"
            title="7. Subscription, Billing, and Cancellation"
          >
            <p>
              Pricing and payment terms are not set through the Service. The
              fees, billing frequency, term length, renewal behavior, and any
              custom commercial terms applicable to your account are set out
              in your signed service agreement, order form, or invoice with
              Oxphi (collectively, your &ldquo;Agreement&rdquo;).
            </p>
            <p>
              Setup fees are due upon signing your Agreement. Recurring fees
              are billed in advance per the Agreement. Cancellation, term
              length, and any refund treatment are governed by the Agreement.
            </p>
            <p>
              For billing questions, invoices, or to discuss changes to your
              Agreement, contact your Oxphi account manager at{" "}
              <a href="mailto:support@oxphi.io">support@oxphi.io</a>.
            </p>
          </Section>

          <Section
            id="availability"
            title="8. Service Availability and Reliability"
          >
            <p>
              We work hard to keep the Service running, but we do not
              guarantee 100% uptime. Calls are handled on a best-effort basis
              and may be affected by upstream outages, telecom routing,
              third-party AI providers, scheduled maintenance, or events
              outside our reasonable control. We may modify, suspend, or
              discontinue parts of the Service at any time, and will give
              reasonable notice for material changes that affect paying
              customers.
            </p>
          </Section>

          <Section
            id="data-ownership"
            title="9. Customer Data and Ownership"
          >
            <p>
              As between you and Oxphi, you own the data you submit or
              generate through the Service, including caller phone numbers,
              call recordings, transcripts, customer-provided addresses, and
              any other information captured during a call (collectively,
              &ldquo;Customer Data&rdquo;).
            </p>
            <p>
              Oxphi acts as a processor of Customer Data on your behalf. We
              use Customer Data to operate, maintain, secure, and improve the
              Service, and otherwise as described in our{" "}
              <Link href="/privacy">Privacy Policy</Link>. You grant us a
              limited, worldwide license to host, process, transmit, and
              display Customer Data for those purposes.
            </p>
          </Section>

          <Section id="third-party" title="10. Third-Party Services">
            <p>
              The Service is built on top of, and depends on, third-party
              providers. In particular, calls and call data may be processed
              by:
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
            </ul>
            <p>
              By using the Service, you acknowledge that audio, transcripts,
              and related metadata may be transmitted to and processed by
              these providers under their own terms and privacy policies. We
              choose providers that we believe meet reasonable standards of
              security and privacy, but we are not responsible for the acts
              or omissions of any third-party provider.
            </p>
          </Section>

          <Section
            id="disclaimers"
            title="11. Disclaimers and Limitation of Liability"
          >
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as
              available,&rdquo; without warranties of any kind, whether
              express, implied, or statutory, including warranties of
              merchantability, fitness for a particular purpose,
              non-infringement, accuracy of AI-generated output, or
              uninterrupted operation. AI agents can and do make mistakes.
              You are responsible for reviewing AI output before relying on
              it for dispatching, billing, or any other business decision.
            </p>
            <p>
              To the maximum extent permitted by law, Oxphi and its
              affiliates, officers, employees, and suppliers will not be
              liable for any indirect, incidental, special, consequential,
              exemplary, or punitive damages, or for lost profits, lost
              revenue, lost data, or business interruption, arising out of or
              relating to the Service, even if advised of the possibility of
              such damages. Our aggregate liability for any claim arising
              out of or relating to these Terms or the Service will not
              exceed the fees you paid to Oxphi in the twelve (12) months
              immediately preceding the event giving rise to the claim.
            </p>
          </Section>

          <Section id="indemnification" title="12. Indemnification">
            <p>
              You agree to defend, indemnify, and hold harmless Oxphi and its
              affiliates from and against any claims, damages, liabilities,
              and expenses (including reasonable attorneys&rsquo; fees)
              arising out of or related to: (a) your use of the Service;
              (b) your Customer Data; (c) your violation of these Terms or
              applicable law, including telephone recording, telemarketing,
              and consumer protection laws; or (d) your violation of the
              rights of any third party.
            </p>
          </Section>

          <Section id="termination" title="13. Termination">
            <p>
              You may stop using the Service at any time. We may suspend or
              terminate your access immediately if we believe you have
              violated these Terms, if continued service poses a security or
              legal risk, or if your account has been delinquent for more
              than 30 days. On termination, your right to use the Service
              ends, and we may delete your Customer Data after a reasonable
              archival period, as described in our{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>
          </Section>

          <Section id="changes" title="14. Changes to These Terms">
            <p>
              We may update these Terms from time to time. When we make
              material changes, we will update the &ldquo;Last updated&rdquo;
              date at the top of this page and notify active customers
              through email or an in-product message. Continued use of the
              Service after the effective date of the updated Terms means you
              accept the changes.
            </p>
          </Section>

          <Section id="governing-law" title="15. Governing Law">
            <p>
              These Terms are governed by the laws of the State of Texas,
              without regard to its conflict of laws rules. The exclusive
              venue for any dispute that is not subject to mandatory
              arbitration will be the state or federal courts located in
              Harris County, Texas, and you and Oxphi consent to personal
              jurisdiction in those courts.
            </p>
          </Section>

          <Section id="contact" title="16. Contact Information">
            <p>
              Questions about these Terms? Reach us at{" "}
              <a href="mailto:support@oxphi.io">support@oxphi.io</a>.
            </p>
          </Section>

          <Section id="sms" title="17. SMS/Text Messaging">
            <p>
              By opting in, you agree to receive SMS text messages related to
              the services you requested, such as appointment confirmations and
              reminders. Opt-in is optional and is not a condition of using the
              service.
            </p>
            <p>
              Message frequency varies based on your activity and appointments.
              Message and data rates may apply.
            </p>
            <p>
              You can reply STOP at any time to unsubscribe and stop receiving
              messages, or reply HELP for assistance.
            </p>
            <p>
              Your mobile information and consent are used solely to deliver the
              notifications you subscribed to, and will not be shared with or
              sold to third parties or affiliates for marketing or promotional
              purposes at any time.
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
              href="mailto:support@oxphi.io"
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

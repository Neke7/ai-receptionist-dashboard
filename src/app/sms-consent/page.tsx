'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SmsConsentPage() {
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');
    if (!phone.trim()) { setError('Please enter your mobile phone number.'); return; }
    if (!consent) { setError('Please check the box to consent to SMS notifications.'); return; }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] text-foreground">
      <main className="mx-auto w-full max-w-4xl px-4 py-12 md:px-8 md:py-16">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">SMS Notifications &amp; Consent</h1>
        <p className="mt-4 text-[15px] leading-7 text-foreground/90">
          Oxphi sends SMS text notifications to its subscribed business clients about inbound
          phone calls handled by their AI receptionist. Each message includes the caller&apos;s
          name, phone number, the nature of the call, and a link to the full call details in
          your secure Oxphi dashboard.
        </p>
        <ul className="mt-4 list-disc pl-6 text-[15px] leading-7 text-foreground/85 space-y-1">
          <li>Message frequency varies based on your call volume.</li>
          <li>Message and data rates may apply.</li>
          <li>Reply STOP to unsubscribe at any time. Reply HELP for help.</li>
          <li>No mobile information is shared with or sold to third parties or affiliates for marketing or promotional purposes at any time.</li>
        </ul>
        {submitted ? (
          <div className="mt-8 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4 text-emerald-300">
            Thanks — you&apos;re subscribed to Oxphi call notifications. Reply STOP at any time to opt out.
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground">Mobile phone number for notifications</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(832) 555-0123" className="input-base mt-1 w-full" />
            </div>
            <label className="flex items-start gap-3 text-sm text-foreground/85">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-indigo-500" />
              <span>I agree to receive SMS notifications from Oxphi about calls handled by my AI receptionist, at the phone number provided. Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help. See our <Link href="/privacy" className="text-indigo-400 underline underline-offset-4 hover:text-indigo-300">Privacy Policy</Link> and <Link href="/terms" className="text-indigo-400 underline underline-offset-4 hover:text-indigo-300">Terms</Link>.</span>
            </label>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button onClick={handleSubmit} className="btn-primary">Subscribe to notifications</button>
          </div>
        )}
      </main>
    </div>
  );
}

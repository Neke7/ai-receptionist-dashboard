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
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-gray-900">SMS Notifications &amp; Consent</h1>
      <p className="mt-4 text-gray-700">
        Oxphi sends SMS text notifications to its subscribed business clients about inbound
        phone calls handled by their AI receptionist. Each message includes the caller&apos;s
        name, phone number, the nature of the call, and a link to the full call details in
        your secure Oxphi dashboard.
      </p>
      <ul className="mt-4 list-disc pl-6 text-gray-700 space-y-1">
        <li>Message frequency varies based on your call volume.</li>
        <li>Message and data rates may apply.</li>
        <li>Reply STOP to unsubscribe at any time. Reply HELP for help.</li>
        <li>No mobile information is shared with or sold to third parties or affiliates for marketing or promotional purposes at any time.</li>
      </ul>
      {submitted ? (
        <div className="mt-8 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          Thanks — you&apos;re subscribed to Oxphi call notifications. Reply STOP at any time to opt out.
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-900">Mobile phone number for notifications</label>
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(832) 555-0123" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </div>
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            <span>I agree to receive SMS notifications from Oxphi about calls handled by my AI receptionist, at the phone number provided. Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help. See our <Link href="/privacy" className="underline">Privacy Policy</Link> and <Link href="/terms" className="underline">Terms</Link>.</span>
          </label>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button onClick={handleSubmit} className="rounded-md bg-gray-900 px-4 py-2 text-white">Subscribe to notifications</button>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarX } from "lucide-react";

import { describeBusinessTime, wallClockToUtcISO } from "@/lib/appointments";

/** The values the parent POSTs. `startTime` is already a UTC ISO instant
 *  (converted from the wall clock in the business tz); the rest are trimmed
 *  strings, `durationMin` a number or null (backend defaults when null). */
export type AppointmentInput = {
  phone: string;
  name: string;
  serviceType: string;
  serviceAddress: string;
  serviceZip: string;
  startTime: string;
  durationMin: number | null;
};

/**
 * Add form for a manual appointment. Mirrors TechnicianForm's contract:
 * self-managed field state, parent owns the request via `onSubmit`, props
 * { submitting, error, submitLabel, onCancel }. Reuses input-base, the rose
 * required *, inline field errors, the rose error banner, and btn-primary /
 * btn-secondary with a "Saving…" disabled state.
 *
 * `timeZone` is the client's business tz (from the capacity/analytics payload);
 * `tzIsFallback` is true when we couldn't resolve it and fell back to the
 * device tz — surfaced in the echoed confirmation. `calendarReady` gates
 * submit: false → not connected (show the Settings CTA); null → unknown/checking
 * (allow submit; the backend still gates).
 */
export function AppointmentForm({
  timeZone,
  tzIsFallback,
  calendarReady,
  submitting,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  timeZone: string;
  tzIsFallback: boolean;
  calendarReady: boolean | null;
  submitting: boolean;
  error: string;
  submitLabel: string;
  onSubmit: (values: AppointmentInput) => void;
  onCancel?: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [serviceZip, setServiceZip] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [duration, setDuration] = useState("");

  const [phoneError, setPhoneError] = useState("");
  const [startError, setStartError] = useState("");
  const [durationError, setDurationError] = useState("");

  const calendarBlocked = calendarReady === false;

  // Live echo of what the entered wall clock resolves to in the business tz.
  const echo = startLocal ? describeBusinessTime(startLocal, timeZone) : "";

  function submit() {
    let ok = true;

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setPhoneError("Customer phone is required.");
      ok = false;
    } else {
      setPhoneError("");
    }

    let startTime = "";
    if (!startLocal) {
      setStartError("Start date and time is required.");
      ok = false;
    } else {
      const iso = wallClockToUtcISO(startLocal, timeZone);
      if (!iso) {
        setStartError("That start time couldn't be read.");
        ok = false;
      } else {
        setStartError("");
        startTime = iso;
      }
    }

    let durationMin: number | null = null;
    if (duration.trim()) {
      const n = Number(duration);
      if (!Number.isInteger(n) || n < 15 || n > 600) {
        setDurationError("Duration must be a whole number between 15 and 600.");
        ok = false;
      } else {
        setDurationError("");
        durationMin = n;
      }
    } else {
      setDurationError("");
    }

    if (!ok) return;

    onSubmit({
      phone: trimmedPhone,
      name: name.trim(),
      serviceType: serviceType.trim(),
      serviceAddress: serviceAddress.trim(),
      serviceZip: serviceZip.trim(),
      startTime,
      durationMin,
    });
  }

  return (
    <div className="space-y-5">
      {/* Calendar preflight — block submit + point to Settings when disconnected */}
      {calendarBlocked ? (
        <div className="rounded-md border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200">
          <div className="flex items-start gap-2">
            <CalendarX className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              Your Google Calendar isn&apos;t connected. Manual appointments
              create a calendar event, so connect it first in{" "}
              <Link
                href="/settings"
                className="font-medium text-amber-100 underline underline-offset-4 hover:text-white"
              >
                Settings
              </Link>
              .
            </div>
          </div>
        </div>
      ) : null}

      {/* Phone */}
      <div className="space-y-1">
        <label htmlFor="appt-phone" className="text-sm font-medium text-foreground">
          Customer phone <span className="text-rose-400">*</span>
        </label>
        <input
          id="appt-phone"
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (phoneError) setPhoneError("");
          }}
          placeholder="(832) 555-0123"
          className="input-base"
        />
        {phoneError ? <p className="text-xs text-rose-400">{phoneError}</p> : null}
      </div>

      {/* Name */}
      <div className="space-y-1">
        <label htmlFor="appt-name" className="text-sm font-medium text-foreground">
          Customer name
        </label>
        <input
          id="appt-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jordan Reyes"
          className="input-base"
        />
      </div>

      {/* Service type + ZIP */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="appt-service"
            className="text-sm font-medium text-foreground"
          >
            Service type
          </label>
          <input
            id="appt-service"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            placeholder="e.g. AC repair"
            className="input-base"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="appt-zip"
            className="text-sm font-medium text-foreground"
          >
            Service ZIP
          </label>
          <input
            id="appt-zip"
            inputMode="numeric"
            value={serviceZip}
            onChange={(e) => setServiceZip(e.target.value)}
            placeholder="77002"
            className="input-base"
          />
        </div>
      </div>

      {/* Service address */}
      <div className="space-y-1">
        <label
          htmlFor="appt-address"
          className="text-sm font-medium text-foreground"
        >
          Service address
        </label>
        <input
          id="appt-address"
          value={serviceAddress}
          onChange={(e) => setServiceAddress(e.target.value)}
          placeholder="123 Main St, Houston, TX"
          className="input-base"
        />
      </div>

      {/* Start date + time */}
      <div className="space-y-1">
        <label
          htmlFor="appt-start"
          className="text-sm font-medium text-foreground"
        >
          Start date &amp; time <span className="text-rose-400">*</span>
        </label>
        <input
          id="appt-start"
          type="datetime-local"
          value={startLocal}
          onChange={(e) => {
            setStartLocal(e.target.value);
            if (startError) setStartError("");
          }}
          className="input-base"
        />
        {echo ? (
          <p className="text-xs text-muted-foreground">
            Books {echo}
            {tzIsFallback ? " (your device's time zone)" : ""}
          </p>
        ) : null}
        {startError ? (
          <p className="text-xs text-rose-400">{startError}</p>
        ) : null}
      </div>

      {/* Duration */}
      <div className="space-y-1">
        <label
          htmlFor="appt-duration"
          className="text-sm font-medium text-foreground"
        >
          Duration (minutes)
        </label>
        <input
          id="appt-duration"
          type="number"
          min={15}
          max={600}
          step={15}
          value={duration}
          onChange={(e) => {
            setDuration(e.target.value);
            if (durationError) setDurationError("");
          }}
          placeholder="Uses your default (usually 60)"
          className="input-base"
        />
        {durationError ? (
          <p className="text-xs text-rose-400">{durationError}</p>
        ) : null}
      </div>

      {/* Error banner + actions */}
      {error ? (
        <div className="rounded-md border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={submitting || calendarBlocked}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}

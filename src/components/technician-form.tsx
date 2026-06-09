"use client";

import { useState } from "react";

import { ChipInput, Toggle } from "@/components/form-controls";
import {
  type DayHours,
  type Technician,
  type Weekday,
  type WeeklyAvailability,
  WEEKDAYS,
  WEEKDAY_LABELS,
  availabilityToGrid,
  gridToAvailability,
} from "@/lib/technicians";

export type TechnicianInput = {
  name: string;
  phone: string;
  email: string;
  skills: string[];
  serviceAreaZips: string[];
  active: boolean;
  availabilityJson: WeeklyAvailability | null;
};

/** Seed a form from an existing technician (or blank defaults for create). */
export function technicianToInput(
  t?: Partial<Technician> | null
): TechnicianInput {
  return {
    name: t?.name ?? "",
    phone: t?.phone ?? "",
    email: t?.email ?? "",
    skills: Array.isArray(t?.skills) ? t!.skills : [],
    serviceAreaZips: Array.isArray(t?.serviceAreaZips) ? t!.serviceAreaZips : [],
    active: t?.active ?? true,
    availabilityJson: t?.availabilityJson ?? null,
  };
}

/**
 * Shared add/edit form for a technician. Manages its own field state seeded from
 * `initial`; the parent owns the request (POST or PATCH) via `onSubmit`. Remount
 * (change `key`) to reseed after an external change.
 */
export function TechnicianForm({
  initial,
  submitting,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: TechnicianInput;
  submitting: boolean;
  error: string;
  submitLabel: string;
  onSubmit: (values: TechnicianInput) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [skills, setSkills] = useState<string[]>(initial.skills);
  const [zips, setZips] = useState<string[]>(initial.serviceAreaZips);
  const [active, setActive] = useState(initial.active);
  const [grid, setGrid] = useState<Record<Weekday, DayHours>>(
    availabilityToGrid(initial.availabilityJson)
  );
  const [nameError, setNameError] = useState("");

  function setDay(d: Weekday, field: "open" | "close", value: string) {
    setGrid((g) => ({ ...g, [d]: { ...g[d], [field]: value } }));
  }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name is required.");
      return;
    }
    setNameError("");
    onSubmit({
      name: trimmed,
      phone: phone.trim(),
      email: email.trim(),
      skills,
      serviceAreaZips: zips,
      active,
      availabilityJson: gridToAvailability(grid),
    });
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <div className="space-y-1">
        <label
          htmlFor="tech-name"
          className="text-sm font-medium text-foreground"
        >
          Name <span className="text-rose-400">*</span>
        </label>
        <input
          id="tech-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError("");
          }}
          placeholder="Jordan Reyes"
          className="input-base"
        />
        {nameError ? (
          <p className="text-xs text-rose-400">{nameError}</p>
        ) : null}
      </div>

      {/* Phone + Email */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="tech-phone"
            className="text-sm font-medium text-foreground"
          >
            Phone
          </label>
          <input
            id="tech-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(832) 555-0123"
            className="input-base"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="tech-email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="tech-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jordan@example.com"
            className="input-base"
          />
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground">Skills</div>
        <ChipInput
          values={skills}
          onChange={setSkills}
          placeholder="e.g. HVAC, plumbing"
          emptyText="No skills yet."
          removeLabel="Remove skill"
        />
      </div>

      {/* Service-area ZIPs */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground">
          Service-area ZIP codes
        </div>
        <ChipInput
          values={zips}
          onChange={setZips}
          placeholder="e.g. 77002"
          emptyText="No ZIP codes yet."
          removeLabel="Remove ZIP"
        />
      </div>

      {/* Active */}
      <Toggle
        label="Active (available for dispatch)"
        checked={active}
        onChange={setActive}
      />

      {/* Weekly availability */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground">
          Weekly availability
        </div>
        <p className="text-xs text-muted-foreground">
          Leave blank to use business hours. Leave a single day blank for a day
          off.
        </p>
        <div className="space-y-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-sm text-muted-foreground">
                {WEEKDAY_LABELS[d]}
              </span>
              <input
                type="time"
                value={grid[d].open}
                onChange={(e) => setDay(d, "open", e.target.value)}
                aria-label={`${WEEKDAY_LABELS[d]} open`}
                className="input-base"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="time"
                value={grid[d].close}
                onChange={(e) => setDay(d, "close", e.target.value)}
                aria-label={`${WEEKDAY_LABELS[d]} close`}
                className="input-base"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Error + actions */}
      {error ? (
        <div className="rounded-md border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
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

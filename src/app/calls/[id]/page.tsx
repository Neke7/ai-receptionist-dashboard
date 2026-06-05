"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Mail,
  Phone,
  PhoneCall,
  Save,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/status-badge";
import { LeadScoreMeter } from "@/components/lead-temperature";
import { normalizeOutcome, type CallOutcome } from "@/lib/calls";

type TranscriptTurn = {
  role: "agent" | "user";
  content: string;
  words?: Array<{ word: string; start: number; end: number }>;
};

type CallRecord = {
  id: string;
  createdAt: string;
  retellCallId: string | null;
  agentId: string | null;

  caller_name: string | null;
  caller_phone: string | null;
  caller_email: string | null;

  intent: string | null;
  customer_type: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;

  appointment_booked: boolean | null;
  appointment_status: string | null;
  calendar_event_id: string | null;
  callback_requested: boolean | null;

  call_outcome: string | null;
  call_summary: string | null;
  call_successful: boolean | null;

  start_timestamp: string | null;
  end_timestamp: string | null;
  duration_ms: number | null;
  recording_url: string | null;

  leadScore: number | null;
  leadTemperature: "hot" | "warm" | "cold" | null;

  rawPayload?: {
    call?: {
      transcript?: string;
      transcript_object?: TranscriptTurn[];
    };
  } | null;

  customer_status?: "pending" | "contacted" | "won" | "lost" | null;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const trimmed = String(value).trim();
  if (/^\d+$/.test(trimmed)) {
    const date = new Date(Number(trimmed));
    if (!Number.isNaN(date.getTime())) return date.toLocaleString();
  }
  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) return date.toLocaleString();
  return trimmed;
}

function formatHeroSubtitle(value: string | null | undefined) {
  if (!value) return "Call details";
  const trimmed = String(value).trim();
  let date: Date | null = null;
  if (/^\d+$/.test(trimmed)) {
    const d = new Date(Number(trimmed));
    if (!Number.isNaN(d.getTime())) date = d;
  } else {
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) date = d;
  }
  if (!date) return "Call details";
  const day = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
}

function formatDuration(durationMs: number | null | undefined) {
  if (typeof durationMs !== "number" || Number.isNaN(durationMs)) return "—";
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Parse the flat-string fallback transcript into speaker turns.
 * Retell historically wrote something like:
 *   "Agent: Hello, this is Aria…\nUser: Hi, I need a tune-up…\n"
 * We split on the next "Agent:" / "User:" boundary so multi-line turns stay
 * together.
 */
function parseTranscriptString(transcript: string): TranscriptTurn[] {
  if (!transcript || typeof transcript !== "string") return [];
  const SPEAKER = /(^|\n)\s*(Agent|User)\s*:\s*/gi;
  const turns: TranscriptTurn[] = [];

  const markers: Array<{ role: "agent" | "user"; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = SPEAKER.exec(transcript)) !== null) {
    const label = m[2].toLowerCase() === "agent" ? "agent" : "user";
    markers.push({ role: label, start: m.index + m[0].length, end: 0 });
  }
  if (markers.length === 0) {
    return [{ role: "agent", content: transcript.trim() }];
  }
  for (let i = 0; i < markers.length; i++) {
    markers[i].end = i + 1 < markers.length ? markers[i + 1].start - 1 : transcript.length;
    const content = transcript.slice(markers[i].start, markers[i].end).trim();
    if (content) turns.push({ role: markers[i].role, content });
  }
  return turns;
}

/**
 * Action-bar copy button. Shows an icon at all sizes and hides the text label
 * below `sm:` so the action bar doesn't overflow narrow phone screens.
 */
function CopyButton({
  label,
  value,
  className = "btn-secondary",
  icon: Icon = Copy,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this:", value);
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={!value}
      aria-label={label}
      title={label}
      className={`${className} min-h-[40px] disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      <span className="hidden sm:inline">{copied ? "Copied!" : label}</span>
    </button>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm md:text-base text-foreground">{children}</div>
    </div>
  );
}

function FlagChip({
  label,
  value,
}: {
  label: string;
  value: boolean | null | undefined;
}) {
  const yes = value === true;
  const no = value === false;
  const dot = yes ? "bg-emerald-400" : no ? "bg-zinc-500" : "bg-zinc-600";
  const text = yes ? "Yes" : no ? "No" : "—";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1 text-xs">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{text}</span>
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2.5 cursor-pointer transition hover:bg-white/[0.04]">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border transition",
          checked
            ? "bg-indigo-500 border-indigo-400"
            : "bg-white/5 border-white/10",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition",
            checked ? "left-4" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </label>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-t-md px-4 py-3 min-h-[44px] text-sm font-medium transition border-b-2 -mb-px",
        active
          ? "border-indigo-400 text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function TranscriptView({ call }: { call: CallRecord }) {
  const turns = useMemo<TranscriptTurn[]>(() => {
    const objArr = call.rawPayload?.call?.transcript_object;
    if (Array.isArray(objArr) && objArr.length > 0) {
      return objArr.filter((t) => t && (t.role === "agent" || t.role === "user"));
    }
    const flat = call.rawPayload?.call?.transcript;
    if (typeof flat === "string" && flat.trim()) {
      return parseTranscriptString(flat);
    }
    return [];
  }, [call.rawPayload]);

  // Default collapsed; the toggle only shows when there's something to collapse.
  const [collapsed, setCollapsed] = useState(true);

  if (turns.length === 0) {
    return (
      <div className="surface p-6 md:p-10 text-center text-sm text-muted-foreground">
        No transcript is available for this call. Transcripts are generated
        automatically and may take a few moments to process.
      </div>
    );
  }

  const COLLAPSE_THRESHOLD = 3;
  const hasCollapse = turns.length > COLLAPSE_THRESHOLD;
  const visibleTurns =
    hasCollapse && collapsed ? turns.slice(0, COLLAPSE_THRESHOLD) : turns;

  return (
    <div className="surface p-4 md:p-6">
      {/* Header row: label on the left, compact toggle on the right */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Conversation transcript
        </span>
        {hasCollapse ? (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
          >
            {collapsed ? `Show all (${turns.length} turns)` : "Collapse"}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 px-2 md:px-0">
        {visibleTurns.map((turn, i) => {
          const isAgent = turn.role === "agent";
          // TODO: word-level playback sync — wire turn.words[].start/end to
          // the audio element's currentTime here when we add scrubbing.
          return (
            <div
              key={i}
              className={[
                "flex flex-col",
                isAgent ? "items-start" : "items-end",
              ].join(" ")}
            >
              <span className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                {isAgent ? "Aria" : "Caller"}
              </span>
              <div
                className={[
                  "max-w-[85%] md:max-w-[80%] rounded-2xl p-3 md:p-4 text-sm leading-relaxed",
                  isAgent
                    ? "bg-indigo-500/10 text-foreground"
                    : "bg-white/5 text-foreground",
                ].join(" ")}
              >
                {turn.content}
              </div>
            </div>
          );
        })}
      </div>

      {hasCollapse ? (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300 hover:text-indigo-200"
          >
            {collapsed ? (
              <>
                <ChevronDown className="h-4 w-4" />
                Show full transcript ({turns.length} turns)
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse transcript
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function CallDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [call, setCall] = useState<CallRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "transcript" | "notes">(
    "overview"
  );

  const [form, setForm] = useState({
    notes: "",
    appointment_booked: false,
    callback_requested: false,
    call_outcome: "unknown" as CallOutcome,
    call_successful: false,
  });

  const outcomeForBadge = useMemo(() => {
    return normalizeOutcome(call?.call_outcome ?? form.call_outcome);
  }, [call, form.call_outcome]);

  const dirty = useMemo(() => {
    if (!call) return false;
    const original: typeof form = {
      notes: call.notes ?? "",
      appointment_booked: Boolean(call.appointment_booked),
      callback_requested: Boolean(call.callback_requested),
      call_outcome: normalizeOutcome(call.call_outcome),
      call_successful: Boolean(call.call_successful),
    };
    return (
      original.notes !== form.notes ||
      original.appointment_booked !== form.appointment_booked ||
      original.callback_requested !== form.callback_requested ||
      original.call_outcome !== form.call_outcome ||
      original.call_successful !== form.call_successful
    );
  }, [call, form]);

  async function loadCall() {
    setLoading(true);
    try {
      const res = await fetch(`/api/calls/${id}`, { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/suspended");
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API /api/calls/${id} failed (${res.status}) ${text}`);
      }

      const data: CallRecord = await res.json();
      setCall(data);

      const derivedOutcome = normalizeOutcome(data.call_outcome);

      setForm({
        notes: data.notes ?? "",
        appointment_booked: Boolean(data.appointment_booked),
        callback_requested: Boolean(data.callback_requested),
        call_outcome: derivedOutcome,
        call_successful: Boolean(data.call_successful),
      });
    } catch (e) {
      console.error(e);
      alert("Could not load this call. Go back and try again.");
      router.push("/calls");
    } finally {
      setLoading(false);
    }
  }

  function setOutcome(outcome: CallOutcome) {
    if (outcome === "booked") {
      setForm((f) => ({ ...f, call_outcome: outcome, appointment_booked: true }));
      return;
    }
    if (outcome === "info_only") {
      setForm((f) => ({ ...f, call_outcome: outcome, appointment_booked: false }));
      return;
    }
    setForm((f) => ({ ...f, call_outcome: outcome }));
  }

  function toggleAppointmentBooked(checked: boolean) {
    setForm((f) => {
      const nextOutcome = checked
        ? "booked"
        : f.call_outcome === "booked"
        ? "info_only"
        : f.call_outcome;
      return { ...f, appointment_booked: checked, call_outcome: nextOutcome };
    });
  }

  async function saveChanges() {
    setSaving(true);
    try {
      const res = await fetch(`/api/calls/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: form.notes || null,
          appointment_booked: form.appointment_booked,
          callback_requested: form.callback_requested,
          call_outcome: form.call_outcome === "unknown" ? null : form.call_outcome,
          call_successful: form.call_successful,
        }),
      });

      if (res.status === 401) {
        window.location.reload();
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Save failed (${res.status}) ${text}`);
      }

      await loadCall();
    } catch (e) {
      console.error(e);
      alert("Save failed. Check backend logs.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !call) {
    return (
      <AppShell variant="client" title="Call Details">
        <div className="w-full max-w-5xl mx-auto px-4 md:px-6">
          <div className="surface p-10 text-center text-sm text-muted-foreground">
            Loading call…
          </div>
        </div>
      </AppShell>
    );
  }

  const phone = call.caller_phone?.trim() || "";
  const email = call.caller_email?.trim() || "";
  const callerName = call.caller_name?.trim() || "Unknown Caller";

  const copyDetailsBlob = [
    `Name: ${call.caller_name || "—"}`,
    `Phone: ${call.caller_phone || "—"}`,
    `Email: ${call.caller_email || "—"}`,
    `Intent: ${call.intent || "—"}`,
    `Preferred time: ${[call.preferred_date, call.preferred_time]
      .filter(Boolean)
      .join(" ") || "—"}`,
    "",
    `Summary: ${call.call_summary || "—"}`,
  ].join("\n");

  return (
    <AppShell
      variant="client"
      title={callerName}
      subtitle={formatHeroSubtitle(call.start_timestamp || call.createdAt)}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="btn-primary min-h-[40px]"
              aria-label="Call back"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call back</span>
            </a>
          ) : null}
          <CopyButton label="Copy phone" value={phone} icon={Phone} />
          <CopyButton label="Copy details" value={copyDetailsBlob} />
          <button
            onClick={saveChanges}
            disabled={saving || !dirty}
            className="btn-secondary min-h-[40px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving…" : "Save changes"}</span>
          </button>
          <button
            onClick={() => router.push("/calls")}
            className="btn-secondary min-h-[40px]"
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>
      }
    >
      <div className="w-full max-w-5xl mx-auto px-4 md:px-6">
        {/* HERO STRIP — contact / outcome / lead score */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {/* Contact cell — leads with phone now that the AppShell title carries the name */}
          <div className="w-full space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Contact
            </div>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 text-lg text-indigo-300 hover:text-indigo-200 hover:underline"
              >
                <Phone className="h-5 w-5" />
                <span className="break-all">{phone}</span>
              </a>
            ) : (
              <div className="text-base text-muted-foreground">
                No phone on file
              </div>
            )}
            {email ? (
              <div>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 text-base text-indigo-300 hover:text-indigo-200 hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  <span className="break-all">{email}</span>
                </a>
              </div>
            ) : null}
          </div>

          {/* Outcome cell */}
          <div className="w-full space-y-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Outcome
            </div>
            <div>
              <span className="scale-110 origin-left inline-block">
                <StatusBadge
                  outcome={outcomeForBadge}
                  appointmentStatus={call.appointment_status}
                />
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {call.callback_requested ? (
                <span className="badge">
                  <span className="badge-dot bg-amber-400" />
                  Callback requested
                </span>
              ) : null}
              {call.call_successful ? (
                <span className="badge">
                  <span className="badge-dot bg-emerald-400" />
                  Successful
                </span>
              ) : null}
            </div>
          </div>

          {/* Lead score cell */}
          <div className="w-full">
            <div className="surface p-4 md:p-5 w-full">
              <LeadScoreMeter
                score={call.leadScore}
                temperature={call.leadTemperature}
              />
            </div>
          </div>
        </div>

        {/* AI SUMMARY CARD */}
        <div className="surface mt-6 p-4 md:p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Summary
          </div>
          <p className="mt-2 text-sm md:text-base leading-relaxed text-foreground">
            {call.call_summary?.trim() ? (
              call.call_summary
            ) : (
              <span className="text-muted-foreground">
                No summary available for this call.
              </span>
            )}
          </p>
        </div>

        {/* TABS */}
        <div className="mt-8 border-b border-white/5">
          <div className="flex flex-wrap items-center gap-1">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </TabButton>
            <TabButton
              active={activeTab === "transcript"}
              onClick={() => setActiveTab("transcript")}
            >
              Transcript
            </TabButton>
            <TabButton
              active={activeTab === "notes"}
              onClick={() => setActiveTab("notes")}
            >
              Notes
            </TabButton>
          </div>
        </div>

        <div className="mt-6">
          {activeTab === "overview" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              {/* LEFT (mobile: first two cards) — Caller info + Intent */}
              <div className="space-y-4 md:space-y-5">
                <div className="surface p-4 md:p-6">
                  <div className="text-sm font-semibold text-foreground">
                    Caller info
                  </div>
                  <div className="mt-4 md:mt-5 space-y-4">
                    <InfoRow label="Name">{call.caller_name || "—"}</InfoRow>
                    <InfoRow label="Phone">
                      {phone ? (
                        <a
                          href={`tel:${phone}`}
                          className="text-indigo-300 hover:text-indigo-200 hover:underline break-all"
                        >
                          {phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </InfoRow>
                    <InfoRow label="Email">
                      {email ? (
                        <a
                          href={`mailto:${email}`}
                          className="text-indigo-300 hover:text-indigo-200 hover:underline break-all"
                        >
                          {email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </InfoRow>
                    <InfoRow label="Customer type">
                      {call.customer_type || "—"}
                    </InfoRow>
                  </div>
                </div>

                <div className="surface p-4 md:p-6">
                  <div className="text-sm font-semibold text-foreground">
                    Intent
                  </div>
                  <div className="mt-4 md:mt-5 space-y-4">
                    <InfoRow label="What they need">
                      {call.intent || "—"}
                    </InfoRow>
                    <InfoRow label="Preferred date">
                      {call.preferred_date || "—"}
                    </InfoRow>
                    <InfoRow label="Preferred time">
                      {call.preferred_time || "—"}
                    </InfoRow>
                  </div>
                </div>
              </div>

              {/* RIGHT (mobile: bottom two cards) — Timing + Recording */}
              <div className="space-y-4 md:space-y-5">
                <div className="surface p-4 md:p-6">
                  <div className="text-sm font-semibold text-foreground">
                    Call timing
                  </div>
                  <div className="mt-4 md:mt-5 space-y-4">
                    <InfoRow label="Started">
                      {formatDateTime(call.start_timestamp)}
                    </InfoRow>
                    <InfoRow label="Ended">
                      {formatDateTime(call.end_timestamp)}
                    </InfoRow>
                    <InfoRow label="Duration">
                      {formatDuration(call.duration_ms)}
                    </InfoRow>
                  </div>
                </div>

                <div className="surface p-4 md:p-6">
                  <div className="text-sm font-semibold text-foreground">
                    Recording
                  </div>
                  {call.recording_url ? (
                    <audio controls className="mt-4 w-full">
                      <source src={call.recording_url} />
                      Your browser does not support audio playback.
                    </audio>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No recording is available for this call.
                    </p>
                  )}

                  <div className="border-t border-border/40 pt-4 mt-4">
                    <div className="flex flex-wrap gap-2">
                      <FlagChip
                        label="Appointment booked"
                        value={call.appointment_booked}
                      />
                      <FlagChip
                        label="Callback requested"
                        value={call.callback_requested}
                      />
                      <FlagChip
                        label="Call successful"
                        value={call.call_successful}
                      />
                    </div>
                    {call.recording_url ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Edit these in the Notes tab.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "transcript" ? <TranscriptView call={call} /> : null}

          {activeTab === "notes" ? (
            <div className="surface p-4 md:p-6">
              <div className="space-y-6">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Call outcome
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                    {(
                      [
                        { key: "booked", label: "Booked" },
                        { key: "info_only", label: "Info Only" },
                        { key: "follow_up", label: "Follow up" },
                        { key: "unknown", label: "Unknown" },
                      ] as const
                    ).map((o) => {
                      const active = form.call_outcome === o.key;
                      return (
                        <button
                          key={o.key}
                          type="button"
                          onClick={() => setOutcome(o.key)}
                          className={[
                            "rounded-md border px-3 py-2 min-h-[44px] text-sm font-medium transition",
                            active
                              ? "border-indigo-400/50 bg-indigo-500/10 text-indigo-200"
                              : "border-white/5 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
                          ].join(" ")}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Flags
                  </div>
                  <div className="mt-2 flex flex-col gap-3 md:flex-row md:gap-4">
                    <div className="flex-1">
                      <Toggle
                        label="Appointment booked"
                        checked={form.appointment_booked}
                        onChange={toggleAppointmentBooked}
                      />
                    </div>
                    <div className="flex-1">
                      <Toggle
                        label="Callback requested"
                        checked={form.callback_requested}
                        onChange={(v) =>
                          setForm({ ...form, callback_requested: v })
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Toggle
                        label="Call successful"
                        checked={form.call_successful}
                        onChange={(v) =>
                          setForm({ ...form, call_successful: v })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Your notes
                  </div>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Notes from the call…"
                    rows={6}
                    className="input-base mt-2 resize-y"
                  />
                </div>

                <div className="border-t border-border/40 pt-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Customer status
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                      <span className="font-medium text-foreground">
                        {call.customer_status ?? "pending"}
                      </span>
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Tracking lead status is coming in a future update — for
                      now, use notes.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Changes save when you click &ldquo;Save changes&rdquo; at the
                  top.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

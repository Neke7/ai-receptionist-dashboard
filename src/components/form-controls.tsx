"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

/**
 * Inline switch (role="switch", indigo when on). Optional `disabled` greys it
 * for inert/locked rows. Shared by the Settings business-rules section and the
 * technician roster forms.
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={[
        "flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2.5 transition",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border transition",
          checked ? "bg-indigo-500 border-indigo-400" : "bg-white/5 border-white/10",
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

/**
 * Tag/chip editor — add on Enter or comma, case-insensitive dedup, removable
 * chips. Manages its own input state so each instance is independent. Shared by
 * emergency keywords, service-area ZIPs, technician skills, and tech ZIPs.
 */
export function ChipInput({
  values,
  onChange,
  placeholder,
  emptyText,
  removeLabel = "Remove",
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  emptyText: string;
  removeLabel?: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const v = input.trim();
    if (!v) {
      setInput("");
      return;
    }
    const exists = values.some((k) => k.toLowerCase() === v.toLowerCase());
    if (!exists) onChange([...values, v]);
    setInput("");
  }

  function remove(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {values.length === 0 ? (
          <span className="text-xs text-muted-foreground">{emptyText}</span>
        ) : (
          values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-foreground"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`${removeLabel} ${v}`}
                className="text-muted-foreground transition hover:text-rose-300"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="input-base"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
    </>
  );
}

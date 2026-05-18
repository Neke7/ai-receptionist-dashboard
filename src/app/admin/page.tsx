"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";

type ClientRecord = {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  retellAgentId: string | null;
  isSuspended?: boolean;
  createdAt?: string;
};

function maskKey(key: string): string {
  if (!key) return "—";
  if (key.length <= 10) return key;
  return `${key.slice(0, 6)}••••${key.slice(-4)}`;
}

export default function AdminPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [retellAgentId, setRetellAgentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  async function loadClients() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/clients", { cache: "no-store" });
      const text = await res.text();

      let data: unknown = [];
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `Failed to load clients (${res.status})`
        );
      }

      setClients(Array.isArray(data) ? (data as ClientRecord[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          apiKey,
          retellAgentId: retellAgentId.trim() || null,
        }),
      });

      const text = await res.text();
      let data: unknown = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `Failed to create client (${res.status})`
        );
      }

      setName("");
      setEmail("");
      setApiKey("");
      setRetellAgentId("");
      setSuccess("Client created successfully.");
      await loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegenerateApiKey(clientId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to regenerate this client's API key? The old key will stop working."
    );
    if (!confirmed) return;

    setError("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/regenerate-key`, {
        method: "POST",
      });

      const text = await res.text();
      let data: unknown = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `Failed to regenerate API key (${res.status})`
        );
      }

      await loadClients();
      setSuccess("API key regenerated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate API key");
    }
  }

  async function handleDeleteClient(clientId: string, clientName: string) {
    const confirmed = window.confirm(
      `Delete "${clientName}"?\n\nThe client will be removed, but their calls will be kept.`
    );
    if (!confirmed) return;

    setError("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/delete`, {
        method: "DELETE",
      });

      const text = await res.text();
      let data: unknown = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `Failed to delete client (${res.status})`
        );
      }

      await loadClients();
      setSuccess("Client deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete client");
    }
  }

  async function handleSuspendClient(clientId: string, clientName: string) {
    const confirmed = window.confirm(
      `Suspend ${clientName}? Aria will stop answering their calls.`
    );
    if (!confirmed) return;

    setError("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/suspend`, {
        method: "POST",
      });

      const text = await res.text();
      let data: unknown = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `Failed to suspend client (${res.status})`
        );
      }

      await loadClients();
      setSuccess("Client suspended.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suspend client");
    }
  }

  async function handleUnsuspendClient(clientId: string) {
    setError("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/unsuspend`, {
        method: "POST",
      });

      const text = await res.text();
      let data: unknown = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).error)
            : `Failed to unsuspend client (${res.status})`
        );
      }

      await loadClients();
      setSuccess("Client unsuspended.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unsuspend client");
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess("Copied to clipboard.");
      setTimeout(() => setSuccess(""), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <AppShell
      variant="admin"
      title="Clients"
      subtitle="Manage client accounts and map Retell agents to tenants."
      actions={
        <button onClick={loadClients} className="btn-secondary">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      }
    >
      {error ? (
        <div className="surface mb-5 border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="surface mb-5 border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300">
          {success}
        </div>
      ) : null}

      {/* Create client */}
      <div className="surface p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-300">
            <Plus className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold">New client</h2>
        </div>

        <form onSubmit={handleCreateClient}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Dental"
                className="input-base"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@acme.com"
                className="input-base"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                API Key
              </label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="paste client api key"
                className="input-base font-mono text-xs"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Retell Agent ID <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <input
                value={retellAgentId}
                onChange={(e) => setRetellAgentId(e.target.value)}
                placeholder="agent_..."
                className="input-base font-mono text-xs"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={submitting} className="btn-primary">
              <Plus className="h-4 w-4" />
              {submitting ? "Creating…" : "Create client"}
            </button>
          </div>
        </form>
      </div>

      {/* Clients list */}
      <div className="surface mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="text-sm font-semibold">All clients</h2>
          <span className="text-xs text-muted-foreground">
            {clients.length} total
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading clients…
          </div>
        ) : clients.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-sm font-medium">No clients yet</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Create your first client using the form above.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="surface-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>API Key</th>
                  <th>Retell Agent</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() =>
                      router.push(`/admin/calls?clientId=${client.id}`)
                    }
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/admin/calls?clientId=${client.id}`);
                      }
                    }}
                    title={`View calls for ${client.name}`}
                    className={`cursor-pointer transition hover:bg-white/[0.02] ${
                      client.isSuspended ? "opacity-60" : ""
                    }`}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{client.name}</span>
                        {client.isSuspended ? (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
                            Suspended
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="text-muted-foreground">{client.email}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {revealedKey === client.id ? client.apiKey : maskKey(client.apiKey)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedKey((cur) =>
                              cur === client.id ? null : client.id
                            )
                          }
                          className="text-xs text-muted-foreground hover:text-foreground"
                          title={revealedKey === client.id ? "Hide" : "Show"}
                        >
                          {revealedKey === client.id ? "Hide" : "Show"}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(client.apiKey)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Copy API key"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td>
                      {client.retellAgentId ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {client.retellAgentId}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          href={`/admin/clients/${client.id}/calls`}
                          className="btn-secondary"
                        >
                          View calls
                        </Link>
                        <Link
                          href={`/admin/clients/${client.id}/edit`}
                          className="btn-secondary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleRegenerateApiKey(client.id)}
                          className="btn-warn"
                          title="Regenerate API key"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Rotate key
                        </button>
                        {client.isSuspended ? (
                          <button
                            onClick={() => handleUnsuspendClient(client.id)}
                            className="btn-secondary"
                            title="Unsuspend client"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleSuspendClient(client.id, client.name)
                            }
                            className="btn-warn"
                            title="Suspend client"
                          >
                            <Pause className="h-3.5 w-3.5" />
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          className="btn-danger"
                          title="Delete client"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

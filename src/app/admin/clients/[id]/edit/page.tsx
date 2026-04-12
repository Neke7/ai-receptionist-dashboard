"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import AppShell from "@/components/layout/AppShell";

type ClientRecord = {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  retellAgentId: string | null;
  createdAt?: string;
};

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = params?.id;

  const [client, setClient] = useState<ClientRecord | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [retellAgentId, setRetellAgentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadClientListAndFindOne() {
    if (!clientId) return;

    setLoading(true);
    setError("");
    setSuccess("");

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

      const clients = Array.isArray(data) ? (data as ClientRecord[]) : [];
      const found = clients.find((c) => c.id === clientId);

      if (!found) throw new Error("Client not found");

      setClient(found);
      setName(found.name || "");
      setEmail(found.email || "");
      setRetellAgentId(found.retellAgentId || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client");
      setClient(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClientListAndFindOne();
  }, [clientId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
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
            : `Failed to update client (${res.status})`
        );
      }

      setSuccess("Client updated successfully.");

      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update client");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      variant="admin"
      title="Edit Client"
      subtitle="Update the client's name, email, and Retell Agent ID."
      actions={
        <button onClick={() => router.push("/admin")} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      }
    >
      {loading ? (
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          Loading client…
        </div>
      ) : !client ? (
        <div className="surface border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error || "Client not found"}
        </div>
      ) : (
        <div className="max-w-3xl">
          <div className="surface p-6">
            <div className="mb-5 text-xs text-muted-foreground">
              Client ID:{" "}
              <span className="font-mono text-foreground">{client.id}</span>
            </div>

            {error ? (
              <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mb-4 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-300">
                {success}
              </div>
            ) : null}

            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    API Key <span className="text-muted-foreground/60">(read-only)</span>
                  </label>
                  <input
                    value={client.apiKey}
                    disabled
                    className="input-base font-mono text-xs opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Retell Agent ID
                  </label>
                  <input
                    value={retellAgentId}
                    onChange={(e) => setRetellAgentId(e.target.value)}
                    placeholder="agent_..."
                    className="input-base font-mono text-xs"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-white/5 pt-5">
                <button
                  type="button"
                  onClick={() => router.push("/admin")}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

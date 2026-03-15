"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ClientRecord = {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  retellAgentId: string | null;
  createdAt?: string;
};

export default function AdminPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [retellAgentId, setRetellAgentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      await loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Admin</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Create clients + map Retell Agent IDs to tenants.
      </p>

      {error ? (
        <div
          style={{
            color: "crimson",
            border: "1px solid #f2c2c2",
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
          }}
        >
          Error: {error}
        </div>
      ) : null}

      <section
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Create Client
        </h2>

        <form onSubmit={handleCreateClient}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Dental"
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1px solid #ccc",
                  borderRadius: 8,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@acme.com"
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1px solid #ccc",
                  borderRadius: 8,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>API Key</label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="paste client api key"
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1px solid #ccc",
                  borderRadius: 8,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>
                Retell Agent ID (optional)
              </label>
              <input
                value={retellAgentId}
                onChange={(e) => setRetellAgentId(e.target.value)}
                placeholder="agent_..."
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1px solid #ccc",
                  borderRadius: 8,
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              border: "1px solid #111",
              borderRadius: 8,
              padding: "10px 14px",
              background: "#111",
              color: "white",
              cursor: "pointer",
            }}
          >
            {submitting ? "Creating..." : "Create Client"}
          </button>
        </form>
      </section>

      <section
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Clients</h2>

          <button
            onClick={loadClients}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "8px 12px",
              background: "white",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div>Loading clients...</div>
        ) : clients.length === 0 ? (
          <div>No clients yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", background: "#f8f8f8" }}>
                  <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Name</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Email</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>API Key</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Retell Agent ID</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #e5e5e5" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{client.name}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{client.email}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{client.apiKey}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                      {client.retellAgentId || "—"}
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                      <Link
                        href={`/admin/clients/${client.id}/calls`}
                        style={{
                          display: "inline-block",
                          border: "1px solid #111",
                          borderRadius: 8,
                          padding: "8px 12px",
                          background: "#111",
                          color: "white",
                          textDecoration: "none",
                        }}
                      >
                        View Calls
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}



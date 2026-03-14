"use client";

import { useEffect, useState } from "react";

type ClientRow = {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  retellAgentId: string | null;
  createdAt: string;
};

export default function AdminPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [retellAgentId, setRetellAgentId] = useState("");

  async function loadClients() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/clients", { cache: "no-store" });
      const text = await res.text();

      if (!res.ok) {
        setErr(`Failed to load clients (${res.status}): ${text}`);
        return;
      }

      const data = JSON.parse(text);
      setClients(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  async function createClient() {
    setErr("");
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        apiKey: apiKey.trim(),
        retellAgentId: retellAgentId.trim() || null,
      };

      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (!res.ok) {
        setErr(`Failed to create client (${res.status}): ${text}`);
        return;
      }

      // clear form + refresh list
      setName("");
      setEmail("");
      setApiKey("");
      setRetellAgentId("");
      await loadClients();
    } catch (e: any) {
      setErr(e?.message || "Failed to create client");
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 1000 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Admin</h1>
      <p style={{ opacity: 0.8 }}>
        Create clients + map Retell Agent IDs to tenants.
      </p>

      {err ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #fca5a5",
            background: "#fef2f2",
            color: "#991b1b",
            borderRadius: 8,
          }}
        >
          <b>Error:</b> {err}
        </div>
      ) : null}

      <section
        style={{
          marginTop: 18,
          padding: 16,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
          Create Client
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            maxWidth: 800,
          }}
        >
          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Dental"
              style={inputStyle}
            />
          </label>

          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@acme.com"
              style={inputStyle}
            />
          </label>

          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>API Key</div>
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="paste client api key"
              style={inputStyle}
            />
          </label>

          <label>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              Retell Agent ID (optional)
            </div>
            <input
              value={retellAgentId}
              onChange={(e) => setRetellAgentId(e.target.value)}
              placeholder="agent_..."
              style={inputStyle}
            />
          </label>
        </div>

        <button
          onClick={createClient}
          disabled={!name.trim() || !email.trim() || !apiKey.trim()}
          style={buttonStyle}
        >
          Create Client
        </button>
      </section>

      <section style={{ marginTop: 18 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Clients</h2>
          <button onClick={loadClients} style={buttonStyleSecondary}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>API Key</th>
                <th style={thStyle}>Retell Agent ID</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td style={tdStyle} colSpan={4}>
                    No clients yet.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id}>
                    <td style={tdStyle}>{c.name}</td>
                    <td style={tdStyle}>{c.email}</td>
                    <td style={tdStyle}>
                      <code>{c.apiKey}</code>
                    </td>
                    <td style={tdStyle}>
                      <code>{c.retellAgentId ?? ""}</code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  marginTop: 6,
};

const buttonStyle: React.CSSProperties = {
  marginTop: 12,
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #111827",
  background: "#111827",
  color: "white",
  cursor: "pointer",
};

const buttonStyleSecondary: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "white",
  cursor: "pointer",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "10px 8px",
  fontSize: 12,
  opacity: 0.8,
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #f3f4f6",
  padding: "10px 8px",
  verticalAlign: "top",
};



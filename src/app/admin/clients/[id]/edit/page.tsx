"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

      if (!found) {
        throw new Error("Client not found");
      }

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
        headers: {
          "Content-Type": "application/json",
        },
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
    <main style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            Edit Client
          </h1>
          <p style={{ color: "#666" }}>
            Update the client’s name, email, and Retell Agent ID.
          </p>
        </div>

        <Link
          href="/admin"
          style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: "8px 12px",
            background: "white",
            textDecoration: "none",
            color: "black",
            height: "fit-content",
          }}
        >
          Back to Admin
        </Link>
      </div>

      {loading ? (
        <div>Loading client...</div>
      ) : !client ? (
        <div
          style={{
            color: "crimson",
            border: "1px solid #f2c2c2",
            borderRadius: 8,
            padding: 12,
          }}
        >
          {error || "Client not found"}
        </div>
      ) : (
        <section
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 20,
            maxWidth: 900,
          }}
        >
          <div style={{ marginBottom: 16, color: "#666" }}>
            Client ID: {client.id}
          </div>

          {error ? (
            <div
              style={{
                color: "crimson",
                border: "1px solid #f2c2c2",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
            >
              Error: {error}
            </div>
          ) : null}

          {success ? (
            <div
              style={{
                color: "green",
                border: "1px solid #b7e3b7",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
            >
              {success}
            </div>
          ) : null}

          <form onSubmit={handleSave}>
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
                  API Key
                </label>
                <input
                  value={client.apiKey}
                  disabled
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    background: "#f7f7f7",
                    color: "#666",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6 }}>
                  Retell Agent ID
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
              disabled={saving}
              style={{
                border: "1px solid #111",
                borderRadius: 8,
                padding: "10px 14px",
                background: "#111",
                color: "white",
                cursor: "pointer",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}

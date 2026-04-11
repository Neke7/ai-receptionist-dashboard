"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ClientCallCount = {
  clientId: string;
  clientName: string;
  count: number;
};

type DayVolume = {
  date: string;
  count: number;
};

type AnalyticsData = {
  totalCalls: number;
  bookedCount: number;
  bookedRate: number;
  followUpCount: number;
  followUpRate: number;
  callsPerClient: ClientCallCount[];
  callVolumeOverTime: DayVolume[];
};

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function BarChart({ data }: { data: DayVolume[] }) {
  if (data.length === 0) {
    return (
      <div style={{ color: "#666", padding: 16 }}>
        No call volume data available.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Show last 30 days max for readability
  const displayData = data.slice(-30);

  return (
    <div style={{ overflowX: "auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 2,
          height: 200,
          minWidth: displayData.length * 28,
          padding: "0 4px",
        }}
      >
        {displayData.map((d) => {
          const heightPct = (d.count / maxCount) * 100;
          return (
            <div
              key={d.date}
              style={{
                flex: "1 0 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#333",
                  marginBottom: 2,
                }}
              >
                {d.count}
              </div>
              <div
                style={{
                  width: "100%",
                  maxWidth: 24,
                  background: "#111",
                  borderRadius: "4px 4px 0 0",
                  height: `${Math.max(heightPct, 2)}%`,
                  minHeight: 2,
                }}
              />
              <div
                style={{
                  fontSize: 9,
                  color: "#999",
                  marginTop: 4,
                  transform: "rotate(-45deg)",
                  transformOrigin: "top left",
                  whiteSpace: "nowrap",
                  width: 0,
                }}
              >
                {d.date.slice(5)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 32 }} />
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      const text = await res.text();

      let parsed: unknown = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null;
      }

      if (!res.ok) {
        throw new Error(
          typeof parsed === "object" &&
            parsed &&
            "error" in (parsed as Record<string, unknown>)
            ? String((parsed as Record<string, unknown>).error)
            : `Failed to load analytics (${res.status})`
        );
      }

      setData(parsed as AnalyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            Analytics
          </h1>
          <p style={{ color: "#666" }}>
            Overview of call performance across all clients.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={loadAnalytics}
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

          <Link
            href="/admin"
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
            Back to Admin
          </Link>
        </div>
      </div>

      {loading ? (
        <div>Loading analytics...</div>
      ) : error ? (
        <div
          style={{
            color: "crimson",
            border: "1px solid #f2c2c2",
            borderRadius: 8,
            padding: 12,
          }}
        >
          Error: {error}
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ color: "#666", marginBottom: 6 }}>Total Calls</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {data.totalCalls}
              </div>
            </div>

            <div
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ color: "#666", marginBottom: 6 }}>Booked</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {data.bookedCount}
              </div>
              <div style={{ fontSize: 14, color: "#666" }}>
                {formatPercent(data.bookedRate)} rate
              </div>
            </div>

            <div
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ color: "#666", marginBottom: 6 }}>Follow Up</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {data.followUpCount}
              </div>
              <div style={{ fontSize: 14, color: "#666" }}>
                {formatPercent(data.followUpRate)} rate
              </div>
            </div>

            <div
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ color: "#666", marginBottom: 6 }}>Clients</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {data.callsPerClient.filter((c) => c.clientId !== "unassigned").length}
              </div>
            </div>
          </div>

          {/* Call volume over time chart */}
          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <h2
              style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}
            >
              Call Volume Over Time
            </h2>
            <BarChart data={data.callVolumeOverTime} />
          </section>

          {/* Calls per client table */}
          <section
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h2
              style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}
            >
              Calls Per Client
            </h2>

            {data.callsPerClient.length === 0 ? (
              <div style={{ color: "#666" }}>No client data available.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f8f8", textAlign: "left" }}>
                      <th
                        style={{
                          padding: 12,
                          borderBottom: "1px solid #e5e5e5",
                        }}
                      >
                        Client
                      </th>
                      <th
                        style={{
                          padding: 12,
                          borderBottom: "1px solid #e5e5e5",
                        }}
                      >
                        Total Calls
                      </th>
                      <th
                        style={{
                          padding: 12,
                          borderBottom: "1px solid #e5e5e5",
                          width: "50%",
                        }}
                      >
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.callsPerClient]
                      .sort((a, b) => b.count - a.count)
                      .map((client) => {
                        const pct =
                          data.totalCalls > 0
                            ? (client.count / data.totalCalls) * 100
                            : 0;
                        return (
                          <tr key={client.clientId}>
                            <td
                              style={{
                                padding: 12,
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              {client.clientName}
                            </td>
                            <td
                              style={{
                                padding: 12,
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              {client.count}
                            </td>
                            <td
                              style={{
                                padding: 12,
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    flex: 1,
                                    height: 8,
                                    background: "#f0f0f0",
                                    borderRadius: 4,
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${pct}%`,
                                      background: "#111",
                                      borderRadius: 4,
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: 12, color: "#666" }}>
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

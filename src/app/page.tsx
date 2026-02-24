"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// ✅ IMPORTANT: call the Next.js API route (works on localhost + Vercel)
const API_BASE = "";

type CallOutcome = "booked" | "info_only" | "follow_up";

type CallRecord = {
  id: string;
  createdAt: string;

  caller_name: string | null;
  caller_phone: string | null;
  intent: string | null;

  // legacy / fallback fields
  appointment_booked: boolean | null;
  callback_requested?: boolean | null;

  // canonical field
  call_outcome?: string | null;
};

function normalizeOutcome(call: CallRecord): CallOutcome {
  const raw = (call.call_outcome || "").toLowerCase().trim();

  if (raw === "booked") return "booked";
  if (raw === "follow_up") return "follow_up";
  if (raw === "info_only") return "info_only";

  // Fallback for older rows
  if (call.appointment_booked) return "booked";
  if (call.callback_requested) return "follow_up";
  return "info_only";
}

function outcomeBadge(outcome: CallOutcome) {
  if (outcome === "booked") return { label: "Booked", variant: "default" as const };
  if (outcome === "follow_up") return { label: "Follow Up", variant: "secondary" as const };
  return { label: "Info Only", variant: "secondary" as const };
}

export default function DashboardPage() {
  const router = useRouter();

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadCalls() {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/calls`, { cache: "no-store" });

      // ✅ If middleware is protecting /api and you're not authed yet,
      // force a reload so Chrome shows the Basic Auth popup.
      if (res.status === 401) {
        window.location.reload();
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API /api/calls failed (${res.status}) ${text}`);
      }

      const data = await res.json();
      setCalls(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      alert(
        "Failed to load calls from /api/calls.\n\nIf you're running locally, make sure your Next.js dev server is running (npm run dev)."
      );
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadCalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return calls.filter(
      (c) =>
        (c.caller_name || "").toLowerCase().includes(s) ||
        (c.caller_phone || "").includes(search) ||
        (c.intent || "").toLowerCase().includes(s)
    );
  }, [calls, search]);

  const stats = useMemo(() => {
    let booked = 0;
    let follow = 0;
    let info = 0;

    for (const c of calls) {
      const o = normalizeOutcome(c);
      if (o === "booked") booked++;
      else if (o === "follow_up") follow++;
      else info++;
    }

    return { total: calls.length, booked, follow, info };
  }, [calls]);

  const recent = useMemo(() => {
    return [...filtered]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [filtered]);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by name, phone, or intent..."
              className="w-full md:w-[360px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : "Last updated: —"}
            </div>

            <Button onClick={loadCalls} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{stats.total}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booked</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{stats.booked}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Info Only</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{stats.info}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow Up</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{stats.follow}</CardContent>
          </Card>
        </div>

        {/* Recent Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Calls</CardTitle>
            <Button variant="outline" onClick={() => router.push("/calls")}>
              View all
            </Button>
          </CardHeader>

          <CardContent className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caller</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {recent.map((call) => {
                  const outcome = normalizeOutcome(call);
                  const badge = outcomeBadge(outcome);

                  return (
                    <TableRow key={call.id}>
                      <TableCell>
                        <div className="font-medium">{call.caller_name || "Unknown Caller"}</div>
                        <div className="text-sm text-muted-foreground">
                          {call.caller_phone || "—"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>

                      <TableCell>{call.intent || "—"}</TableCell>

                      <TableCell>{new Date(call.createdAt).toLocaleString()}</TableCell>

                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => router.push(`/calls/${call.id}`)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="text-sm text-muted-foreground">
              Showing {recent.length} of {filtered.length} matching calls.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:3001";

type CallOutcome = "booked" | "info_only" | "follow_up";
type Filter = "all" | "booked" | "info_only" | "follow_up";

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

function statusBadge(call: CallRecord) {
  const outcome = normalizeOutcome(call);
  if (outcome === "booked") return { label: "Booked", variant: "default" as const };
  if (outcome === "follow_up")
    return { label: "Follow Up", variant: "secondary" as const };
  return { label: "Info Only", variant: "secondary" as const };
}

export default function CallsPage() {
  const router = useRouter();

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadCalls() {
    setRefreshing(true);
    try {
      const res = await fetch(`${BACKEND}/api/calls`, { cache: "no-store" });
      const data = await res.json();
      setCalls(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      alert("Failed to load calls. Check backend is running on port 3001.");
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

    return calls
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((c) => {
        const matchesSearch =
          (c.caller_name || "").toLowerCase().includes(s) ||
          (c.caller_phone || "").includes(search) ||
          (c.intent || "").toLowerCase().includes(s);

        if (!matchesSearch) return false;

        const outcome = normalizeOutcome(c);
        if (filter === "all") return true;
        return outcome === filter;
      });
  }, [calls, search, filter]);

  const counts = useMemo(() => {
    let booked = 0,
      info = 0,
      follow = 0;

    for (const c of calls) {
      const o = normalizeOutcome(c);
      if (o === "booked") booked++;
      else if (o === "follow_up") follow++;
      else info++;
    }

    return { booked, info, follow, total: calls.length };
  }, [calls]);

  return (
    <AppShell title="Calls">
      <div className="space-y-6">
        {/* Top controls */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Search by name, phone, or intent..."
              className="w-full md:w-[360px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="info_only">Info Only</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadCalls} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : "Last updated: —"}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{counts.total}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booked</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{counts.booked}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Info Only</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{counts.info}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow Up</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{counts.follow}</CardContent>
          </Card>
        </div>

        {/* Calls table */}
        <Card>
          <CardHeader>
            <CardTitle>All Calls</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">{filtered.length}</span> call(s)
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caller</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((call) => {
                  const badge = statusBadge(call);
                  return (
                    <TableRow
                      key={call.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/calls/${call.id}`)}
                    >
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No calls match your search/filter.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

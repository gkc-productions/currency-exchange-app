"use client";

import { useEffect, useState } from "react";

type StatusResponse = {
  status: "healthy" | "degraded" | "down";
  timestamp: string;
  version: string;
  buildTimestamp: string;
  database: {
    status: "ok" | "fail";
    responseTimeMs: number | null;
    error?: string;
  };
  rateCache: {
    entries: number;
    lastUpdated: string | null;
    hits: number;
    misses: number;
  };
  corridors: Array<{
    corridor: string;
    rails: string[];
    activeRoutesCount: number;
  }>;
  transfers: {
    lastHour: number;
    last24Hours: number;
  };
  errors: {
    lastHour: number;
    last24Hours: number;
  };
  queue: {
    depth: number | null;
    note: string;
  };
};

export default function StatusPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        const data = await res.json();
        if (!active) {
          return;
        }
        setStatus(data);
        setError(null);
        setLastFetch(new Date());
      } catch (err) {
        if (!active) {
          return;
        }
        setError("Status is temporarily unavailable. Please refresh in a moment.");
        console.error("Status fetch error:", err);
      }
    };

    void fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll every 10s
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = (s: string) => {
    if (s === "healthy" || s === "ok") return "bg-emerald-500";
    if (s === "degraded") return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusTextColor = (s: string) => {
    if (s === "healthy" || s === "ok") return "text-emerald-700";
    if (s === "degraded") return "text-amber-700";
    return "text-red-700";
  };

  if (error && !status) {
    return (
      <div className="min-h-screen bg-[var(--brand-surface)] flex items-center justify-center px-6 py-16 lg:px-8">
        <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200/70 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <h1 className="text-2xl font-bold text-slate-900">System Status</h1>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-[var(--brand-surface)] flex items-center justify-center px-6 py-16 lg:px-8">
        <div className="text-slate-500">Loading status checks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--brand-surface)]">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        {/* Header */}
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(status.status)} animate-pulse`}
              />
              <h1 className="text-3xl font-bold text-slate-900">
                ClariSend System Status
              </h1>
            </div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(status.status)} text-white`}
            >
              {status.status.toUpperCase()}
            </div>
          </div>
          <div className="text-sm text-slate-500">
            Last updated: {lastFetch ? lastFetch.toLocaleTimeString() : "—"}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Version:</span>{" "}
              <span className="font-mono text-slate-900">{status.version}</span>
            </div>
            <div>
              <span className="text-slate-500">Build:</span>{" "}
              <span className="font-mono text-slate-900">
                {new Date(status.buildTimestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-8 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(status.database.status)}`}
            />
            Database
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Status:</span>
              <span
                className={`font-semibold ${getStatusTextColor(status.database.status)}`}
              >
                {status.database.status.toUpperCase()}
              </span>
            </div>
            {status.database.responseTimeMs !== null && (
              <div className="flex justify-between">
                <span className="text-slate-600">Response Time:</span>
                <span className="font-mono text-slate-900">
                  {status.database.responseTimeMs}ms
                </span>
              </div>
            )}
            {status.database.error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-sm text-red-700">
                  {status.database.error}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Rate Cache Status */}
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-8 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Rate Cache
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-2xl">
              <div className="text-2xl font-bold text-slate-900">
                {status.rateCache.entries}
              </div>
              <div className="text-sm text-slate-600">Entries</div>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-2xl">
              <div className="text-2xl font-bold text-emerald-700">
                {status.rateCache.hits}
              </div>
              <div className="text-sm text-slate-600">Hits</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-2xl">
              <div className="text-2xl font-bold text-amber-700">
                {status.rateCache.misses}
              </div>
              <div className="text-sm text-slate-600">Misses</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-2xl">
              <div className="text-sm font-mono text-slate-900">
                {status.rateCache.lastUpdated
                  ? new Date(status.rateCache.lastUpdated).toLocaleTimeString()
                  : "—"}
              </div>
              <div className="text-sm text-slate-600">Last Update</div>
            </div>
          </div>
        </div>

        {/* Operational Metrics */}
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-8 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Operational Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200/60 p-4">
              <div className="text-sm text-slate-500">Transfers</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {status.transfers.lastHour}
              </div>
              <div className="text-xs text-slate-500">Last hour</div>
              <div className="mt-3 text-lg font-semibold text-slate-900">
                {status.transfers.last24Hours}
              </div>
              <div className="text-xs text-slate-500">Last 24 hours</div>
            </div>
            <div className="rounded-2xl border border-slate-200/60 p-4">
              <div className="text-sm text-slate-500">Errors</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {status.errors.lastHour}
              </div>
              <div className="text-xs text-slate-500">Last hour</div>
              <div className="mt-3 text-lg font-semibold text-slate-900">
                {status.errors.last24Hours}
              </div>
              <div className="text-xs text-slate-500">Last 24 hours</div>
            </div>
            <div className="rounded-2xl border border-slate-200/60 p-4">
              <div className="text-sm text-slate-500">Queue Depth</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {status.queue.depth ?? "—"}
              </div>
              <div className="text-xs text-slate-500">{status.queue.note}</div>
            </div>
          </div>
        </div>

        {/* Corridors & Rails */}
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Available Corridors
          </h2>
          {status.corridors.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No active corridors configured
            </div>
          ) : (
            <div className="space-y-3">
              {status.corridors.map((corridor) => (
                <div
                  key={corridor.corridor}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-slate-900 font-mono">
                      {corridor.corridor}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {corridor.activeRoutesCount} active route
                      {corridor.activeRoutesCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {corridor.rails.map((rail) => (
                      <span
                        key={rail}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold"
                      >
                        {rail}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center text-sm text-slate-500">
          This page automatically refreshes every 10 seconds
        </div>
      </div>
    </div>
  );
}

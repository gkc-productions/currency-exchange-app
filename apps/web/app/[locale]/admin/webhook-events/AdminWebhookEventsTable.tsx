"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/src/lib/i18n/messages";

type WebhookRow = {
  id: string;
  provider: string;
  eventId: string;
  transferId: string;
  kind: string;
  receivedAt: string;
  signatureTimestamp: string | null;
  isDeduped: boolean;
  processingResult: string;
  rawPayload: { hash: string; size: number };
};

type Messages = {
  adminWebhookEventsLoadingLabel: string;
  adminWebhookEventsEmptyLabel: string;
  adminWebhookEventsProviderLabel: string;
  adminWebhookEventsKindLabel: string;
  adminWebhookEventsOutcomeLabel: string;
  adminWebhookEventsAllLabel: string;
  adminWebhookEventsReceivedLabel: string;
  adminWebhookEventsEventIdLabel: string;
  adminWebhookEventsTransferLabel: string;
  adminWebhookEventsSinceLabel: string;
  adminWebhookEventsReplayLabel: string;
  adminWebhookEventsReplaySuccess: string;
  adminWebhookEventsReplayError: string;
  adminWebhookEventsDedupedLabel: string;
};

type Props = {
  locale: Locale;
  messages: Messages;
};

export default function AdminWebhookEventsTable({ locale, messages }: Props) {
  const [rows, setRows] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [transferFilter, setTransferFilter] = useState("");
  const [sinceFilter, setSinceFilter] = useState("");
  const [replayState, setReplayState] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const providers = useMemo(() => {
    const unique = new Set(rows.map((row) => row.provider));
    return ["ALL", ...Array.from(unique)];
  }, [rows]);

  const kinds = useMemo(() => {
    const unique = new Set(rows.map((row) => row.kind));
    return ["ALL", ...Array.from(unique)];
  }, [rows]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (providerFilter !== "ALL") {
      params.set("provider", providerFilter);
    }
    if (kindFilter !== "ALL") {
      params.set("kind", kindFilter);
    }
    if (transferFilter.trim()) {
      params.set("transferId", transferFilter.trim());
    }
    if (sinceFilter.trim()) {
      params.set("since", sinceFilter.trim());
    }

    fetch(`/api/admin/webhook-events?${params.toString()}`)
      .then(async (res) => {
        if (!active) {
          return;
        }
        if (!res.ok) {
          setError("load_error");
          setLoading(false);
          return;
        }
        const payload = (await res.json().catch(() => null)) as WebhookRow[] | null;
        setRows(Array.isArray(payload) ? payload : []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setError("load_error");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [providerFilter, kindFilter, transferFilter, sinceFilter, refreshKey]);

  const handleReplay = async (eventId: string) => {
    if (!window.confirm(messages.adminWebhookEventsReplayLabel)) {
      return;
    }
    setReplayState((prev) => ({ ...prev, [eventId]: "loading" }));
    try {
      const res = await fetch(`/api/admin/webhook-events/${eventId}/replay`, {
        method: "POST",
      });
      if (res.ok) {
        setReplayState((prev) => ({ ...prev, [eventId]: "success" }));
        setRefreshKey((value) => value + 1);
      } else {
        setReplayState((prev) => ({ ...prev, [eventId]: "error" }));
      }
    } catch {
      setReplayState((prev) => ({ ...prev, [eventId]: "error" }));
    }
  };

  const isNonProd = process.env.NODE_ENV !== "production";

  if (loading) {
    return (
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        {messages.adminWebhookEventsLoadingLabel}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
        {messages.adminWebhookEventsReplayError}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        {messages.adminWebhookEventsEmptyLabel}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <label className="text-xs font-semibold text-slate-500">
          {messages.adminWebhookEventsProviderLabel}
        </label>
        <select
          value={providerFilter}
          onChange={(event) => setProviderFilter(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        >
          {providers.map((provider) => (
            <option key={provider} value={provider}>
              {provider === "ALL" ? messages.adminWebhookEventsAllLabel : provider}
            </option>
          ))}
        </select>
        <label className="text-xs font-semibold text-slate-500">
          {messages.adminWebhookEventsKindLabel}
        </label>
        <select
          value={kindFilter}
          onChange={(event) => setKindFilter(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        >
          {kinds.map((kind) => (
            <option key={kind} value={kind}>
              {kind === "ALL" ? messages.adminWebhookEventsAllLabel : kind}
            </option>
          ))}
        </select>
        <label className="text-xs font-semibold text-slate-500">
          {messages.adminWebhookEventsTransferLabel}
        </label>
        <input
          value={transferFilter}
          onChange={(event) => setTransferFilter(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        />
        <label className="text-xs font-semibold text-slate-500">
          {messages.adminWebhookEventsSinceLabel}
        </label>
        <input
          type="datetime-local"
          value={sinceFilter}
          onChange={(event) => setSinceFilter(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="pb-3">{messages.adminWebhookEventsReceivedLabel}</th>
              <th className="pb-3">{messages.adminWebhookEventsProviderLabel}</th>
              <th className="pb-3">{messages.adminWebhookEventsEventIdLabel}</th>
              <th className="pb-3">{messages.adminWebhookEventsTransferLabel}</th>
              <th className="pb-3">{messages.adminWebhookEventsKindLabel}</th>
              <th className="pb-3">{messages.adminWebhookEventsOutcomeLabel}</th>
              <th className="pb-3">{messages.adminWebhookEventsDedupedLabel}</th>
              {isNonProd ? <th className="pb-3">{messages.adminWebhookEventsReplayLabel}</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const replayStatus = replayState[row.id];
              return (
                <tr key={row.id}>
                  <td className="py-3 text-xs text-slate-500">
                    {new Date(row.receivedAt).toLocaleString(
                      locale === "fr" ? "fr-FR" : "en-US"
                    )}
                  </td>
                  <td className="py-3">{row.provider}</td>
                  <td className="py-3 text-xs text-slate-600">{row.eventId}</td>
                  <td className="py-3 text-xs text-slate-600">{row.transferId}</td>
                  <td className="py-3 text-xs text-slate-600">{row.kind}</td>
                  <td className="py-3 text-xs text-slate-600">{row.processingResult}</td>
                  <td className="py-3 text-xs text-slate-600">
                    {row.isDeduped ? messages.adminWebhookEventsDedupedLabel : ""}
                  </td>
                  {isNonProd ? (
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => handleReplay(row.id)}
                        className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                        disabled={replayStatus === "loading"}
                      >
                        {messages.adminWebhookEventsReplayLabel}
                      </button>
                      {replayStatus === "success" ? (
                        <p className="mt-1 text-xs text-emerald-600">
                          {messages.adminWebhookEventsReplaySuccess}
                        </p>
                      ) : null}
                      {replayStatus === "error" ? (
                        <p className="mt-1 text-xs text-rose-600">
                          {messages.adminWebhookEventsReplayError}
                        </p>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

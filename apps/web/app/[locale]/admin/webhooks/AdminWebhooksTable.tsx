"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/src/lib/i18n/messages";

type WebhookRow = {
  eventId: string;
  provider: string;
  transferId: string;
  outcome: string;
  receivedAt: string;
};

type Messages = {
  adminWebhooksLoadingLabel: string;
  adminWebhooksEmptyLabel: string;
  adminWebhooksProviderLabel: string;
  adminWebhooksOutcomeLabel: string;
  adminWebhooksAllLabel: string;
  adminWebhooksReceivedLabel: string;
  adminWebhooksEventIdLabel: string;
  adminWebhooksTransferLabel: string;
  adminWebhooksReplayLabel: string;
  adminWebhooksReplaySuccess: string;
  adminWebhooksReplayError: string;
};

type Props = {
  locale: Locale;
  messages: Messages;
};

export default function AdminWebhooksTable({ locale, messages }: Props) {
  const [rows, setRows] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [outcomeFilter, setOutcomeFilter] = useState("ALL");
  const [replayState, setReplayState] = useState<Record<string, string>>({});

  const providers = useMemo(() => {
    const unique = new Set(rows.map((row) => row.provider));
    return ["ALL", ...Array.from(unique)];
  }, [rows]);

  const outcomes = useMemo(() => {
    const unique = new Set(rows.map((row) => row.outcome));
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
    if (outcomeFilter !== "ALL") {
      params.set("outcome", outcomeFilter);
    }

    fetch(`/api/admin/webhooks/payout?${params.toString()}`)
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
  }, [providerFilter, outcomeFilter]);

  const handleReplay = async (eventId: string) => {
    setReplayState((prev) => ({ ...prev, [eventId]: "loading" }));
    try {
      const res = await fetch("/api/admin/webhooks/payout/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) {
        setReplayState((prev) => ({ ...prev, [eventId]: "success" }));
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
        {messages.adminWebhooksLoadingLabel}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
        {messages.adminWebhooksReplayError}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        {messages.adminWebhooksEmptyLabel}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <label className="text-xs font-semibold text-slate-500">
          {messages.adminWebhooksProviderLabel}
        </label>
        <select
          value={providerFilter}
          onChange={(event) => setProviderFilter(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        >
          {providers.map((provider) => (
            <option key={provider} value={provider}>
              {provider === "ALL" ? messages.adminWebhooksAllLabel : provider}
            </option>
          ))}
        </select>
        <label className="text-xs font-semibold text-slate-500">
          {messages.adminWebhooksOutcomeLabel}
        </label>
        <select
          value={outcomeFilter}
          onChange={(event) => setOutcomeFilter(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        >
          {outcomes.map((outcome) => (
            <option key={outcome} value={outcome}>
              {outcome === "ALL" ? messages.adminWebhooksAllLabel : outcome}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="pb-3">{messages.adminWebhooksReceivedLabel}</th>
              <th className="pb-3">{messages.adminWebhooksProviderLabel}</th>
              <th className="pb-3">{messages.adminWebhooksEventIdLabel}</th>
              <th className="pb-3">{messages.adminWebhooksTransferLabel}</th>
              <th className="pb-3">{messages.adminWebhooksOutcomeLabel}</th>
              {isNonProd ? <th className="pb-3">{messages.adminWebhooksReplayLabel}</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const replayStatus = replayState[row.eventId];
              return (
                <tr key={row.eventId}>
                  <td className="py-3 text-xs text-slate-500">
                    {new Date(row.receivedAt).toLocaleString(
                      locale === "fr" ? "fr-FR" : "en-US"
                    )}
                  </td>
                  <td className="py-3">{row.provider}</td>
                  <td className="py-3 text-xs text-slate-600">{row.eventId}</td>
                  <td className="py-3 text-xs text-slate-600">{row.transferId}</td>
                  <td className="py-3 text-xs text-slate-600">{row.outcome}</td>
                  {isNonProd ? (
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => handleReplay(row.eventId)}
                        className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                        disabled={replayStatus === "loading"}
                      >
                        {messages.adminWebhooksReplayLabel}
                      </button>
                      {replayStatus === "success" ? (
                        <p className="mt-1 text-xs text-emerald-600">
                          {messages.adminWebhooksReplaySuccess}
                        </p>
                      ) : null}
                      {replayStatus === "error" ? (
                        <p className="mt-1 text-xs text-rose-600">
                          {messages.adminWebhooksReplayError}
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

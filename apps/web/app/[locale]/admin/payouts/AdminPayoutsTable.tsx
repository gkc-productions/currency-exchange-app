"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Locale, Messages } from "@/src/lib/i18n/messages";

type AdminPayoutRow = {
  id: string;
  referenceCode: string;
  status: string;
  payoutRail: string;
  updatedAt: string | Date;
  receiptUrl: string | null;
  providerPayoutProvider: string | null;
  latestPayoutEvent: {
    type: string;
    message: string;
    createdAt: string | Date;
  } | null;
};

function formatDate(locale: Locale, value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type Props = {
  locale: Locale;
  messages: Messages;
  initialPayouts: AdminPayoutRow[];
};

export default function AdminPayoutsTable({
  locale,
  messages,
  initialPayouts,
}: Props) {
  const [payouts, setPayouts] = useState<AdminPayoutRow[]>(initialPayouts);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const providers = useMemo(() => {
    const set = new Set<string>();
    payouts.forEach((item) => {
      if (item.providerPayoutProvider) {
        set.add(item.providerPayoutProvider);
      }
    });
    return Array.from(set.values());
  }, [payouts]);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams();
    params.set("limit", "50");
    if (statusFilter !== "ALL") {
      params.set("status", statusFilter);
    }
    if (providerFilter !== "ALL") {
      params.set("provider", providerFilter);
    }
    const res = await fetch(`/api/admin/payouts?${params.toString()}`);
    const payload = (await res.json().catch(() => null)) as AdminPayoutRow[] | null;
    if (!res.ok || !Array.isArray(payload)) {
      setLoadError(messages.adminPayoutsLoadError);
      setLoading(false);
      return;
    }
    setPayouts(payload);
    setLoading(false);
  }, [messages.adminPayoutsLoadError, providerFilter, statusFilter]);

  const csvUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (fromDate) {
      params.set("from", fromDate);
    }
    if (toDate) {
      params.set("to", toDate);
    }
    const query = params.toString();
    return `/api/admin/exports/payouts.csv${query ? `?${query}` : ""}`;
  }, [fromDate, toDate]);

  useEffect(() => {
    void fetchPayouts();
  }, [fetchPayouts]);

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-4">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          {messages.adminPayoutsStatusLabel}
          <select
            className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">{messages.adminPayoutsAllLabel}</option>
            <option value="PROCESSING">{messages.statusProcessingLabel}</option>
            <option value="COMPLETED">{messages.statusCompletedLabel}</option>
            <option value="FAILED">{messages.statusFailedLabel}</option>
          </select>
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          {messages.adminPayoutsProviderLabel}
          <select
            className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            value={providerFilter}
            onChange={(event) => setProviderFilter(event.target.value)}
          >
            <option value="ALL">{messages.adminPayoutsAllLabel}</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={fetchPayouts}
          className="self-end rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700"
        >
          {messages.adminPayoutsRefreshLabel}
        </button>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          {messages.adminPayoutsFromLabel}
          <input
            type="date"
            className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          {messages.adminPayoutsToLabel}
          <input
            type="date"
            className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </label>
        <a
          href={csvUrl}
          className="self-end rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700"
        >
          {messages.adminPayoutsDownloadCsvLabel}
        </a>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{messages.adminPayoutsReferenceLabel}</th>
                <th className="px-4 py-3">{messages.adminPayoutsStatusLabel}</th>
                <th className="px-4 py-3">{messages.adminPayoutsRailLabel}</th>
                <th className="px-4 py-3">{messages.adminPayoutsUpdatedLabel}</th>
                <th className="px-4 py-3">{messages.adminPayoutsLatestEventLabel}</th>
                <th className="px-4 py-3">{messages.adminPayoutsReceiptLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loadError ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-rose-500" colSpan={6}>
                    {loadError}
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={6}>
                    {messages.adminPayoutsLoadingLabel}
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={6}>
                    {messages.adminPayoutsEmpty}
                  </td>
                </tr>
              ) : (
                payouts.map((item) => {
                  const latestEvent = item.latestPayoutEvent;
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {item.referenceCode}
                      </td>
                      <td className="px-4 py-4">{item.status}</td>
                      <td className="px-4 py-4">{item.payoutRail}</td>
                      <td className="px-4 py-4">
                        {formatDate(locale, item.updatedAt)}
                      </td>
                      <td className="px-4 py-4">
                        {latestEvent ? (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-700">
                              {latestEvent.type}
                            </p>
                            <p className="text-xs text-slate-500">
                              {latestEvent.message}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {formatDate(locale, latestEvent.createdAt)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {messages.adminPayoutsEventEmptyLabel}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {item.receiptUrl ? (
                          <a
                            href={item.receiptUrl}
                            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            {messages.adminPayoutsReceiptViewLabel}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {messages.adminPayoutsReceiptUnavailableLabel}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

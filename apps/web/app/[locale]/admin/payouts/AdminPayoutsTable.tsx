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
  providerPayoutId?: string | null;
  providerPayoutStatus: string | null;
  latestPayoutEvent: {
    type: string;
    message: string;
    createdAt: string | Date;
  } | null;
};

type ProviderState = {
  providerKey: string;
  isEnabled: boolean;
  isHealthy: boolean;
  lastCheckedAt: string | null;
  lastErrorAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
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
  const [providerStates, setProviderStates] = useState<ProviderState[]>([]);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reconcileState, setReconcileState] = useState<
    Record<
      string,
      {
        state: "idle" | "loading" | "error" | "success";
        error?: string;
      }
    >
  >({});

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

  const fetchProviders = useCallback(async () => {
    const res = await fetch("/api/admin/payout-providers");
    const payload = (await res.json().catch(() => null)) as ProviderState[] | null;
    if (!res.ok || !Array.isArray(payload)) {
      setProviderError(messages.adminProvidersLoadError);
      return;
    }
    setProviderStates(payload);
  }, [messages.adminProvidersLoadError]);

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

  useEffect(() => {
    void fetchProviders();
  }, [fetchProviders]);

  const updateProvider = async (providerKey: string, payload: Partial<ProviderState>) => {
    const res = await fetch(`/api/admin/payout-providers/${providerKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setProviderError(messages.adminProvidersUpdateError);
      return;
    }
    const updated = (await res.json().catch(() => null)) as ProviderState | null;
    if (!updated) {
      setProviderError(messages.adminProvidersUpdateError);
      return;
    }
    setProviderStates((prev) =>
      prev.map((state) => (state.providerKey === updated.providerKey ? updated : state))
    );
  };

  const reconcileTransfer = async (id: string) => {
    setReconcileState((prev) => ({
      ...prev,
      [id]: { state: "loading" },
    }));
    try {
      const res = await fetch(`/api/admin/transfers/${id}/reconcile`, {
        method: "POST",
      });
      const payload = (await res.json().catch(() => null)) as
        | {
            afterStatus?: string;
            providerStatus?: string;
            receiptUrl?: string | null;
            error?: string;
            deduped?: boolean;
          }
        | null;
      if (!res.ok) {
        setReconcileState((prev) => ({
          ...prev,
          [id]: {
            state: "error",
            error: payload?.error ?? messages.reconcilePayoutErrorLabel,
          },
        }));
        return;
      }
      setPayouts((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                status: payload?.afterStatus ?? row.status,
                providerPayoutStatus: payload?.providerStatus ?? row.providerPayoutStatus,
                receiptUrl: payload?.receiptUrl ?? row.receiptUrl,
              }
            : row
        )
      );
      setReconcileState((prev) => ({
        ...prev,
        [id]: { state: "success" },
      }));
      await fetchPayouts();
    } catch {
      setReconcileState((prev) => ({
        ...prev,
        [id]: { state: "error", error: messages.reconcilePayoutErrorLabel },
      }));
    }
  };

  return (
    <>
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {messages.adminProvidersTitle}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {messages.adminProvidersSubtitle}
            </p>
          </div>
        </div>
        {providerError ? (
          <p className="mt-3 text-sm text-rose-500">{providerError}</p>
        ) : null}
        <div className="mt-4 space-y-3">
          {providerStates.length === 0 ? (
            <p className="text-sm text-slate-500">{messages.adminProvidersEmpty}</p>
          ) : (
            providerStates.map((provider) => (
              <div
                key={provider.providerKey}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              >
                <div className="min-w-[140px] font-semibold text-slate-900">
                  {provider.providerKey}
                </div>
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={provider.isEnabled}
                    onChange={(event) =>
                      updateProvider(provider.providerKey, { isEnabled: event.target.checked })
                    }
                  />
                  {messages.adminProvidersEnabledLabel}
                </label>
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={provider.isHealthy}
                    onChange={(event) =>
                      updateProvider(provider.providerKey, { isHealthy: event.target.checked })
                    }
                  />
                  {messages.adminProvidersHealthyLabel}
                </label>
                <div className="text-xs text-slate-500">
                  {provider.lastErrorCode ?? messages.adminProvidersNoErrorLabel}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
                <th className="px-4 py-3">{messages.providerLabel}</th>
                <th className="px-4 py-3">{messages.providerPayoutIdLabel}</th>
                <th className="px-4 py-3">{messages.providerStatusLabel}</th>
                <th className="px-4 py-3">{messages.adminPayoutsUpdatedLabel}</th>
                <th className="px-4 py-3">{messages.adminPayoutsLatestEventLabel}</th>
                <th className="px-4 py-3">{messages.adminPayoutsReceiptLabel}</th>
                <th className="px-4 py-3">{messages.reconcilePayoutButtonLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loadError ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-rose-500" colSpan={9}>
                    {loadError}
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={9}>
                    {messages.adminPayoutsLoadingLabel}
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={9}>
                    {messages.adminPayoutsEmpty}
                  </td>
                </tr>
              ) : (
                payouts.map((item) => {
                  const latestEvent = item.latestPayoutEvent;
                  const canReconcile =
                    item.status === "PROCESSING" && Boolean(item.providerPayoutId);
                  const reconcileRow = reconcileState[item.id];
                  const isReconciling = reconcileRow?.state === "loading";
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {item.referenceCode}
                      </td>
                      <td className="px-4 py-4">{item.status}</td>
                      <td className="px-4 py-4">{item.payoutRail}</td>
                      <td className="px-4 py-4">
                        {item.providerPayoutProvider ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        {item.providerPayoutId ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        {item.providerPayoutStatus ?? "—"}
                      </td>
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
                      <td className="px-4 py-4">
                        {canReconcile ? (
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => reconcileTransfer(item.id)}
                              disabled={isReconciling}
                              className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isReconciling
                                ? messages.reconcilePayoutLoadingLabel
                                : messages.reconcilePayoutButtonLabel}
                            </button>
                            {reconcileRow?.state === "error" ? (
                              <span className="text-[11px] text-rose-500">
                                {reconcileRow.error}
                              </span>
                            ) : reconcileRow?.state === "success" ? (
                              <span className="text-[11px] text-slate-400">
                                {messages.reconcilePayoutSuccessLabel}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
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

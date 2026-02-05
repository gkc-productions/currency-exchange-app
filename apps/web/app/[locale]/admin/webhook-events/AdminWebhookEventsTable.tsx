"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
  adminWebhookEventsDetailsLabel: string;
  adminWebhookEventsCopyLabel: string;
  adminWebhookEventsCopiedLabel: string;
  adminWebhookEventsSearchLabel: string;
  adminWebhookEventsSearchPlaceholder: string;
  adminWebhookEventsSignatureStatusLabel: string;
  adminWebhookEventsPayloadHashLabel: string;
  adminWebhookEventsOutcomeReasonLabel: string;
  timelineMessageEmptyLabel: string;
};

type Props = {
  locale: Locale;
  messages: Messages;
  initialRows?: WebhookRow[];
  initialExpandedId?: string | null;
  disableFetch?: boolean;
};

export async function copyToClipboard(value: string) {
  if (!value) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export default function AdminWebhookEventsTable({
  locale,
  messages,
  initialRows = [],
  initialExpandedId = null,
  disableFetch = false,
}: Props) {
  const [rows, setRows] = useState<WebhookRow[]>(initialRows);
  const [loading, setLoading] = useState(!disableFetch);
  const [error, setError] = useState<string | null>(null);
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [transferFilter, setTransferFilter] = useState("");
  const [sinceFilter, setSinceFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [replayState, setReplayState] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialExpandedId
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const providers = useMemo(() => {
    const unique = new Set(rows.map((row) => row.provider));
    return ["ALL", ...Array.from(unique)];
  }, [rows]);

  const kinds = useMemo(() => {
    const unique = new Set(rows.map((row) => row.kind));
    return ["ALL", ...Array.from(unique)];
  }, [rows]);

  useEffect(() => {
    if (disableFetch) {
      setLoading(false);
      return;
    }
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
  }, [
    providerFilter,
    kindFilter,
    transferFilter,
    sinceFilter,
    refreshKey,
    disableFetch,
  ]);

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
  const filteredRows = useMemo(() => {
    const term = searchFilter.trim().toLowerCase();
    if (!term) {
      return rows;
    }
    return rows.filter((row) => {
      return (
        row.eventId.toLowerCase().includes(term) ||
        row.transferId.toLowerCase().includes(term) ||
        row.provider.toLowerCase().includes(term) ||
        row.processingResult.toLowerCase().includes(term)
      );
    });
  }, [rows, searchFilter]);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCopy = async (value: string, key: string) => {
    const success = await copyToClipboard(value);
    setCopiedKey(success ? key : null);
    if (success) {
      window.setTimeout(() => setCopiedKey(null), 1600);
    }
  };

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

  if (filteredRows.length === 0) {
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
        <label className="text-xs font-semibold text-slate-500">
          {messages.adminWebhookEventsSearchLabel}
        </label>
        <input
          value={searchFilter}
          onChange={(event) => setSearchFilter(event.target.value)}
          placeholder={messages.adminWebhookEventsSearchPlaceholder}
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
              <th className="pb-3">{messages.adminWebhookEventsDetailsLabel}</th>
              {isNonProd ? <th className="pb-3">{messages.adminWebhookEventsReplayLabel}</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row) => {
              const replayStatus = replayState[row.id];
              const isExpanded = expandedId === row.id;
              return (
                <Fragment key={row.id}>
                  <tr className="cursor-pointer" onClick={() => handleToggle(row.id)}>
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
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggle(row.id);
                        }}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        {messages.adminWebhookEventsDetailsLabel}
                      </button>
                    </td>
                    {isNonProd ? (
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleReplay(row.id);
                          }}
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
                  {isExpanded ? (
                    <tr key={`${row.id}-details`}>
                      <td colSpan={isNonProd ? 9 : 8} className="pb-4 pt-0">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="font-semibold text-slate-700">
                                {messages.adminWebhookEventsEventIdLabel}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="break-all">{row.eventId}</span>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleCopy(row.eventId, `${row.id}-event`);
                                  }}
                                  className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                                >
                                  {copiedKey === `${row.id}-event`
                                    ? messages.adminWebhookEventsCopiedLabel
                                    : messages.adminWebhookEventsCopyLabel}
                                </button>
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">
                                {messages.adminWebhookEventsProviderLabel}
                              </p>
                              <p>{row.provider}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">
                                {messages.adminWebhookEventsReceivedLabel}
                              </p>
                              <p>
                                {new Date(row.receivedAt).toLocaleString(
                                  locale === "fr" ? "fr-FR" : "en-US"
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">
                                {messages.adminWebhookEventsOutcomeLabel}
                              </p>
                              <p>{row.processingResult}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">
                                {messages.adminWebhookEventsTransferLabel}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="break-all">
                                  {row.transferId || messages.timelineMessageEmptyLabel}
                                </span>
                                {row.transferId ? (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleCopy(row.transferId, `${row.id}-transfer`);
                                    }}
                                    className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                                  >
                                    {copiedKey === `${row.id}-transfer`
                                      ? messages.adminWebhookEventsCopiedLabel
                                      : messages.adminWebhookEventsCopyLabel}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">
                                {messages.adminWebhookEventsPayloadHashLabel}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="break-all">{row.rawPayload.hash}</span>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleCopy(row.rawPayload.hash, `${row.id}-hash`);
                                  }}
                                  className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                                >
                                  {copiedKey === `${row.id}-hash`
                                    ? messages.adminWebhookEventsCopiedLabel
                                    : messages.adminWebhookEventsCopyLabel}
                                </button>
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">
                                {messages.adminWebhookEventsSignatureStatusLabel}
                              </p>
                              <p>{messages.timelineMessageEmptyLabel}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700">
                                {messages.adminWebhookEventsOutcomeReasonLabel}
                              </p>
                              <p>{messages.timelineMessageEmptyLabel}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

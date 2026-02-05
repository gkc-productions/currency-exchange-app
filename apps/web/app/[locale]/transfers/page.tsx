"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDateTime } from "@/src/lib/format";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";
import {
  filterTransfers,
  resolveProviderLabel,
  type TransferHistoryRow,
  type TransferStatusFilter,
} from "@/src/lib/transfer-history";

const statusOptions: TransferStatusFilter[] = [
  "ALL",
  "READY",
  "PROCESSING",
  "FAILED",
  "COMPLETED",
  "DRAFT",
];

export default function TransfersHistoryPage() {
  const params = useParams();
  const locale = useMemo<Locale>(() => {
    const value = params?.locale;
    if (Array.isArray(value)) {
      return value[0] === "fr" ? "fr" : "en";
    }
    return value === "fr" ? "fr" : "en";
  }, [params]);
  const messages = getMessages(locale);
  const [transfers, setTransfers] = useState<TransferHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"unauthorized" | "generic" | null>(null);
  const [statusFilter, setStatusFilter] = useState<TransferStatusFilter>("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch("/api/transfers", { cache: "no-store" })
      .then(async (res) => {
        if (!active) {
          return;
        }
        if (res.status === 401) {
          setError("unauthorized");
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError("generic");
          setLoading(false);
          return;
        }
        const payload = (await res.json().catch(() => null)) as TransferHistoryRow[] | null;
        setTransfers(Array.isArray(payload) ? payload : []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setError("generic");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () => filterTransfers(transfers, statusFilter, query),
    [transfers, statusFilter, query]
  );

  const statusLabels = useMemo(
    () => ({
      READY: messages.statusReadyLabel,
      PROCESSING: messages.statusProcessingLabel,
      COMPLETED: messages.statusCompletedLabel,
      FAILED: messages.statusFailedLabel,
      DRAFT: messages.statusDraftLabel,
    }),
    [messages]
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
        {messages.transfersHistoryLabel}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">
        {messages.transfersHistoryTitle}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {messages.transfersHistorySubtitle}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-1 items-center gap-3">
          <label className="text-xs font-semibold text-slate-500">
            {messages.transfersHistoryStatusLabel}
          </label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as TransferStatusFilter)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? messages.transfersHistoryAllLabel : statusLabels[option]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex w-full flex-1 items-center gap-3 sm:justify-end">
          <label className="text-xs font-semibold text-slate-500">
            {messages.transfersHistorySearchLabel}
          </label>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={messages.transfersHistorySearchPlaceholder}
            className="w-full max-w-xs rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700"
          />
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">
            {messages.transfersHistoryLoadingLabel}
          </p>
        ) : error === "unauthorized" ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <p className="text-sm font-semibold text-rose-700">
              {messages.transfersHistoryUnauthorizedLabel}
            </p>
            <Link
              href={`/${locale}/login`}
              className="mt-3 inline-flex rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700"
            >
              {messages.transfersHistoryLoginLabel}
            </Link>
          </div>
        ) : error ? (
          <p className="text-sm text-rose-600">
            {messages.transfersHistoryErrorLabel}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500">
            {messages.transfersHistoryEmptyLabel}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="pb-3">{messages.transfersHistoryReferenceLabel}</th>
                  <th className="pb-3">{messages.transfersHistoryStatusLabel}</th>
                  <th className="pb-3">{messages.transfersHistoryRailLabel}</th>
                  <th className="pb-3">{messages.providerLabel}</th>
                  <th className="pb-3">{messages.transfersHistoryRecipientLabel}</th>
                  <th className="pb-3">{messages.transfersHistoryDateLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-slate-50">
                    <td className="py-3 text-slate-900">
                      <Link
                        href={`/${locale}/transfer/${transfer.id}`}
                        className="font-semibold text-emerald-700"
                      >
                        {transfer.referenceCode}
                      </Link>
                    </td>
                    <td className="py-3">
                      {statusLabels[transfer.status as keyof typeof statusLabels] ??
                        transfer.status}
                    </td>
                    <td className="py-3">{transfer.payoutRail}</td>
                    <td className="py-3">
                      {resolveProviderLabel(transfer.providerPayoutProvider)}
                    </td>
                    <td className="py-3">{transfer.recipientName}</td>
                    <td className="py-3">
                      {formatDateTime(transfer.createdAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

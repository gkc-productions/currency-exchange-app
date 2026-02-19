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
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

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
      <SectionHeader
        eyebrow={messages.transfersHistoryLabel}
        title={messages.transfersHistoryTitle}
        subtitle={messages.transfersHistorySubtitle}
      />

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

      <Card className="mt-8">
        <CardContent>
        {loading ? (
          <p className="text-sm text-slate-500">
            {messages.transfersHistoryLoadingLabel}
          </p>
        ) : error === "unauthorized" ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <p className="text-sm font-semibold text-rose-700">
              {messages.transfersHistoryUnauthorizedLabel}
            </p>
            <Button
              href={`/${locale}/login`}
              variant="secondary"
              className="mt-3 border-rose-200 text-rose-700"
            >
              {messages.transfersHistoryLoginLabel}
            </Button>
          </div>
        ) : error ? (
          <p className="text-sm text-rose-600">
            {messages.transfersHistoryErrorLabel}
          </p>
        ) : filtered.length === 0 ? (
          <div
            data-testid="transfers-empty-state"
            className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6"
          >
            <p className="text-sm text-slate-700">
              This page shows your transfer history, status, and recipient details.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button href={`/${locale}`} variant="primary">
                Start transfer
              </Button>
              <Link
                href={`/${locale}/help`}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Help
              </Link>
            </div>
          </div>
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
                      <Badge>
                        {statusLabels[transfer.status as keyof typeof statusLabels] ??
                          transfer.status}
                      </Badge>
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
        </CardContent>
      </Card>
    </div>
  );
}

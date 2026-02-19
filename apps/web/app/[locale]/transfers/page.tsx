"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDateTime, formatMoney } from "@/src/lib/format";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";
import {
  filterAndSortTransfers,
  resolveProviderLabel,
  type TransferHistoryRow,
  type TransferSort,
} from "@/src/lib/transfer-history";
import { resolveUserStatusModel, type UserTransferStatus } from "@/src/lib/transfer-status-model";
import { withLocale } from "@/src/lib/with-locale";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

const quickFilters = [
  { key: "ALL", label: "All" },
  { key: "PENDING_PAYMENT", label: "Pending" },
  { key: "PROCESSING", label: "Processing" },
  { key: "COMPLETED", label: "Completed" },
  { key: "FAILED", label: "Failed" },
] as const;

type QuickFilter = (typeof quickFilters)[number]["key"];

function formatRelativeTime(value: string, locale: Locale) {
  const now = Date.now();
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return "—";
  }
  const diffMs = now - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < hour) {
    const minutes = Math.max(1, Math.round(diffMs / minute));
    return locale === "fr" ? `Mis a jour il y a ${minutes} min` : `Updated ${minutes}m ago`;
  }
  if (diffMs < day) {
    const hours = Math.max(1, Math.round(diffMs / hour));
    return locale === "fr" ? `Mis a jour il y a ${hours} h` : `Updated ${hours}h ago`;
  }
  const days = Math.max(1, Math.round(diffMs / day));
  return locale === "fr" ? `Mis a jour il y a ${days} j` : `Updated ${days}d ago`;
}

function statusTone(status: UserTransferStatus) {
  if (status === "COMPLETED") return "bg-emerald-100 text-emerald-800";
  if (status === "PROCESSING") return "bg-sky-100 text-sky-800";
  if (status === "FAILED") return "bg-rose-100 text-rose-800";
  return "bg-amber-100 text-amber-800";
}

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
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("ALL");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TransferSort>("NEWEST");

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

  const filtered = useMemo(() => {
    const rawStatus =
      quickFilter === "PENDING_PAYMENT" ? "READY" : quickFilter === "ALL" ? "ALL" : quickFilter;
    const status = rawStatus as "ALL" | "READY" | "PROCESSING" | "COMPLETED" | "FAILED";
    return filterAndSortTransfers(transfers, status, query, sort);
  }, [query, quickFilter, sort, transfers]);

  const hasTransfers = transfers.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
      <SectionHeader
        eyebrow={messages.transfersHistoryLabel}
        title={messages.transfersHistoryTitle}
        subtitle="Search by recipient, reference, or destination."
      />
      <div className="mt-4">
        <Button href={withLocale("/track", locale)} variant="secondary">
          Track a transfer
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" data-testid="transfers-filter-chips">
        {quickFilters.map((item) => {
          const isActive = quickFilter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setQuickFilter(item.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex w-full flex-wrap items-center gap-3">
        <label className="text-xs font-semibold text-slate-500">
          {messages.transfersHistorySearchLabel}
        </label>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={messages.transfersHistorySearchPlaceholder}
          className="w-full max-w-sm rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700"
        />
        <label className="text-xs font-semibold text-slate-500 sm:ml-2">
          Sort
        </label>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as TransferSort)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        >
          <option value="NEWEST">Newest first</option>
          <option value="OLDEST">Oldest first</option>
          <option value="AMOUNT_HIGH">Amount high → low</option>
          <option value="AMOUNT_LOW">Amount low → high</option>
        </select>
      </div>

      <div className="mt-8 space-y-3">
        {loading ? (
          <Card>
            <CardContent>
              <p className="text-sm text-slate-500">{messages.transfersHistoryLoadingLabel}</p>
            </CardContent>
          </Card>
        ) : error === "unauthorized" ? (
          <Card>
            <CardContent>
              <p className="text-sm font-semibold text-rose-700">{messages.transfersHistoryUnauthorizedLabel}</p>
              <Button href={`/${locale}/login`} variant="secondary" className="mt-3 border-rose-200 text-rose-700">
                {messages.transfersHistoryLoginLabel}
              </Button>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent>
              <p className="text-sm text-rose-600">{messages.transfersHistoryErrorLabel}</p>
            </CardContent>
          </Card>
        ) : !hasTransfers ? (
          <Card data-testid="transfers-empty-state" className="border-dashed">
            <CardContent>
              <p className="text-sm text-slate-700">
                This page tracks every transfer, current status, and next action in one place.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button href={`/${locale}`} variant="primary">Start a transfer</Button>
                <Link href={`/${locale}/help`} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Help
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card data-testid="transfers-filter-empty-state">
            <CardContent>
              <p className="text-sm text-slate-600">No transfers match this filter.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((transfer) => {
            const status = resolveUserStatusModel(transfer.status, transfer.providerPayoutStatus);
            const updatedAt = transfer.updatedAt ?? transfer.createdAt;
            const actionHref = `/${locale}/transfer/${transfer.id}`;
            return (
              <Card key={transfer.id} className="transition hover:border-slate-300">
                <CardContent>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-900">{transfer.referenceCode}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {transfer.recipientCountry ?? "—"} · {formatRelativeTime(updatedAt, locale)}
                      </p>
                    </div>
                    <Badge className={statusTone(status.key)}>{status.label}</Badge>
                  </div>

                  <p className="mt-3 text-xs font-medium text-slate-600">{status.substatus}</p>

                  <div className="mt-3 grid gap-3 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-slate-400">Amount sent</p>
                      <p className="font-semibold text-slate-900">
                        {transfer.sendAmount != null && transfer.fromAsset
                          ? formatMoney(transfer.sendAmount, transfer.fromAsset, locale)
                          : "Open transfer"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Recipient gets</p>
                      <p className="font-semibold text-slate-900">
                        {transfer.recipientGets != null && transfer.toAsset
                          ? formatMoney(transfer.recipientGets, transfer.toAsset, locale)
                          : "Open transfer"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Destination</p>
                      <p className="font-semibold text-slate-900">{transfer.recipientCountry ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Last updated</p>
                      <p className="font-semibold text-slate-900">{formatDateTime(updatedAt, locale)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {resolveProviderLabel(transfer.providerPayoutProvider)}
                    </p>
                    <Button href={actionHref} variant="secondary" size="sm">
                      {status.actionLabel}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/src/lib/i18n/messages";

type WebhookRow = {
  id: string;
  receivedAt: string;
  provider: string;
  transferId: string;
  status: string;
  reason: string | null;
};

type Messages = {
  adminPayoutWebhookLoadingLabel: string;
  adminPayoutWebhookEmptyLabel: string;
  adminPayoutWebhookStatusLabel: string;
  adminPayoutWebhookProviderLabel: string;
  adminPayoutWebhookAllLabel: string;
  adminPayoutWebhookReceivedLabel: string;
  adminPayoutWebhookEventIdLabel: string;
  adminPayoutWebhookTransferLabel: string;
  adminPayoutWebhookReasonLabel: string;
  adminPayoutWebhookFilterLabel: string;
};

type Props = {
  locale: Locale;
  messages: Messages;
};

export default function AdminPayoutWebhookTable({ locale, messages }: Props) {
  const [rows, setRows] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [sinceFilter, setSinceFilter] = useState("");

  const providers = useMemo(() => {
    const unique = new Set(rows.map((row) => row.provider));
    return ["ALL", ...Array.from(unique)];
  }, [rows]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (statusFilter !== "ALL") {
      params.set("status", statusFilter);
    }
    if (providerFilter !== "ALL") {
      params.set("provider", providerFilter);
    }
    if (sinceFilter.trim()) {
      params.set("since", sinceFilter.trim());
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
  }, [statusFilter, providerFilter, sinceFilter]);

  if (loading) {
    return (
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        {messages.adminPayoutWebhookLoadingLabel}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
        {messages.adminPayoutWebhookEmptyLabel}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        {messages.adminPayoutWebhookEmptyLabel}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <label className="text-xs font-semibold text-slate-500">
          {messages.adminPayoutWebhookStatusLabel}
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        >
          {["ALL", "processed", "deduped", "rejected"].map((status) => (
            <option key={status} value={status}>
              {status === "ALL" ? messages.adminPayoutWebhookAllLabel : status}
            </option>
          ))}
        </select>
        <label className="text-xs font-semibold text-slate-500">
          {messages.adminPayoutWebhookProviderLabel}
        </label>
        <select
          value={providerFilter}
          onChange={(event) => setProviderFilter(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
        >
          {providers.map((provider) => (
            <option key={provider} value={provider}>
              {provider === "ALL" ? messages.adminPayoutWebhookAllLabel : provider}
            </option>
          ))}
        </select>
        <label className="text-xs font-semibold text-slate-500">
          {messages.adminPayoutWebhookFilterLabel}
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
              <th className="pb-3">{messages.adminPayoutWebhookReceivedLabel}</th>
              <th className="pb-3">{messages.adminPayoutWebhookEventIdLabel}</th>
              <th className="pb-3">{messages.adminPayoutWebhookTransferLabel}</th>
              <th className="pb-3">{messages.adminPayoutWebhookStatusLabel}</th>
              <th className="pb-3">{messages.adminPayoutWebhookReasonLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="py-3 text-xs text-slate-500">
                  {new Date(row.receivedAt).toLocaleString(
                    locale === "fr" ? "fr-FR" : "en-US"
                  )}
                </td>
                <td className="py-3 text-xs text-slate-600">
                  <Link
                    href={`/${locale}/admin/webhooks/payouts/${row.id}`}
                    className="font-semibold text-emerald-700"
                  >
                    {row.id}
                  </Link>
                </td>
                <td className="py-3 text-xs text-slate-600">{row.transferId}</td>
                <td className="py-3 text-xs text-slate-600">{row.status}</td>
                <td className="py-3 text-xs text-slate-600">{row.reason ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

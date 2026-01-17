"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { formatDateTime, formatMoney } from "@/src/lib/format";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

type TransferEvent = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

type QuoteSummary = {
  id: string;
  fromAsset: { code: string; name: string; decimals: number };
  toAsset: { code: string; name: string; decimals: number };
  sendAmount: number;
  appliedRate: number;
  totalFee: number;
  recipientGets: number;
  rateTimestamp: string;
  expiresAt: string;
  createdAt: string;
};

type TransferSummary = {
  reference: string;
  status: string;
  payoutRail: string;
  createdAt: string;
  updatedAt: string;
};

type TransferLookupResponse = {
  transfer: TransferSummary;
  quote: QuoteSummary;
  events: TransferEvent[];
};

type LookupError = "not_found" | "generic";

const statusStyles: Record<string, string> = {
  READY: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
  CANCELED: "bg-slate-200 text-slate-700",
  DRAFT: "bg-slate-200 text-slate-700",
  EXPIRED: "bg-slate-200 text-slate-700",
};

export default function TrackTransferPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useMemo<Locale>(() => {
    const value = params?.locale;
    if (Array.isArray(value)) {
      return value[0] === "fr" ? "fr" : "en";
    }
    return value === "fr" ? "fr" : "en";
  }, [params]);
  const messages = getMessages(locale);
  const initialReference = useMemo(
    () => searchParams?.get("reference")?.trim().toUpperCase() ?? "",
    [searchParams]
  );

  const [reference, setReference] = useState(initialReference);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferLookupResponse | null>(null);
  const [error, setError] = useState<LookupError | null>(null);

  const statusLabels = useMemo(
    () => ({
      READY: messages.statusReadyLabel,
      PROCESSING: messages.statusProcessingLabel,
      COMPLETED: messages.statusCompletedLabel,
      FAILED: messages.statusFailedLabel,
      CANCELED: messages.statusCanceledLabel,
      DRAFT: messages.statusDraftLabel,
      EXPIRED: messages.statusExpiredLabel,
    }),
    [messages]
  );

  const payoutRailLabels = useMemo(
    () => ({
      BANK: messages.payoutRailBankLabel,
      MOBILE_MONEY: messages.payoutRailMobileMoneyLabel,
      LIGHTNING: messages.payoutRailLightningLabel,
    }),
    [messages]
  );

  const resolveEventMessage = useCallback(
    (event: TransferEvent, quote: QuoteSummary) => {
      switch (event.type) {
        case "CREATED":
          return messages.transferCreatedEvent;
        case "QUOTE_LOCKED":
          return messages.quoteLockedEvent(formatDateTime(quote.expiresAt, locale));
        case "INVOICE_ISSUED":
          return messages.invoiceIssuedEvent;
        case "PAID":
          return messages.transferPaidEvent;
        case "PROCESSING":
          return messages.transferProcessingEvent;
        case "COMPLETED":
          return messages.transferCompletedEvent;
        case "FAILED":
          return messages.transferFailedEvent;
        case "CANCELED":
          return messages.transferCanceledEvent;
        default:
          return event.message;
      }
    },
    [locale, messages]
  );

  const handleLookup = useCallback(
    async (value?: string) => {
      const lookupValue = value ?? reference;
      if (!lookupValue) {
        setError("generic");
        return;
      }
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch(
          `/api/transfers/lookup?reference=${encodeURIComponent(lookupValue)}`
        );
        const payload = (await res.json().catch(() => null)) as
          | TransferLookupResponse
          | { error?: string }
          | null;
        if (!res.ok) {
          setError(res.status === 404 ? "not_found" : "generic");
          return;
        }
        if (payload && "transfer" in payload) {
          setResult(payload);
        }
      } catch {
        setError("generic");
      } finally {
        setLoading(false);
      }
    },
    [reference]
  );

  useEffect(() => {
    if (initialReference) {
      setReference(initialReference);
      void handleLookup(initialReference);
    }
  }, [handleLookup, initialReference]);

  const errorMessage =
    error === "not_found"
      ? messages.trackNotFoundLabel
      : error
        ? messages.trackErrorLabel
        : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e6f7f1,_#f8fafc_55%,_#fff)] text-slate-900">
      <main className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
            {messages.trackTitle}
          </p>
          <h1 className="font-[var(--font-display)] text-3xl text-slate-900">
            {messages.trackSubtitle}
          </h1>
          <p className="text-sm text-slate-600">{messages.trackHelperText}</p>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]">
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {messages.trackInputLabel}
            <input
              type="text"
              value={reference}
              onChange={(event) => setReference(event.target.value.toUpperCase())}
              placeholder={messages.trackInputPlaceholder}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              aria-label={messages.trackInputLabel}
            />
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleLookup()}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              {messages.trackSubmitLabel}
            </button>
            <Link
              href={`/${locale}`}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              {messages.trackBackHomeButton}
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 space-y-3 animate-pulse">
              <div className="h-6 w-40 rounded bg-slate-100" />
              <div className="h-24 rounded-2xl bg-slate-100" />
              <div className="h-32 rounded-2xl bg-slate-100" />
            </div>
          ) : null}

          {errorMessage ? (
            <p className="mt-6 text-sm text-rose-600">{errorMessage}</p>
          ) : null}
        </div>

        {result ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {messages.timelineLabel}
                </p>
                <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  {result.events.length}
                </span>
              </div>
              <div className="mt-4 space-y-4 border-l border-slate-200 pl-4">
                {result.events.length > 0 ? (
                  result.events.map((event) => (
                    <div key={event.id} className="relative">
                      <span className="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {resolveEventMessage(event, result.quote)}
                        </p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                          {formatDateTime(event.createdAt, locale)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    {messages.timelineEmptyLabel}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {messages.transferDetailsLabel}
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>{messages.referenceCodeLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {result.transfer.reference}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{messages.transferStatusLabel}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${statusStyles[result.transfer.status] ?? "bg-slate-200 text-slate-700"}`}
                    >
                      {statusLabels[result.transfer.status] ??
                        result.transfer.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{messages.payoutSummaryLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {payoutRailLabels[
                        result.transfer.payoutRail as keyof typeof payoutRailLabels
                      ] ?? result.transfer.payoutRail}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {messages.lockedQuoteSummaryLabel}
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>{messages.receiptSendAmountLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(
                        result.quote.sendAmount,
                        result.quote.fromAsset.code,
                        locale,
                        result.quote.fromAsset.decimals
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{messages.receiptTotalFeesLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(
                        result.quote.totalFee,
                        result.quote.fromAsset.code,
                        locale,
                        result.quote.fromAsset.decimals
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{messages.receiptRecipientGetsLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(
                        result.quote.recipientGets,
                        result.quote.toAsset.code,
                        locale,
                        result.quote.toAsset.decimals
                      )}
                    </span>
                  </div>
                  <div className="pt-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    {messages.rateLockedAtLabel}:{" "}
                    {formatDateTime(result.quote.rateTimestamp, locale)}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

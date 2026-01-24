"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDateTime, formatMoney } from "@/src/lib/format";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

type TransferEvent = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

type TransferSummary = {
  id: string;
  reference: string;
  quoteId: string;
  status: string;
  payoutRail: string;
  recipientName: string;
  recipientCountry: string;
  recipientPhone: string | null;
  recipientBankName: string | null;
  recipientBankAccount: string | null;
  recipientMobileMoneyProvider: string | null;
  recipientMobileMoneyNumber: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};

type QuoteSummary = {
  id: string;
  rail: string;
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

type CryptoPayoutSummary = {
  id: string;
  transferId: string;
  network: string;
  invoice: string | null;
  paymentHash: string | null;
  address: string | null;
  amountSats: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type TransferReceiptResponse = {
  transfer: TransferSummary;
  quote: QuoteSummary;
  cryptoPayout: CryptoPayoutSummary | null;
  events: TransferEvent[];
};

type ReceiptError = "not_found" | "expired" | "generic";

const statusStyles: Record<string, string> = {
  READY: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
  CANCELED: "bg-slate-200 text-slate-700",
  DRAFT: "bg-slate-200 text-slate-700",
  EXPIRED: "bg-slate-200 text-slate-700",
};

const formatNumber = (value: number, digits = 2, locale: Locale = "en") =>
  new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export default function TransferReceiptPage() {
  const params = useParams();
  const locale = useMemo<Locale>(() => {
    const value = params?.locale;
    if (Array.isArray(value)) {
      return value[0] === "fr" ? "fr" : "en";
    }
    return value === "fr" ? "fr" : "en";
  }, [params]);
  const messages = getMessages(locale);
  const receiptCopy = useMemo(
    () =>
      locale === "fr"
        ? {
            cryptoPayoutLabel: "Paiement crypto",
            cryptoNetworkLabel: "Réseau",
            cryptoCreatedAtLabel: "Créé le",
            mockPayProcessingLabel: "Traitement...",
            shareTransferLabel: "Partager le transfert",
            shareTransferLinkLabel: "Lien de partage",
            transferHelpSubtitle:
              "Besoin de modifier le bénéficiaire ou comprendre un retard ? Notre équipe peut aider.",
          }
        : {
            cryptoPayoutLabel: "Crypto payout",
            cryptoNetworkLabel: "Network",
            cryptoCreatedAtLabel: "Created at",
            mockPayProcessingLabel: "Processing...",
            shareTransferLabel: "Share transfer",
            shareTransferLinkLabel: "Share link",
            transferHelpSubtitle:
              "Need to update recipient details or understand a delay? Our team can help.",
          },
    [locale]
  );
  const transferId = useMemo(() => {
    const value = params?.id;
    if (Array.isArray(value)) {
      return value[0] ?? "";
    }
    return typeof value === "string" ? value : "";
  }, [params]);
  const [requestState, setRequestState] = useState<{
    id: string;
    data: TransferReceiptResponse | null;
    error: ReceiptError | null;
  } | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | "invoice" | null>(
    null
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const transferCompletedLogged = useRef(false);

  const statusLabels = useMemo<Record<string, string>>(
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

  const fetchReceipt = useCallback(async (id: string) => {
    const res = await fetch(`/api/transfers/${id}`);
    const payload = (await res.json().catch(() => null)) as
      | TransferReceiptResponse
      | { error?: string; expired?: boolean }
      | null;
    const expired = Boolean(
      payload &&
        typeof payload === "object" &&
        "expired" in payload &&
        (payload as { expired?: boolean }).expired
    );
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("not_found");
      }
      if (res.status === 410 || expired) {
        throw new Error("expired");
      }
      throw new Error("generic");
    }
    return payload as TransferReceiptResponse;
  }, []);

  useEffect(() => {
    if (!transferId) {
      return undefined;
    }
    let active = true;

    fetchReceipt(transferId)
      .then((payload) => {
        if (!active) {
          return;
        }
        setRequestState({ id: transferId, data: payload, error: null });
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const code = (err as { message?: string }).message;
        if (code === "not_found" || code === "expired" || code === "generic") {
          setRequestState({ id: transferId, data: null, error: code as ReceiptError });
          return;
        }
        setRequestState({ id: transferId, data: null, error: "generic" });
      });

    return () => {
      active = false;
    };
  }, [fetchReceipt, transferId]);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timer = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyText = async (value: string) => {
    if (!value) {
      return false;
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        // Fall through to manual copy.
      }
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  };

  const handleCopy = async (value: string, kind: "code" | "link") => {
    const success = await copyText(value);
    if (success) {
      setCopied(kind);
    }
  };

  const handleCopyInvoice = async () => {
    if (!requestState?.data?.cryptoPayout?.invoice) {
      return;
    }
    const success = await copyText(requestState.data.cryptoPayout.invoice);
    if (success) {
      setCopied("invoice");
    }
  };

  const handleMockPay = useCallback(async () => {
    if (!requestState?.data?.cryptoPayout?.id) {
      return;
    }
    setIsSimulating(true);
    try {
      await fetch("/api/crypto/mock-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId: requestState.data.cryptoPayout.id }),
      });
      void fetchReceipt(requestState.id).then((payload) => {
        setRequestState({ id: requestState.id, data: payload, error: null });
      });
    } catch {
      // No-op.
    } finally {
      setIsSimulating(false);
    }
  }, [fetchReceipt, requestState]);

  const payload = requestState?.data ?? null;
  const transfer = payload?.transfer ?? null;
  const quote = payload?.quote ?? null;
  const events = payload?.events ?? [];
  const cryptoPayout = payload?.cryptoPayout ?? null;
  const statusLabel = transfer?.status
    ? statusLabels[transfer.status] ?? transfer.status
    : "—";
  const statusStyle = transfer?.status
    ? statusStyles[transfer.status] ?? "bg-slate-200 text-slate-700"
    : "bg-slate-200 text-slate-700";
  const payoutLabel = transfer?.payoutRail
    ? payoutRailLabels[transfer.payoutRail as keyof typeof payoutRailLabels] ??
      transfer.payoutRail
    : "—";
  const isComplete = transfer?.status === "COMPLETED";
  const isFailed = transfer?.status === "FAILED";
  const isExpired = requestState?.error === "expired";

  useEffect(() => {
    if (!transfer || !isComplete || transferCompletedLogged.current) {
      return;
    }
    transferCompletedLogged.current = true;
  }, [isComplete, transfer]);

  const summaryRows = transfer && quote
    ? [
        {
          label: messages.transferStatusLabel,
          value: (
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${statusStyle}`}>
              {statusLabel}
            </span>
          ),
        },
        {
          label: messages.referenceCodeLabel,
          value: (
            <span className="text-sm font-semibold text-slate-900">
              {transfer.reference}
            </span>
          ),
        },
        {
          label: messages.transferCreatedLabel,
          value: (
            <span className="text-sm text-slate-700">
              {formatDateTime(transfer.createdAt, locale)}
            </span>
          ),
        },
        {
          label: messages.payoutSummaryLabel,
          value: (
            <span className="text-sm text-slate-700">{payoutLabel}</span>
          ),
        },
        {
          label: messages.recipientNameLabel,
          value: (
            <span className="text-sm text-slate-700">{transfer.recipientName}</span>
          ),
        },
        {
          label: messages.recipientCountryLabel,
          value: (
            <span className="text-sm text-slate-700">{transfer.recipientCountry}</span>
          ),
        },
        {
          label: messages.recipientPhoneLabel,
          value: (
            <span className="text-sm text-slate-700">
              {transfer.recipientPhone ?? "—"}
            </span>
          ),
        },
        {
          label: messages.bankNameLabel,
          value: (
            <span className="text-sm text-slate-700">
              {transfer.recipientBankName ?? "—"}
            </span>
          ),
        },
        {
          label: messages.bankAccountLabel,
          value: (
            <span className="text-sm text-slate-700">
              {transfer.recipientBankAccount ?? "—"}
            </span>
          ),
        },
        {
          label: messages.mobileMoneyNumberLabel,
          value: (
            <span className="text-sm text-slate-700">
              {transfer.recipientMobileMoneyNumber ?? "—"}
            </span>
          ),
        },
        {
          label: messages.memoLabel,
          value: (
            <span className="text-sm text-slate-700">{transfer.memo ?? "—"}</span>
          ),
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e6f7f1,_#f8fafc_55%,_#fff)] text-slate-900">
      <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
              {messages.transferReceiptTitle}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              {messages.transferReceiptTitle}
            </h1>
          </div>
          <Link
            href={`/${locale}`}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-white/20"
          >
            {messages.receiptBackHomeButton}
          </Link>
        </div>

        {requestState?.error === "not_found" ? (
          <div className="mt-10 rounded-3xl border border-white/15 bg-white/10 p-8 text-white">
            <p className="text-sm uppercase tracking-[0.28em] text-white/70">
              {messages.receiptNotFoundLabel}
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              {messages.receiptNotFoundLabel}
            </h2>
            <p className="mt-4 max-w-2xl text-sm text-white/70">
              {messages.receiptLoadError}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/track`}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-white/20"
              >
                {messages.trackTransferLinkLabel}
              </Link>
              <Link
                href={`/${locale}`}
                className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-50 transition hover:bg-emerald-500/30"
              >
                {messages.receiptBackHomeButton}
              </Link>
            </div>
          </div>
        ) : null}

        {isExpired ? (
          <div className="mt-10 rounded-3xl border border-white/15 bg-white/10 p-8 text-white">
            <p className="text-sm uppercase tracking-[0.28em] text-white/70">
              {messages.receiptExpiredLabel}
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              {messages.receiptExpiredLabel}
            </h2>
            <p className="mt-4 max-w-2xl text-sm text-white/70">
              {messages.quoteExpiredError}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/${locale}`}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-white/20"
              >
                {messages.receiptBackHomeButton}
              </Link>
            </div>
          </div>
        ) : null}

        {payload && transfer && quote ? (
          <section className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-[0_25px_60px_-40px_rgba(15,23,42,0.6)]">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {messages.transferDetailsLabel}
                  </p>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${statusStyle}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="font-[var(--font-display)] text-4xl leading-tight sm:text-5xl">
                    {formatMoney(
                      quote.recipientGets,
                      quote.toAsset.code,
                      locale,
                      quote.toAsset.decimals
                    )}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {messages.receiptRecipientGetsLabel}: {" "}
                    {formatMoney(
                      quote.sendAmount,
                      quote.fromAsset.code,
                      locale,
                      quote.fromAsset.decimals
                    )}
                  </p>
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
                        quote.sendAmount,
                        quote.fromAsset.code,
                        locale,
                        quote.fromAsset.decimals
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{messages.receiptAppliedRateLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {formatNumber(quote.appliedRate, 4, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{messages.receiptTotalFeesLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(
                        quote.totalFee,
                        quote.fromAsset.code,
                        locale,
                        quote.fromAsset.decimals
                      )}
                    </span>
                  </div>
                  <div className="pt-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    {messages.rateLockedAtLabel}: {" "}
                    {formatDateTime(quote.rateTimestamp, locale)}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {messages.timelineLabel}
                </p>
                <div className="mt-4 space-y-4 border-l border-slate-200 pl-4">
                  {events.length > 0 ? (
                    events.map((event) => (
                      <div key={event.id} className="relative">
                        <span className="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-sm font-semibold text-slate-900">
                            {event.message}
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
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {messages.transferDetailsLabel}
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {summaryRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-4"
                    >
                      <span>{row.label}</span>
                      <span className="text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {cryptoPayout ? (
                <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    {receiptCopy.cryptoPayoutLabel}
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>{receiptCopy.cryptoNetworkLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {cryptoPayout.network}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.lightningAmountLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {cryptoPayout.amountSats.toLocaleString(locale)} sats
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.lightningStatusLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {cryptoPayout.status}
                      </span>
                    </div>
                    <div className="pt-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      {receiptCopy.cryptoCreatedAtLabel}: {" "}
                      {formatDateTime(cryptoPayout.createdAt, locale)}
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {cryptoPayout.invoice ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {messages.lightningInvoiceLabel}
                        </p>
                        <p className="mt-2 break-all text-xs text-slate-700">
                          {cryptoPayout.invoice}
                        </p>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-3">
                      {cryptoPayout.invoice ? (
                        <button
                          type="button"
                          onClick={handleCopyInvoice}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                        >
                          {copied === "invoice"
                            ? messages.copiedLabel
                            : messages.copyInvoiceButton}
                        </button>
                      ) : null}
                      {cryptoPayout.invoice ? (
                        <button
                          type="button"
                          onClick={handleMockPay}
                          disabled={isSimulating}
                          className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSimulating
                            ? receiptCopy.mockPayProcessingLabel
                            : messages.simulatePaymentButton}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {receiptCopy.shareTransferLabel}
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4">
                    <span>{messages.referenceCodeLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {transfer.reference}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>{receiptCopy.shareTransferLinkLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {`${window.location.origin}/${locale}/transfer/${transfer.id}`}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleCopy(transfer.reference, "code")}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  >
                    {copied === "code"
                      ? messages.copiedLabel
                      : messages.copyReferenceButton}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `${window.location.origin}/${locale}/transfer/${transfer.id}`,
                        "link"
                      )
                    }
                    className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-100 transition hover:bg-emerald-500/30"
                  >
                    {copied === "link"
                      ? messages.copiedLabel
                      : messages.copyLinkButton}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {messages.navHelpLabel}
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  {receiptCopy.transferHelpSubtitle}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/${locale}/help`}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  >
                    {messages.footerContactLinkLabel}
                  </Link>
                  {isComplete ? (
                    <Link
                      href={`/${locale}`}
                      className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-100 transition hover:bg-emerald-500/30"
                    >
                      {messages.navGetStartedLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {!payload && !requestState?.error ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="h-36 rounded-3xl bg-white/10" />
              <div className="h-40 rounded-3xl bg-white/10" />
            </div>
            <div className="space-y-6">
              <div className="h-48 rounded-3xl bg-white/10" />
              <div className="h-40 rounded-3xl bg-white/10" />
            </div>
          </div>
        ) : null}

        {isFailed ? (
          <div className="mt-10 rounded-3xl border border-rose-200/60 bg-rose-50 px-6 py-5">
            <div className="flex flex-col gap-2 text-rose-700">
              <p className="text-xs font-semibold uppercase tracking-[0.24em]">
                {messages.transferFailedEvent}
              </p>
              <p className="text-base font-semibold">
                {messages.transferFailedEvent}
              </p>
              <p className="text-sm text-rose-600">
                {messages.transferUpdateError}
              </p>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

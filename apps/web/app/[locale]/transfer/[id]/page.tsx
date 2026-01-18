"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatDateTime, formatMoney } from "@/src/lib/format";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";
import { ALLOW_SIMULATED_PAYOUTS } from "@/src/lib/runtime";

type TransferEvent = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

type TransferSummary = {
  id: string;
  referenceCode: string;
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
  recipientLightningInvoice: string | null;
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
  const [resendState, setResendState] = useState<
    "idle" | "sending" | "sent" | "error" | "rate"
  >("idle");
  const { data: session } = useSession();

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

  const fetchReceipt = useCallback(async (id: string) => {
    const res = await fetch(`/api/transfers/${id}`);
    const payload = (await res.json().catch(() => null)) as
      | TransferReceiptResponse
      | { error?: string; expired?: boolean }
      | null;
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("not_found");
      }
      const isExpiredPayload =
        typeof payload === "object" &&
        payload !== null &&
        "expired" in payload &&
        (payload as { expired?: boolean }).expired === true;

      if (res.status === 410 || isExpiredPayload) {
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
    setCopied(success ? kind : null);
  };

  const handleCopyInvoice = async (value: string) => {
    const success = await copyText(value);
    setCopied(success ? "invoice" : null);
  };

  const handleSimulatePayment = useCallback(async () => {
    if (!transferId) {
      return;
    }
    setIsSimulating(true);
    try {
      const res = await fetch("/api/crypto/mock-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferId }),
      });
      if (!res.ok) {
        return;
      }
      const updated = await fetchReceipt(transferId);
      setRequestState({ id: transferId, data: updated, error: null });
    } catch {
      // Ignore dev-only failures.
    } finally {
      setIsSimulating(false);
    }
  }, [fetchReceipt, transferId]);

  const handleResendReceipt = useCallback(async () => {
    if (!transferId) {
      return;
    }
    setResendState("sending");
    try {
      const res = await fetch(`/api/transfers/${transferId}/receipt`, {
        method: "POST",
      });
      if (res.status === 429) {
        setResendState("rate");
        return;
      }
      if (!res.ok) {
        setResendState("error");
        return;
      }
      setResendState("sent");
    } catch {
      setResendState("error");
    }
  }, [transferId]);

  const activeState = requestState?.id === transferId ? requestState : null;
  const data = activeState?.data ?? null;
  const error = activeState?.error ?? null;
  const resolvedError = transferId ? error : "not_found";
  const isLoading = Boolean(transferId) && !activeState;
  const isDev = ALLOW_SIMULATED_PAYOUTS;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-16 lg:px-8">
          <div className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="mt-4 h-10 w-52 rounded bg-white/10" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="h-24 rounded-2xl bg-white/10" />
              <div className="h-24 rounded-2xl bg-white/10" />
            </div>
            <div className="mt-6 h-48 rounded-2xl bg-white/10" />
          </div>
          <p className="text-xs font-medium text-slate-500">
            {messages.receiptLoadingLabel}
          </p>
        </main>
      </div>
    );
  }

  if (resolvedError) {
    const errorMessage =
      resolvedError === "not_found"
        ? messages.receiptNotFoundLabel
        : resolvedError === "expired"
          ? messages.receiptExpiredLabel
          : messages.receiptLoadError;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-6 py-16 text-center lg:px-8">
          <h1 className="text-2xl font-semibold">{errorMessage}</h1>
          <Link
            href={`/${locale}`}
            className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            {messages.receiptBackHomeButton}
          </Link>
        </main>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { transfer, quote, events, cryptoPayout } = data;
  const lightningStatusLabel = cryptoPayout
    ? cryptoPayout.status === "PAID"
      ? messages.lightningPaidLabel
      : cryptoPayout.status === "CREATED" || cryptoPayout.status === "REQUESTED"
        ? messages.lightningWaitingLabel
        : cryptoPayout.status.replaceAll("_", " ")
    : null;
  const canSimulatePayment =
    isDev &&
    cryptoPayout &&
    !["PAID", "EXPIRED", "FAILED"].includes(cryptoPayout.status);
  const resolveEventMessage = (event: TransferEvent) => {
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
  };
  const statusStyle = statusStyles[transfer.status] ?? "bg-slate-200 text-slate-700";
  const statusLabel =
    statusLabels[transfer.status as keyof typeof statusLabels] ??
    transfer.status.replaceAll("_", " ");
  const referenceCode = transfer.referenceCode;
  const shareLink =
    typeof window === "undefined"
      ? `/${locale}/transfer/${transfer.id}`
      : `${window.location.origin}/${locale}/transfer/${transfer.id}`;
  const eventByType = new Map(events.map((event) => [event.type, event]));
  const finalStatus =
    transfer.status === "FAILED" || transfer.status === "CANCELED"
      ? "FAILED"
      : transfer.status === "EXPIRED"
        ? "EXPIRED"
        : transfer.status === "COMPLETED"
          ? "COMPLETED"
          : "COMPLETED";
  const finalLabel =
    finalStatus === "FAILED"
      ? messages.lifecycleFailedLabel
      : finalStatus === "EXPIRED"
        ? messages.lifecycleExpiredLabel
        : messages.lifecycleCompletedLabel;
  const finalDescription =
    finalStatus === "FAILED"
      ? messages.lifecycleFailedDescription
      : finalStatus === "EXPIRED"
        ? messages.lifecycleExpiredDescription
        : messages.lifecycleCompletedDescription;
  const lifecycleSteps = [
    {
      key: "CREATED",
      label: messages.lifecycleCreatedLabel,
      description: messages.lifecycleCreatedDescription,
      timestamp: eventByType.get("CREATED")?.createdAt ?? transfer.createdAt,
    },
    {
      key: "QUOTED",
      label: messages.lifecycleQuotedLabel,
      description: messages.lifecycleQuotedDescription,
      timestamp: quote.createdAt,
    },
    {
      key: "INITIATED",
      label: messages.lifecycleInitiatedLabel,
      description: messages.lifecycleInitiatedDescription,
      timestamp:
        eventByType.get("QUOTE_LOCKED")?.createdAt ?? transfer.createdAt,
    },
    {
      key: "PENDING",
      label: messages.lifecyclePendingLabel,
      description: messages.lifecyclePendingDescription,
      timestamp:
        eventByType.get("PROCESSING")?.createdAt ??
        (transfer.status === "PROCESSING" ? transfer.updatedAt : null),
    },
    {
      key: finalStatus,
      label: finalLabel,
      description: finalDescription,
      timestamp:
        eventByType.get(finalStatus)?.createdAt ??
        (["COMPLETED", "FAILED", "EXPIRED", "CANCELED"].includes(transfer.status)
          ? transfer.updatedAt
          : null),
    },
  ];
  const stageIndexByStatus: Record<string, number> = {
    DRAFT: 0,
    READY: 2,
    PROCESSING: 3,
    COMPLETED: 4,
    FAILED: 4,
    EXPIRED: 4,
    CANCELED: 4,
  };
  const currentStageIndex =
    stageIndexByStatus[transfer.status] ?? stageIndexByStatus.READY;
  const nextStepMessage =
    transfer.status === "PROCESSING"
      ? messages.nextStepProcessing
      : transfer.status === "COMPLETED"
        ? messages.nextStepCompleted
        : transfer.status === "FAILED" || transfer.status === "CANCELED"
          ? messages.nextStepFailed
          : transfer.status === "EXPIRED"
            ? messages.nextStepExpired
            : messages.nextStepReady;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-16 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.9)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">
                {messages.transferReceiptTitle}
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                {referenceCode}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {messages.referenceCodeLabel}
              </p>
              <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                <div>
                  {messages.createdAtLabel}:{" "}
                  {formatDateTime(transfer.createdAt, locale)}
                </div>
                <div>
                  {messages.updatedAtLabel}:{" "}
                  {formatDateTime(transfer.updatedAt, locale)}
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <p className="text-xs font-medium text-slate-400">
                  {messages.nextStepTitle}
                </p>
                <p className="mt-1">{nextStepMessage}</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle}`}
              >
                {statusLabel}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(referenceCode, "code")}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20"
                >
                  {copied === "code"
                    ? messages.copiedLabel
                    : messages.copyReferenceButton}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(shareLink, "link")}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20"
                >
                  {copied === "link"
                    ? messages.copiedLabel
                    : messages.copyLinkButton}
                </button>
                {session?.user ? (
                  <button
                    type="button"
                    onClick={handleResendReceipt}
                    disabled={resendState === "sending"}
                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed"
                  >
                    {resendState === "sending"
                      ? messages.receiptResendLoading
                      : messages.receiptResendButton}
                  </button>
                ) : null}
              </div>
              {session?.user && resendState !== "idle" ? (
                <p className="text-xs text-slate-400">
                  {resendState === "sent"
                    ? messages.receiptResendSuccess
                    : resendState === "rate"
                      ? messages.receiptResendRateLimited
                      : resendState === "error"
                        ? messages.receiptResendError
                        : null}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-400">
                  {messages.lifecycleTitle}
                </p>
                <span className="text-xs text-slate-500">{referenceCode}</span>
              </div>
              <div className="mt-5 space-y-4">
                {lifecycleSteps.map((step, index) => {
                  const isComplete = index < currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  const indicatorClass = isComplete
                    ? "bg-emerald-400"
                    : isCurrent
                      ? "bg-amber-400"
                      : "bg-white/10";
                  const textClass = isComplete
                    ? "text-slate-100"
                    : isCurrent
                      ? "text-white"
                      : "text-slate-400";
                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-2.5 w-2.5 rounded-full ${indicatorClass}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className={`text-xs font-medium ${textClass}`}>
                            {step.label}
                          </p>
                          <span className="text-xs text-slate-500">
                            {step.timestamp
                              ? formatDateTime(step.timestamp, locale)
                              : "—"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-400">
                  {messages.timelineLabel}
                </p>
                <span className="text-xs text-slate-500">{events.length}</span>
              </div>
              <div className="mt-5 space-y-4 border-l border-white/10 pl-4">
                {events.length > 0 ? (
                  events.map((event) => (
                    <div key={event.id} className="relative">
                      <span className="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-white/60" />
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-sm font-semibold text-white">
                          {resolveEventMessage(event)}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {formatDateTime(event.createdAt, locale)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    {messages.timelineEmptyLabel}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-medium text-slate-400">
                {messages.recipientSummaryLabel}
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span>{messages.recipientNameLabel}</span>
                  <span className="font-semibold text-white">
                    {transfer.recipientName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{messages.recipientCountryLabel}</span>
                  <span className="font-semibold text-white">
                    {transfer.recipientCountry}
                  </span>
                </div>
                {transfer.recipientPhone ? (
                  <div className="flex items-center justify-between">
                    <span>{messages.recipientPhoneLabel}</span>
                    <span className="font-semibold text-white">
                      {transfer.recipientPhone}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span>{messages.payoutSummaryLabel}</span>
                  <span className="font-semibold text-white">
                    {payoutRailLabels[
                      transfer.payoutRail as keyof typeof payoutRailLabels
                    ] ?? transfer.payoutRail}
                  </span>
                </div>
                {transfer.recipientBankName ? (
                  <div className="flex items-center justify-between">
                    <span>{messages.bankNameLabel}</span>
                    <span className="font-semibold text-white">
                      {transfer.recipientBankName}
                    </span>
                  </div>
                ) : null}
                {transfer.recipientBankAccount ? (
                  <div className="flex items-center justify-between">
                    <span>{messages.bankAccountLabel}</span>
                    <span className="font-semibold text-white">
                      {transfer.recipientBankAccount}
                    </span>
                  </div>
                ) : null}
                {transfer.recipientMobileMoneyProvider ? (
                  <div className="flex items-center justify-between">
                    <span>{messages.mobileMoneyProviderLabel}</span>
                    <span className="font-semibold text-white">
                      {transfer.recipientMobileMoneyProvider}
                    </span>
                  </div>
                ) : null}
                {transfer.recipientMobileMoneyNumber ? (
                  <div className="flex items-center justify-between">
                    <span>{messages.mobileMoneyNumberLabel}</span>
                    <span className="font-semibold text-white">
                      {transfer.recipientMobileMoneyNumber}
                    </span>
                  </div>
                ) : null}
                {transfer.recipientLightningInvoice ? (
                  <div className="flex items-center justify-between">
                    <span>{messages.recipientLightningInvoiceLabel}</span>
                    <span className="font-semibold text-white">
                      {transfer.recipientLightningInvoice}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {cryptoPayout ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs font-medium text-slate-400">
                  {messages.lightningInvoiceLabel}
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="break-all font-mono text-xs text-slate-100">
                      {cryptoPayout.invoice ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{messages.lightningAmountLabel}</span>
                    <span className="font-semibold text-white">
                      {formatNumber(cryptoPayout.amountSats, 0, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{messages.lightningStatusLabel}</span>
                    <span className="font-semibold text-white">
                      {lightningStatusLabel}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyInvoice(cryptoPayout.invoice ?? "")}
                    disabled={!cryptoPayout.invoice}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copied === "invoice"
                      ? messages.copiedLabel
                      : messages.copyInvoiceButton}
                  </button>
                  {isDev ? (
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={isSimulating || !canSimulatePayment}
                      className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {messages.simulatePaymentButton}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-medium text-slate-400">
                {messages.lockedQuoteSummaryLabel}
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span>{messages.receiptSendAmountLabel}</span>
                  <span className="font-semibold text-white">
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
                  <span className="font-semibold text-white">
                    1 {quote.fromAsset.code} ={" "}
                    {formatNumber(quote.appliedRate, 4, locale)}{" "}
                    {quote.toAsset.code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{messages.receiptTotalFeesLabel}</span>
                  <span className="font-semibold text-white">
                    {formatMoney(
                      quote.totalFee,
                      quote.fromAsset.code,
                      locale,
                      quote.fromAsset.decimals
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{messages.receiptRecipientGetsLabel}</span>
                  <span className="font-semibold text-white">
                    {formatMoney(
                      quote.recipientGets,
                      quote.toAsset.code,
                      locale,
                      quote.toAsset.decimals
                    )}
                  </span>
                </div>
                <div className="pt-2 text-xs text-slate-500">
                  {messages.expiresAtLabel}:{" "}
                  {formatDateTime(quote.expiresAt, locale)}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

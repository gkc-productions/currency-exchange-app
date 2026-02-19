"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatDateTime, formatMoney } from "@/src/lib/format";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";
import { ALLOW_SIMULATED_PAYOUTS } from "@/src/lib/runtime";
import { resolveReceiptUiState } from "@/src/lib/receipt-ui";
import { copyText as copyTextSafe } from "@/src/lib/clipboard";
import AccountingPanel from "@/src/lib/accounting-ui";
import {
  parseTimelineMessage,
  resolveExecutePayoutUi,
  resolvePayoutAction,
  shouldShowPayoutInfo,
} from "@/src/lib/transfer-events-ui";
import {
  buildUserStatusTimeline,
  resolveUserStatusModel,
} from "@/src/lib/transfer-status-model";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { StatRow } from "@/components/ui/StatRow";

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
  providerPayoutId: string | null;
  providerPayoutStatus: string | null;
  providerPayoutProvider: string | null;
  providerPayoutUpdatedAt: string | null;
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
  fxMarginPct: number;
  rateSource: string;
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

type TimelineEvent = {
  type: string;
  message: string;
  createdAt: string;
};

type ReceiptSnapshot = {
  sendAmount: number;
  fromAsset: string;
  toAsset: string;
  appliedRate: number;
  marketRate: number;
  fxMarginPct: number;
  fixedFee: number;
  percentFee: number;
  totalFees: number;
  recipientGets: number;
  rateSource: string;
  lockedAt: string;
  fundingMethod?: string | null;
};

type ReceiptApiResponse = {
  transferId: string;
  referenceCode: string;
  status: string;
  receiptUrl?: string | null;
  snapshot?: ReceiptSnapshot | null;
};

type PayoutAttempt = {
  attemptNumber: number;
  providerKey: string;
  status: string;
  providerPayoutId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
};

type ReconciliationResponse = {
  transferId: string;
  status: string;
  providerPayoutId: string | null;
  providerPayoutStatus: string | null;
  providerPayoutProvider: string | null;
  providerPayoutUpdatedAt: string | null;
};

type ReceiptError = "not_found" | "expired" | "generic";
type ReceiptFetchError = "unauthorized" | "not_found" | "snapshot_missing" | "generic";

const statusStyles: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
};

const formatNumber = (value: number, digits = 2, locale: Locale = "en") =>
  new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

const formatRelativeUpdate = (value: string, locale: Locale) => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return "—";
  }
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) {
    const minutes = Math.max(1, Math.round(diff / minute));
    return locale === "fr" ? `Mis a jour il y a ${minutes} min` : `Updated ${minutes}m ago`;
  }
  if (diff < day) {
    const hours = Math.max(1, Math.round(diff / hour));
    return locale === "fr" ? `Mis a jour il y a ${hours} h` : `Updated ${hours}h ago`;
  }
  const days = Math.max(1, Math.round(diff / day));
  return locale === "fr" ? `Mis a jour il y a ${days} j` : `Updated ${days}d ago`;
};

export default function TransferReceiptPage() {
  const shouldLogRenders = process.env.NEXT_PUBLIC_DEV_RENDER_LOGS === "1";
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
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
  const [receiptState, setReceiptState] = useState<{
    id: string;
    data: ReceiptApiResponse | null;
    error: ReceiptFetchError | null;
  } | null>(null);
  const [receiptActionState, setReceiptActionState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [receiptActionError, setReceiptActionError] = useState<string | null>(
    null
  );
  const [issuedReceiptUrl, setIssuedReceiptUrl] = useState<string | null>(null);
  const [reconciliationState, setReconciliationState] = useState<{
    id: string;
    data: ReconciliationResponse | null;
    error: ReceiptFetchError | null;
  } | null>(null);
  const [attemptsState, setAttemptsState] = useState<{
    id: string;
    data: PayoutAttempt[] | null;
    error: ReceiptFetchError | null;
  } | null>(null);
  const [eventsState, setEventsState] = useState<{
    id: string;
    data: TimelineEvent[] | null;
    error: ReceiptFetchError | null;
  } | null>(null);
  const [executeState, setExecuteState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [cancelState, setCancelState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [reconcileState, setReconcileState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const [reconcileResult, setReconcileResult] = useState<{
    beforeStatus: string;
    afterStatus: string;
    providerStatus: string;
    receiptUrl?: string | null;
  } | null>(null);
  const [transferStatusOverride, setTransferStatusOverride] = useState<string | null>(
    null
  );
  const [forceStatus, setForceStatus] = useState<string>("COMPLETED");
  const [forceReason, setForceReason] = useState<string>("");
  const [forceState, setForceState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [forceError, setForceError] = useState<string | null>(null);
  const [forceResult, setForceResult] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { data: session } = useSession();

  const payoutRailLabels = useMemo(
    () => ({
      BANK: messages.payoutRailBankLabel,
      MOBILE_MONEY: messages.payoutRailMobileMoneyLabel,
      LIGHTNING: messages.payoutRailLightningLabel,
      CRYPTO: messages.payoutRailCryptoLabel,
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

  const fetchReceiptSnapshot = useCallback(async (id: string) => {
    const res = await fetch(`/api/transfers/${id}/receipt`, {
      cache: "no-store",
    });
    const payload = (await res.json().catch(() => null)) as
      | ReceiptApiResponse
      | { error?: string; errorCode?: string; message?: string }
      | null;
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("unauthorized");
      }
      if (res.status === 404) {
        throw new Error("not_found");
      }
      if (
        res.status === 409 &&
        payload &&
        typeof payload === "object" &&
        "errorCode" in payload &&
        payload.errorCode === "RECEIPT_SNAPSHOT_MISSING"
      ) {
        throw new Error("snapshot_missing");
      }
      throw new Error("generic");
    }
    return payload as ReceiptApiResponse;
  }, []);

  const fetchReconciliation = useCallback(async (id: string) => {
    const res = await fetch(`/api/transfers/${id}/reconciliation`, {
      cache: "no-store",
    });
    const payload = (await res.json().catch(() => null)) as
      | ReconciliationResponse
      | { error?: string }
      | null;
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("unauthorized");
      }
      if (res.status === 404) {
        throw new Error("not_found");
      }
      throw new Error("generic");
    }
    return payload as ReconciliationResponse;
  }, []);

  const fetchEvents = useCallback(async (id: string) => {
    const res = await fetch(`/api/transfers/${id}/events`, {
      cache: "no-store",
    });
    const payload = (await res.json().catch(() => null)) as
      | TimelineEvent[]
      | { error?: string }
      | null;
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("unauthorized");
      }
      if (res.status === 404) {
        throw new Error("not_found");
      }
      throw new Error("generic");
    }
    return payload as TimelineEvent[];
  }, []);

  const fetchAttempts = useCallback(async (id: string) => {
    const res = await fetch(`/api/transfers/${id}/attempts`, {
      cache: "no-store",
    });
    const payload = (await res.json().catch(() => null)) as
      | PayoutAttempt[]
      | { error?: string }
      | null;
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("unauthorized");
      }
      if (res.status === 404) {
        throw new Error("not_found");
      }
      throw new Error("generic");
    }
    return payload as PayoutAttempt[];
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
    if (!transferId) {
      return undefined;
    }
    let active = true;

    fetchReceiptSnapshot(transferId)
      .then((payload) => {
        if (!active) {
          return;
        }
        setReceiptState({ id: transferId, data: payload, error: null });
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const code = (err as { message?: string }).message;
        if (
          code === "unauthorized" ||
          code === "not_found" ||
          code === "snapshot_missing" ||
          code === "generic"
        ) {
          setReceiptState({
            id: transferId,
            data: null,
            error: code as ReceiptFetchError,
          });
          return;
        }
        setReceiptState({ id: transferId, data: null, error: "generic" });
      });

    return () => {
      active = false;
    };
  }, [fetchReceiptSnapshot, transferId]);

  const retryReceiptSnapshot = useCallback(async () => {
    if (!transferId) {
      return;
    }
    try {
      const payload = await fetchReceiptSnapshot(transferId);
      setReceiptState({ id: transferId, data: payload, error: null });
    } catch (err) {
      const code = (err as { message?: string }).message;
      if (
        code === "unauthorized" ||
        code === "not_found" ||
        code === "snapshot_missing" ||
        code === "generic"
      ) {
        setReceiptState({
          id: transferId,
          data: null,
          error: code as ReceiptFetchError,
        });
        return;
      }
      setReceiptState({ id: transferId, data: null, error: "generic" });
    }
  }, [fetchReceiptSnapshot, transferId]);

  useEffect(() => {
    if (!transferId) {
      return undefined;
    }
    let active = true;

    fetchReconciliation(transferId)
      .then((payload) => {
        if (!active) {
          return;
        }
        setReconciliationState({ id: transferId, data: payload, error: null });
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const code = (err as { message?: string }).message;
        if (code === "unauthorized" || code === "not_found" || code === "generic") {
          setReconciliationState({
            id: transferId,
            data: null,
            error: code as ReceiptFetchError,
          });
          return;
        }
        setReconciliationState({ id: transferId, data: null, error: "generic" });
      });

    return () => {
      active = false;
    };
  }, [fetchReconciliation, transferId]);

  useEffect(() => {
    setExecuteState("idle");
    setExecuteError(null);
    setTransferStatusOverride(null);
    setCancelState("idle");
    setCancelError(null);
    setReconcileState("idle");
    setReconcileError(null);
    setReconcileResult(null);
    setForceState("idle");
    setForceError(null);
    setForceResult(null);
  }, [transferId]);

  useEffect(() => {
    if (!session?.user?.email) {
      setIsAdmin(false);
      return;
    }
    let active = true;
    fetch("/api/admin/payouts?limit=1", { cache: "no-store" })
      .then((res) => {
        if (!active) {
          return;
        }
        setIsAdmin(res.ok);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setIsAdmin(false);
      });
    return () => {
      active = false;
    };
  }, [session?.user?.email]);

  useEffect(() => {
    if (!transferId) {
      return undefined;
    }
    let active = true;

    fetchEvents(transferId)
      .then((payload) => {
        if (!active) {
          return;
        }
        setEventsState({ id: transferId, data: payload, error: null });
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const code = (err as { message?: string }).message;
        if (code === "unauthorized" || code === "not_found" || code === "generic") {
          setEventsState({
            id: transferId,
            data: null,
            error: code as ReceiptFetchError,
          });
          return;
        }
        setEventsState({ id: transferId, data: null, error: "generic" });
      });

    return () => {
      active = false;
    };
  }, [fetchEvents, transferId]);

  useEffect(() => {
    if (!transferId) {
      return undefined;
    }
    let active = true;

    fetchAttempts(transferId)
      .then((payload) => {
        if (!active) {
          return;
        }
        setAttemptsState({ id: transferId, data: payload, error: null });
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const code = (err as { message?: string }).message;
        if (code === "unauthorized" || code === "not_found" || code === "generic") {
          setAttemptsState({
            id: transferId,
            data: null,
            error: code as ReceiptFetchError,
          });
          return;
        }
        setAttemptsState({ id: transferId, data: null, error: "generic" });
      });

    return () => {
      active = false;
    };
  }, [fetchAttempts, transferId]);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timer = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async (value: string, kind: "code" | "link") => {
    const success = await copyTextSafe(value);
    setCopied(success ? kind : null);
  };

  const handleCopyInvoice = async (value: string) => {
    const success = await copyTextSafe(value);
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

  const handleGetReceipt = useCallback(async () => {
    if (!transferId) {
      return;
    }
    setReceiptActionState("loading");
    setReceiptActionError(null);
    try {
      const res = await fetch(`/api/transfers/${transferId}/receipt`, {
        method: "POST",
      });
      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; receiptUrl?: string; error?: string }
        | null;
      if (!res.ok) {
        if (res.status === 429) {
          setReceiptActionError(messages.receiptResendRateLimited);
        } else if (res.status === 409) {
          setReceiptActionError(
            payload?.error ?? messages.receiptSnapshotUnavailableLabel
          );
        } else if (res.status === 400) {
          setReceiptActionError(payload?.error ?? messages.receiptLoadError);
        } else {
          setReceiptActionError(messages.receiptLoadError);
        }
        setReceiptActionState("error");
        return;
      }
      const receiptUrl = payload?.receiptUrl ?? null;
      if (receiptUrl) {
        setIssuedReceiptUrl(receiptUrl);
      }
      setReceiptActionState("success");
    } catch {
      setReceiptActionError(messages.receiptLoadError);
      setReceiptActionState("error");
    }
  }, [messages, transferId]);

  const handleExecutePayout = useCallback(async () => {
    if (!transferId) {
      return;
    }
    setExecuteState("loading");
    setExecuteError(null);
    try {
      const res = await fetch(`/api/transfers/${transferId}/execute`, {
        method: "POST",
      });
      const payload = (await res.json().catch(() => null)) as
        | { status?: string; error?: string; errorCode?: string; retryAfterSeconds?: number }
        | null;
      if (!res.ok) {
        if (res.status === 429) {
          const seconds = typeof payload?.retryAfterSeconds === "number" ? payload.retryAfterSeconds : 0;
          setExecuteError(messages.executePayoutCooldownLabel(seconds));
        } else if (res.status === 409 && payload?.errorCode === "PAYOUT_EXHAUSTED") {
          setExecuteError(messages.executePayoutExhaustedLabel);
        } else {
          setExecuteError(payload?.error ?? messages.executePayoutErrorLabel);
        }
        setExecuteState("error");
        return;
      }
      const nextStatus = payload?.status ?? "COMPLETED";
      setTransferStatusOverride(nextStatus);
      setRequestState((prev) => {
        if (!prev || prev.id !== transferId || !prev.data) {
          return prev;
        }
        return {
          ...prev,
          data: {
            ...prev.data,
            transfer: { ...prev.data.transfer, status: nextStatus },
          },
        };
      });
      setExecuteState("success");
      try {
        const refreshed = await fetchEvents(transferId);
        setEventsState({ id: transferId, data: refreshed, error: null });
      } catch {
        // Keep existing events on refresh failure.
      }
      try {
        const refreshedAttempts = await fetchAttempts(transferId);
        setAttemptsState({ id: transferId, data: refreshedAttempts, error: null });
      } catch {
        // Keep existing attempts on refresh failure.
      }
    } catch {
      setExecuteError(messages.executePayoutErrorLabel);
      setExecuteState("error");
    }
  }, [fetchAttempts, fetchEvents, messages.executePayoutErrorLabel, transferId]);

  const handleCancelPayout = useCallback(async () => {
    if (!transferId) {
      return;
    }
    setCancelState("loading");
    setCancelError(null);
    try {
      const res = await fetch(`/api/transfers/${transferId}/cancel-payout`, {
        method: "POST",
      });
      const payload = (await res.json().catch(() => null)) as
        | { status?: string; error?: string }
        | null;
      if (!res.ok) {
        setCancelError(payload?.error ?? messages.cancelPayoutErrorLabel);
        setCancelState("error");
        return;
      }
      const nextStatus = payload?.status ?? "FAILED";
      setTransferStatusOverride(nextStatus);
      setRequestState((prev) => {
        if (!prev || prev.id !== transferId || !prev.data) {
          return prev;
        }
        return {
          ...prev,
          data: {
            ...prev.data,
            transfer: { ...prev.data.transfer, status: nextStatus },
          },
        };
      });
      setExecuteState("idle");
      setExecuteError(null);
      setCancelState("success");
      try {
        const refreshed = await fetchEvents(transferId);
        setEventsState({ id: transferId, data: refreshed, error: null });
      } catch {
        // Keep existing events on refresh failure.
      }
      try {
        const refreshedAttempts = await fetchAttempts(transferId);
        setAttemptsState({ id: transferId, data: refreshedAttempts, error: null });
      } catch {
        // Keep existing attempts on refresh failure.
      }
    } catch {
      setCancelError(messages.cancelPayoutErrorLabel);
      setCancelState("error");
    }
  }, [fetchAttempts, fetchEvents, messages.cancelPayoutErrorLabel, transferId]);

  const handleReconcilePayout = useCallback(async () => {
    if (!transferId) {
      return;
    }
    setReconcileState("loading");
    setReconcileError(null);
    setReconcileResult(null);
    try {
      const res = await fetch(`/api/admin/transfers/${transferId}/reconcile`, {
        method: "POST",
      });
      const payload = (await res.json().catch(() => null)) as
        | {
            beforeStatus?: string;
            afterStatus?: string;
            providerStatus?: string;
            receiptUrl?: string | null;
            error?: string;
          }
        | null;
      if (!res.ok) {
        if (res.status === 400) {
          setReconcileError(messages.reconcilePayoutNotProcessingLabel);
        } else if (res.status === 409) {
          setReconcileError(messages.reconcilePayoutMissingProviderLabel);
        } else if (res.status === 401 || res.status === 404) {
          setReconcileError(messages.reconcilePayoutErrorLabel);
        } else {
          setReconcileError(payload?.error ?? messages.reconcilePayoutErrorLabel);
        }
        setReconcileState("error");
        return;
      }
      const nextStatus = payload?.afterStatus ?? transferStatusOverride ?? "PROCESSING";
      setTransferStatusOverride(nextStatus);
      setRequestState((prev) => {
        if (!prev || prev.id !== transferId || !prev.data) {
          return prev;
        }
        return {
          ...prev,
          data: {
            ...prev.data,
            transfer: { ...prev.data.transfer, status: nextStatus },
          },
        };
      });
      if (payload?.receiptUrl) {
        setIssuedReceiptUrl(payload.receiptUrl);
      }
      setReconcileResult({
        beforeStatus: payload?.beforeStatus ?? nextStatus,
        afterStatus: nextStatus,
        providerStatus: payload?.providerStatus ?? "",
        receiptUrl: payload?.receiptUrl ?? null,
      });
      setReconcileState("success");
      try {
        const refreshed = await fetchEvents(transferId);
        setEventsState({ id: transferId, data: refreshed, error: null });
      } catch {
        // Keep existing events on refresh failure.
      }
      try {
        const refreshedAttempts = await fetchAttempts(transferId);
        setAttemptsState({ id: transferId, data: refreshedAttempts, error: null });
      } catch {
        // Keep existing attempts on refresh failure.
      }
    } catch {
      setReconcileError(messages.reconcilePayoutErrorLabel);
      setReconcileState("error");
    }
  }, [
    fetchAttempts,
    fetchEvents,
    messages.reconcilePayoutErrorLabel,
    messages.reconcilePayoutMissingProviderLabel,
    messages.reconcilePayoutNotProcessingLabel,
    transferId,
    transferStatusOverride,
  ]);

  const handleForceStatus = useCallback(async () => {
    if (!transferId) {
      return;
    }
    setForceState("loading");
    setForceError(null);
    setForceResult(null);
    try {
      const res = await fetch(`/api/admin/transfers/${transferId}/force-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: forceStatus,
          reason: forceReason.trim() || undefined,
        }),
      });
      const payload = (await res.json().catch(() => null)) as
        | {
            status?: string;
            receiptUrl?: string | null;
            error?: string;
            deduped?: boolean;
          }
        | null;
      if (!res.ok) {
        if (res.status === 400) {
          setForceError(messages.adminForceStatusInvalidLabel);
        } else if (res.status === 403) {
          setForceError(messages.adminForceStatusForbiddenLabel);
        } else {
          setForceError(payload?.error ?? messages.adminForceStatusErrorLabel);
        }
        setForceState("error");
        return;
      }
      const nextStatus =
        payload?.status ??
        transferStatusOverride ??
        requestState?.data?.transfer.status ??
        "READY";
      setTransferStatusOverride(nextStatus);
      setRequestState((prev) => {
        if (!prev || prev.id !== transferId || !prev.data) {
          return prev;
        }
        return {
          ...prev,
          data: {
            ...prev.data,
            transfer: { ...prev.data.transfer, status: nextStatus },
          },
        };
      });
      if (payload?.receiptUrl) {
        setIssuedReceiptUrl(payload.receiptUrl);
      }
      setForceResult(messages.adminForceStatusSuccessLabel);
      setForceState("success");
      try {
        const refreshed = await fetchEvents(transferId);
        setEventsState({ id: transferId, data: refreshed, error: null });
      } catch {
        // Keep existing events on refresh failure.
      }
    } catch {
      setForceError(messages.adminForceStatusErrorLabel);
      setForceState("error");
    }
  }, [
    fetchEvents,
    forceReason,
    forceStatus,
    messages.adminForceStatusErrorLabel,
    messages.adminForceStatusForbiddenLabel,
    messages.adminForceStatusInvalidLabel,
    messages.adminForceStatusSuccessLabel,
    requestState?.data?.transfer.status,
    transferId,
    transferStatusOverride,
  ]);

  const activeState = requestState?.id === transferId ? requestState : null;
  const data = activeState?.data ?? null;
  const error = activeState?.error ?? null;
  const resolvedError = transferId ? error : "not_found";
  const activeReceiptState =
    receiptState?.id === transferId ? receiptState : null;
  const receiptData = activeReceiptState?.data ?? null;
  const receiptError = activeReceiptState?.error ?? null;
  const activeEventsState =
    eventsState?.id === transferId ? eventsState : null;
  const timelineEvents = activeEventsState?.data ?? null;
  const timelineError = activeEventsState?.error ?? null;
  const isLoading = Boolean(transferId) && !activeState;
  const isDev = ALLOW_SIMULATED_PAYOUTS;
  const isNonProd = process.env.NODE_ENV !== "production";

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
  const transferStatus = transferStatusOverride ?? transfer.status;
  const executeUi = resolveExecutePayoutUi(transferStatus, executeState);
  const payoutActionError = cancelError ?? executeError;
  const payoutAction = resolvePayoutAction(transferStatus);
  const showExecuteButton = payoutAction === "execute";
  const showRetryButton = payoutAction === "retry";
  const showCancelButton = transferStatus === "PROCESSING";
  const showReconcileButton =
    isAdmin && (transferStatus === "PROCESSING" || transferStatus === "FAILED");
  const showAdminTools = isAdmin && isNonProd;
  const showPayoutInfo = shouldShowPayoutInfo({
    status: transferStatus,
    providerPayoutId: transfer.providerPayoutId,
    providerPayoutStatus: transfer.providerPayoutStatus,
    providerPayoutProvider: transfer.providerPayoutProvider,
    providerPayoutUpdatedAt: transfer.providerPayoutUpdatedAt,
  });
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
  const resolveEventMessage = (event: TransferEvent | TimelineEvent) => {
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
  const userStatus = resolveUserStatusModel(transferStatus, transfer.providerPayoutStatus);
  const statusStyle = statusStyles[userStatus.key] ?? "bg-slate-200 text-slate-700";
  const statusLabel = userStatus.label;
  const flowSteps = [
    messages.flowStepQuote,
    messages.flowStepReview,
    messages.flowStepTransfer,
    messages.flowStepReceipt,
  ];
  const referenceCode = transfer.referenceCode;
  const shareLink =
    typeof window === "undefined"
      ? `/${locale}/transfer/${transfer.id}`
      : `${window.location.origin}/${locale}/transfer/${transfer.id}`;
  const eventsForTimeline = timelineEvents ?? events;
  const groupedStatusTimeline = buildUserStatusTimeline(transferStatus, eventsForTimeline);
  const nextStepMessage = userStatus.nextStep;
  const receiptSnapshot = receiptData?.snapshot ?? null;
  const accountingSnapshot = receiptSnapshot
    ? {
        sendAmount: receiptSnapshot.sendAmount,
        fixedFee: receiptSnapshot.fixedFee,
        percentFee: receiptSnapshot.percentFee,
        totalFees: receiptSnapshot.totalFees,
        recipientGets: receiptSnapshot.recipientGets,
        marketRate: receiptSnapshot.marketRate,
        appliedRate: receiptSnapshot.appliedRate,
        fxMarginPct: receiptSnapshot.fxMarginPct,
        fromAsset: receiptSnapshot.fromAsset,
        toAsset: receiptSnapshot.toAsset,
      }
    : null;
  const reconciliationData = reconciliationState?.data ?? null;
  const attemptsData = attemptsState?.data ?? null;
  const receiptUrl =
    issuedReceiptUrl ?? receiptData?.receiptUrl ?? null;
  const receiptUi = resolveReceiptUiState(
    transferStatus,
    receiptUrl,
    receiptActionState
  );

  useEffect(() => {
    if (!shouldLogRenders) {
      return;
    }
    console.info(`render_transfer_detail count=${renderCountRef.current}`);
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-16 lg:px-8">
        <Card
          data-testid="transfer-detail-header"
          className="p-8"
        >
          <CardContent className="p-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {messages.transferReceiptTitle}
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                {referenceCode}
              </h1>
              <p className="mt-2 text-sm text-slate-600">{messages.referenceCodeLabel}</p>
              <p className="mt-1 text-xs text-slate-500">
                {formatRelativeUpdate(transfer.updatedAt, locale)}
              </p>
              <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <div>
                  Amount sent:{" "}
                  {formatMoney(
                    quote.sendAmount,
                    quote.fromAsset.code,
                    locale,
                    quote.fromAsset.decimals
                  )}
                </div>
                <div>
                  Recipient gets:{" "}
                  {formatMoney(
                    quote.recipientGets,
                    quote.toAsset.code,
                    locale,
                    quote.toAsset.decimals
                  )}
                </div>
                <div>
                  {messages.createdAtLabel}:{" "}
                  {formatDateTime(transfer.createdAt, locale)}
                </div>
                <div>
                  {messages.updatedAtLabel}:{" "}
                  {formatDateTime(transfer.updatedAt, locale)}
                </div>
              </div>
              <div
                data-testid="transfer-detail-what-next"
                className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                <p className="text-xs font-medium text-slate-400">
                  {messages.nextStepTitle}
                </p>
                <p className="mt-1">{nextStepMessage}</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <Badge className={statusStyle}>
                {statusLabel}
              </Badge>
              <p className="text-xs font-medium text-slate-600">{userStatus.substatus}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => handleCopy(referenceCode, "code")}
                  variant="secondary"
                  size="sm"
                >
                  {copied === "code"
                    ? messages.copiedLabel
                    : messages.copyReferenceButton}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleCopy(shareLink, "link")}
                  variant="secondary"
                  size="sm"
                >
                  {copied === "link"
                    ? messages.copiedLabel
                    : messages.copyLinkButton}
                </Button>
                {session?.user && transferStatus === "COMPLETED" ? (
                  <Button
                    type="button"
                    onClick={handleResendReceipt}
                    disabled={resendState === "sending"}
                    variant="success"
                    size="sm"
                  >
                    {resendState === "sending"
                      ? messages.receiptResendLoading
                      : messages.receiptResendButton}
                  </Button>
                ) : null}
              </div>
              {session?.user && resendState !== "idle" ? (
                <p className="text-xs text-slate-600">
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
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              Status updates are audit logged.
            </span>
          </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">
                {messages.flowStepsTitle}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {flowSteps.map((label, index) => {
                  const isActive = index === 3;
                  const isComplete = index < 3;
                  return (
                    <div
                      key={label}
                      className={`rounded-2xl border px-3 py-2 text-xs font-medium ${
                        isActive
                          ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                          : isComplete
                            ? "border-slate-200 bg-white text-slate-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              data-testid="transfer-detail-timeline"
              className="rounded-3xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">
                  Transfer status timeline
                </p>
                <span className="text-xs text-slate-500">{referenceCode}</span>
              </div>
              <div className="mt-5 space-y-4">
                {groupedStatusTimeline.map((step) => {
                  const isComplete = step.isComplete;
                  const isCurrent = step.isActive;
                  const indicatorClass = isComplete
                    ? "bg-emerald-500"
                    : isCurrent
                      ? "bg-amber-500"
                      : "bg-slate-300";
                  const textClass = isComplete
                    ? "text-slate-900"
                    : isCurrent
                      ? "text-slate-900"
                      : "text-slate-500";
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

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {messages.timelineLabel}
                  </p>
                  {executeUi.message === "processing" ? (
                    <p className="mt-1 text-xs text-slate-600">
                      {messages.executePayoutProcessingLabel}
                    </p>
                  ) : executeUi.message === "failed" ? (
                    <p className="mt-1 text-xs text-rose-300">
                      {messages.executePayoutFailedLabel}
                    </p>
                  ) : null}
                  {payoutActionError ? (
                    <p className="mt-1 text-xs text-rose-300">
                      {payoutActionError}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  {showExecuteButton ? (
                    <button
                      type="button"
                      onClick={handleExecutePayout}
                      disabled={executeState === "loading"}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {executeState === "loading"
                        ? messages.executePayoutLoadingLabel
                        : messages.executePayoutButtonLabel}
                    </button>
                  ) : null}
                  {showRetryButton ? (
                    <button
                      type="button"
                      onClick={handleExecutePayout}
                      disabled={executeState === "loading"}
                      className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {executeState === "loading"
                        ? messages.executePayoutLoadingLabel
                        : messages.executePayoutRetryLabel}
                    </button>
                  ) : null}
                  {showCancelButton ? (
                    <button
                      type="button"
                      onClick={handleCancelPayout}
                      disabled={cancelState === "loading"}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancelState === "loading"
                        ? messages.cancelPayoutLoadingLabel
                        : messages.cancelPayoutButtonLabel}
                    </button>
                  ) : null}
                  <span className="text-xs text-slate-500">
                    {(timelineEvents ?? events).length}
                  </span>
                </div>
              </div>
              <div className="mt-5 space-y-4 border-l border-slate-200 pl-4">
                {timelineError ? (
                  <p className="text-sm text-slate-400">
                    {messages.receiptLoadError}
                  </p>
                ) : (timelineEvents ?? events).length > 0 ? (
                  (timelineEvents ?? events).map((event, index) => {
                    const resolved = resolveEventMessage(event);
                    const parsed = parseTimelineMessage(resolved);
                    const messageText =
                      parsed.text || messages.timelineMessageEmptyLabel;
                    const typeLabel = event.type.replaceAll("_", " ");
                    return (
                      <div
                        key={`${event.type}-${event.createdAt}-${index}`}
                        className="relative"
                      >
                        <span className="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-400" />
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {typeLabel}
                            </p>
                            <span className="text-xs text-slate-500">
                              {formatDateTime(event.createdAt, locale)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-700">
                            {messageText}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            {parsed.ref ? (
                              <span>
                                {messages.payoutRefLabel} {parsed.ref}
                              </span>
                            ) : null}
                            {parsed.reason ? (
                              <span className="text-rose-300">
                                {messages.payoutReasonLabel} {parsed.reason}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-400">
                    {messages.timelineEmptyLabel}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardContent>
              <p className="text-xs font-medium text-slate-500">
                {messages.recipientSummaryLabel}
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>{messages.recipientNameLabel}</span>
                  <span className="font-semibold text-slate-900">
                    {transfer.recipientName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{messages.recipientCountryLabel}</span>
                  <span className="font-semibold text-slate-900">
                    {transfer.recipientCountry}
                  </span>
                </div>
                {transfer.recipientPhone ? (
                  <div className="flex items-center justify-between">
                    <span>{messages.recipientPhoneLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {transfer.recipientPhone}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span>{messages.payoutSummaryLabel}</span>
                  <span className="font-semibold text-slate-900">
                    {payoutRailLabels[
                      transfer.payoutRail as keyof typeof payoutRailLabels
                    ] ?? transfer.payoutRail}
                  </span>
                </div>
                {transfer.recipientBankName ? (
                  <div className="flex items-center justify-between">
                    <span>{messages.bankNameLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {transfer.recipientBankName}
                    </span>
                  </div>
                ) : null}
                {transfer.recipientBankAccount ? (
                  <div className="flex items-center justify-between">
                    <span>{messages.bankAccountLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {transfer.recipientBankAccount}
                    </span>
                  </div>
                ) : null}
                {transfer.recipientMobileMoneyProvider ? (
                  <div className="flex items-center justify-between">
                    <span>{messages.mobileMoneyProviderLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {transfer.recipientMobileMoneyProvider}
                    </span>
                  </div>
                ) : null}
                {transfer.recipientMobileMoneyNumber ? (
                  <div className="flex items-center justify-between">
                    <span>{messages.mobileMoneyNumberLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {transfer.recipientMobileMoneyNumber}
                    </span>
                  </div>
                ) : null}
                {transfer.recipientLightningInvoice ? (
                  <div className="flex items-center justify-between">
                    <span>{messages.recipientLightningInvoiceLabel}</span>
                    <span className="font-semibold text-slate-900">
                      {transfer.recipientLightningInvoice}
                    </span>
                  </div>
                ) : null}
              </div>
              </CardContent>
            </Card>

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

            <Card>
              <CardContent>
              <p className="text-xs font-medium text-slate-400">
                {messages.lockedQuoteSummaryLabel}
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <StatRow
                  label={messages.receiptSendAmountLabel}
                  value={formatMoney(
                    quote.sendAmount,
                    quote.fromAsset.code,
                    locale,
                    quote.fromAsset.decimals
                  )}
                />
                <StatRow
                  label={messages.receiptAppliedRateLabel}
                  value={`1 ${quote.fromAsset.code} = ${formatNumber(quote.appliedRate, 4, locale)} ${quote.toAsset.code}`}
                />
                <StatRow
                  label={messages.fxMarginRow}
                  value={`${formatNumber(quote.fxMarginPct, 2, locale)}%`}
                />
                <StatRow
                  label={messages.receiptTotalFeesLabel}
                  value={formatMoney(
                    quote.totalFee,
                    quote.fromAsset.code,
                    locale,
                    quote.fromAsset.decimals
                  )}
                />
                <StatRow
                  label={messages.receiptRecipientGetsLabel}
                  value={formatMoney(
                    quote.recipientGets,
                    quote.toAsset.code,
                    locale,
                    quote.toAsset.decimals
                  )}
                />
                <StatRow label={messages.rateSourceLabel} value={quote.rateSource} />
                <div className="pt-2 text-xs text-slate-500">
                  {messages.expiresAtLabel}: {formatDateTime(quote.expiresAt, locale)}
                  {" · "}
                  {messages.rateUpdatedLabel}: {formatDateTime(quote.rateTimestamp, locale)}
                </div>
              </div>
              </CardContent>
            </Card>

            <div
              data-testid="transfer-detail-receipt"
              className="rounded-3xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">
                  {messages.transferReceiptTitle}
                </p>
                <div className="flex items-center gap-2">
                  {receiptUi.showViewLink && receiptUrl ? (
                    <a
                      href={receiptUrl}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download receipt
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleCopy(referenceCode, "code")}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                  >
                    {copied === "code" ? messages.copiedLabel : "Copy reference"}
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4 text-sm text-slate-700">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Receipt preview
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Share this reference with support if you need help.
                  </p>
                  <div className="mt-2 grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>{messages.referenceCodeLabel}</span>
                      <span className="font-semibold text-slate-900">{referenceCode}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.createdAtLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {formatDateTime(transfer.createdAt, locale)}
                      </span>
                    </div>
                  </div>
                </div>
                {receiptError === "unauthorized" ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="font-medium text-slate-900">
                      {messages.receiptUnauthorizedLabel}
                    </p>
                    <Link
                      href="/api/auth/signin"
                      className="mt-3 inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                    >
                      {messages.navSignInLabel}
                    </Link>
                  </div>
                ) : receiptError === "not_found" ? (
                  <p className="text-sm text-slate-400">
                    {messages.receiptNotFoundLabel}
                  </p>
                ) : receiptError === "snapshot_missing" ? (
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>{messages.receiptSnapshotUnavailableLabel}</p>
                    <button
                      type="button"
                      onClick={retryReceiptSnapshot}
                      className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                    >
                      Try again
                    </button>
                  </div>
                ) : receiptError === "generic" ? (
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>{messages.receiptLoadError}</p>
                    <button
                      type="button"
                      onClick={retryReceiptSnapshot}
                      className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                    >
                      Try again
                    </button>
                  </div>
                ) : receiptSnapshot ? (
                  <div className="space-y-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>{messages.receiptSendAmountLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {formatMoney(receiptSnapshot.sendAmount, receiptSnapshot.fromAsset, locale)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.fundingMethodLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {receiptSnapshot.fundingMethod ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.receiptAppliedRateLabel}</span>
                      <span className="font-semibold text-slate-900">
                        1 {receiptSnapshot.fromAsset} ={" "}
                        {formatNumber(receiptSnapshot.appliedRate, 4, locale)}{" "}
                        {receiptSnapshot.toAsset}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.marketRateLabel}</span>
                      <span className="font-semibold text-slate-900">
                        1 {receiptSnapshot.fromAsset} ={" "}
                        {formatNumber(receiptSnapshot.marketRate, 4, locale)}{" "}
                        {receiptSnapshot.toAsset}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.fxMarginRow}</span>
                      <span className="font-semibold text-slate-900">
                        {formatNumber(receiptSnapshot.fxMarginPct, 2, locale)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.fixedFeeLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {formatMoney(receiptSnapshot.fixedFee, receiptSnapshot.fromAsset, locale)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.percentFeeLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {formatNumber(receiptSnapshot.percentFee, 2, locale)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.receiptTotalFeesLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {formatMoney(receiptSnapshot.totalFees, receiptSnapshot.fromAsset, locale)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.receiptRecipientGetsLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {formatMoney(receiptSnapshot.recipientGets, receiptSnapshot.toAsset, locale)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.rateSourceLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {receiptSnapshot.rateSource}
                      </span>
                    </div>
                    <div className="pt-2 text-xs text-slate-500">
                      {messages.quoteLockedEvent(formatDateTime(receiptSnapshot.lockedAt, locale))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    {messages.receiptSnapshotUnavailableLabel}
                  </p>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {receiptUi.showPendingText ? (
                    <p>{messages.receiptAvailableAfterCompletionLabel}</p>
                  ) : receiptUi.showViewLink ? (
                    <p>{messages.receiptReadyLabel}</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-slate-700">
                        {messages.receiptGetPromptLabel}
                      </p>
                      <button
                        type="button"
                        onClick={handleGetReceipt}
                        disabled={receiptUi.disableGetButton}
                        className="w-fit rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {receiptActionState === "loading"
                          ? messages.receiptResendLoading
                          : messages.receiptGetButtonLabel}
                      </button>
                      {receiptActionError ? (
                        <p className="text-xs text-rose-200">
                          {receiptActionError}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              data-testid="transfer-detail-support"
              className="rounded-3xl border border-slate-200 bg-white p-6"
            >
              <p className="text-xs font-medium text-slate-500">Support</p>
              <p className="mt-2 text-sm text-slate-700">
                Need help with this transfer? We can review status and receipt details with you.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Reference: <span className="font-medium text-slate-700">{referenceCode}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Support usually replies within one business day.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => handleCopy(referenceCode, "code")}
                  variant="secondary"
                  size="sm"
                >
                  {copied === "code" ? messages.copiedLabel : "Copy reference"}
                </Button>
                <Link
                  href={`/${locale}/help`}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                >
                  Open Help
                </Link>
                <a
                  href="mailto:support@clarisend.co?subject=Transfer%20issue"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                >
                  Report an issue
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-medium text-slate-400">
                {messages.accountingTitle}
              </p>
              <div className="mt-4">
                <AccountingPanel
                  snapshot={accountingSnapshot}
                  locale={locale}
                  messages={messages}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-medium text-slate-400">
                {messages.reconciliationTitle}
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span>{messages.reconciliationTransferIdLabel}</span>
                  <span className="font-semibold text-white">
                    {reconciliationData?.transferId ?? messages.reconciliationUnavailableLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{messages.reconciliationStatusLabel}</span>
                  <span className="font-semibold text-white">
                    {reconciliationData?.status ?? messages.reconciliationUnavailableLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{messages.reconciliationProviderLabel}</span>
                  <span className="font-semibold text-white">
                    {reconciliationData?.providerPayoutProvider ??
                      messages.reconciliationUnavailableLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{messages.reconciliationProviderPayoutIdLabel}</span>
                  <span className="font-semibold text-white">
                    {reconciliationData?.providerPayoutId ??
                      messages.reconciliationUnavailableLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{messages.reconciliationProviderStatusLabel}</span>
                  <span className="font-semibold text-white">
                    {reconciliationData?.providerPayoutStatus ??
                      messages.reconciliationUnavailableLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{messages.reconciliationUpdatedAtLabel}</span>
                  <span className="font-semibold text-white">
                    {reconciliationData?.providerPayoutUpdatedAt
                      ? formatDateTime(reconciliationData.providerPayoutUpdatedAt, locale)
                      : messages.reconciliationUnavailableLabel}
                  </span>
                </div>
              </div>
              {showReconcileButton ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-medium text-slate-400">
                      {messages.reconcilePayoutTitleLabel}
                    </p>
                    <button
                      type="button"
                      onClick={handleReconcilePayout}
                      disabled={reconcileState === "loading"}
                      className="rounded-full border border-indigo-400/40 bg-indigo-500/20 px-4 py-2 text-[11px] font-medium text-indigo-100 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reconcileState === "loading"
                        ? messages.reconcilePayoutLoadingLabel
                        : messages.reconcilePayoutButtonLabel}
                    </button>
                  </div>
                  {reconcileError ? (
                    <p className="mt-2 text-[11px] text-rose-300">
                      {reconcileError}
                    </p>
                  ) : null}
                  {reconcileState === "success" ? (
                    <p className="mt-2 text-[11px] text-slate-400">
                      {messages.reconcilePayoutSuccessLabel}
                    </p>
                  ) : null}
                  {reconcileResult?.providerStatus ? (
                    <p className="mt-1 text-[11px] text-slate-500">
                      {messages.reconcilePayoutProviderStatusLabel}{" "}
                      {reconcileResult.providerStatus}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {showAdminTools ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs font-medium text-slate-400">
                  {messages.adminToolsTitleLabel}
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  <label className="flex flex-col gap-2 text-xs font-medium text-slate-400">
                    {messages.adminForceStatusLabel}
                    <select
                      value={forceStatus}
                      onChange={(event) => setForceStatus(event.target.value)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="READY">{messages.statusReadyLabel}</option>
                      <option value="PROCESSING">
                        {messages.statusProcessingLabel}
                      </option>
                      <option value="FAILED">{messages.statusFailedLabel}</option>
                      <option value="COMPLETED">
                        {messages.statusCompletedLabel}
                      </option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-medium text-slate-400">
                    {messages.adminForceReasonLabel}
                    <input
                      value={forceReason}
                      onChange={(event) => setForceReason(event.target.value)}
                      placeholder={messages.adminForceReasonPlaceholder}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleForceStatus}
                    disabled={forceState === "loading"}
                    className="rounded-full border border-amber-400/40 bg-amber-500/20 px-4 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {forceState === "loading"
                      ? messages.adminForceStatusLoadingLabel
                      : messages.adminForceStatusApplyLabel}
                  </button>
                  {forceState === "success" ? (
                    <span className="text-xs text-slate-400">
                      {forceResult ?? messages.adminForceStatusSuccessLabel}
                    </span>
                  ) : null}
                  {forceState === "error" ? (
                    <span className="text-xs text-rose-300">{forceError}</span>
                  ) : null}
                </div>
              </div>
            ) : null}

            {showPayoutInfo ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs font-medium text-slate-400">
                  {messages.reconciliationProviderLabel}
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between">
                    <span>{messages.providerLabel}</span>
                    <span className="font-semibold text-white">
                      {transfer.providerPayoutProvider ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{messages.providerPayoutIdLabel}</span>
                    <span className="font-semibold text-white">
                      {transfer.providerPayoutId ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{messages.providerStatusLabel}</span>
                    <span className="font-semibold text-white">
                      {transfer.providerPayoutStatus ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{messages.providerUpdatedAtLabel}</span>
                    <span className="font-semibold text-white">
                      {transfer.providerPayoutUpdatedAt
                        ? formatDateTime(transfer.providerPayoutUpdatedAt, locale)
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-medium text-slate-400">
                {messages.payoutDiagnosticsTitle}
              </p>
              {attemptsData && attemptsData.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-xs text-slate-200">
                    <thead className="text-[11px] uppercase text-slate-400">
                      <tr>
                        <th className="py-2 pr-4">{messages.payoutDiagnosticsAttemptLabel}</th>
                        <th className="py-2 pr-4">{messages.payoutDiagnosticsProviderLabel}</th>
                        <th className="py-2 pr-4">{messages.payoutDiagnosticsStatusLabel}</th>
                        <th className="py-2 pr-4">{messages.payoutDiagnosticsRefLabel}</th>
                        <th className="py-2 pr-4">{messages.payoutDiagnosticsStartedLabel}</th>
                        <th className="py-2 pr-4">{messages.payoutDiagnosticsFinishedLabel}</th>
                        <th className="py-2 pr-4">{messages.payoutDiagnosticsErrorLabel}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {attemptsData.map((attempt) => (
                        <tr key={`${attempt.attemptNumber}-${attempt.providerKey}`}>
                          <td className="py-2 pr-4 font-semibold text-white">
                            {attempt.attemptNumber}
                          </td>
                          <td className="py-2 pr-4">{attempt.providerKey}</td>
                          <td className="py-2 pr-4">{attempt.status}</td>
                          <td className="py-2 pr-4">
                            {attempt.providerPayoutId ?? "—"}
                          </td>
                          <td className="py-2 pr-4">
                            {formatDateTime(attempt.startedAt, locale)}
                          </td>
                          <td className="py-2 pr-4">
                            {attempt.finishedAt
                              ? formatDateTime(attempt.finishedAt, locale)
                              : "—"}
                          </td>
                          <td className="py-2 pr-4">
                            {attempt.errorCode ?? attempt.errorMessage ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  {messages.payoutDiagnosticsEmptyLabel}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

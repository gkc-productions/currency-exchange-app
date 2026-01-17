"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { formatDateTime, formatMoney, formatPercent } from "@/src/lib/format";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const MARKET_RATE = 12.65;
const FX_MARGIN_PCT = 1.8;
const FIXED_FEE_DEFAULT = 2.5;
const PERCENT_FEE_PCT = 1.2;

const DEFAULT_ASSETS = [
  { code: "USD", name: "US Dollar", symbol: "$", decimals: 2, kind: "FIAT" },
  { code: "EUR", name: "Euro", symbol: "EUR", decimals: 2, kind: "FIAT" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GHS", decimals: 2, kind: "FIAT" },
  { code: "NGN", name: "Nigerian Naira", symbol: "NGN", decimals: 2, kind: "FIAT" },
  { code: "XOF", name: "West African CFA Franc", symbol: "XOF", decimals: 2, kind: "FIAT" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "XAF", decimals: 2, kind: "FIAT" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KES", decimals: 2, kind: "FIAT" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "UGX", decimals: 2, kind: "FIAT" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TZS", decimals: 2, kind: "FIAT" },
  { code: "ZAR", name: "South African Rand", symbol: "ZAR", decimals: 2, kind: "FIAT" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "MAD", decimals: 2, kind: "FIAT" },
  { code: "EGP", name: "Egyptian Pound", symbol: "EGP", decimals: 2, kind: "FIAT" },
  { code: "DZD", name: "Algerian Dinar", symbol: "DZD", decimals: 2, kind: "FIAT" },
  { code: "TND", name: "Tunisian Dinar", symbol: "TND", decimals: 2, kind: "FIAT" },
  { code: "XCD", name: "East Caribbean Dollar", symbol: "XCD", decimals: 2, kind: "FIAT" },
  { code: "BTC", name: "Bitcoin", symbol: "BTC", decimals: 8, kind: "CRYPTO" },
] as const;

const DEFAULT_COUNTRY_BY_ASSET: Record<string, string> = {
  GHS: "GH",
  NGN: "NG",
  XOF: "SN",
  XAF: "CM",
  KES: "KE",
  UGX: "UG",
  TZS: "TZ",
  ZAR: "ZA",
  MAD: "MA",
  EGP: "EG",
  DZD: "DZ",
  TND: "TN",
};

const formatNumber = (value: number, digits = 2, locale: Locale = "en") =>
  new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

const stepForDecimals = (decimals: number) => {
  if (decimals <= 0) {
    return "1";
  }
  return `0.${"0".repeat(decimals - 1)}1`;
};

type Asset = {
  code: string;
  name: string;
  symbol: string | null;
  decimals: number;
  kind: "FIAT" | "CRYPTO";
};

type QuoteAsset = {
  code: string;
  name: string;
  decimals: number;
};

type Quote = {
  id: string;
  from: string;
  to: string;
  fromAsset: QuoteAsset;
  toAsset: QuoteAsset;
  rail: string;
  provider: string;
  rateSource: string;
  rateTimestamp: string;
  sendAmount: number;
  marketRate: number;
  fxMarginPct: number;
  feeFixed: number;
  feePct: number;
  totalFee: number;
  appliedRate: number;
  recipientGets: number;
  expiresAt: string;
  createdAt: string;
};

type RecommendationRoute = {
  id: string;
  corridorId: string;
  rail: string;
  provider: string;
  feeFixed: number;
  feePct: number;
  fxMarginPct: number;
  etaMinMinutes: number;
  etaMaxMinutes: number;
  totalFee: number;
  appliedRate: number;
  recipientGets: number;
  effectiveCostPct: number;
  explanation: string;
  highlights?: string[];
};

type Recommendation = {
  from: string;
  to: string;
  fromAsset?: QuoteAsset;
  toAsset?: QuoteAsset;
  sendAmount: number;
  marketRate: number;
  rateSource: string;
  rateTimestamp: string;
  cheapestRouteId: string;
  fastestRouteId: string;
  bestValueRouteId: string;
  routes: RecommendationRoute[];
};

export default function Home() {
  const params = useParams();
  const locale = useMemo<Locale>(() => {
    const value = params?.locale;
    if (Array.isArray(value)) {
      return value[0] === "fr" ? "fr" : "en";
    }
    return value === "fr" ? "fr" : "en";
  }, [params]);
  const messages = getMessages(locale);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [sendAmount, setSendAmount] = useState("250");
  const [fromAsset, setFromAsset] = useState("USD");
  const [toAsset, setToAsset] = useState("GHS");
  const [rail, setRail] = useState("MOBILE_MONEY");
  const [marketRate, setMarketRate] = useState(String(MARKET_RATE));
  const [fxMargin, setFxMargin] = useState(String(FX_MARGIN_PCT));
  const [fixedFee, setFixedFee] = useState(String(FIXED_FEE_DEFAULT));
  const [percentFee, setPercentFee] = useState(String(PERCENT_FEE_PCT));
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const hasQuote = Boolean(quote);
  const [lockedQuoteId, setLockedQuoteId] = useState<string | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);
  const [pendingLock, setPendingLock] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientCountry, setRecipientCountry] = useState("GH");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [payoutRail, setPayoutRail] = useState<
    "" | "MOBILE_MONEY" | "BANK" | "LIGHTNING"
  >("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState("");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [memo, setMemo] = useState("");
  const [transferResult, setTransferResult] = useState<{
    id: string;
    status: string;
  } | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [isTransferSubmitting, setIsTransferSubmitting] = useState(false);
  const [transferTouched, setTransferTouched] = useState({
    name: false,
    country: false,
    phone: false,
    payout: false,
    bank: false,
    mobileMoney: false,
  });
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null
  );
  const [recommendationError, setRecommendationError] = useState<string | null>(
    null
  );
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const recommendationAbortRef = useRef<AbortController | null>(null);

  const expiresAtLabel = useMemo(() => {
    if (!quote?.expiresAt) {
      return "—";
    }
    return formatDateTime(quote.expiresAt, locale);
  }, [quote?.expiresAt, locale]);

  const assetsList = assets.length > 0 ? assets : DEFAULT_ASSETS;
  const assetMap = useMemo(() => {
    return new Map(assetsList.map((asset) => [asset.code, asset]));
  }, [assetsList]);
  const formatAmount = useCallback(
    (value: number, assetCode: string) => {
      const asset = assetMap.get(assetCode);
      const decimals = asset?.decimals ?? 2;
      return formatMoney(value, assetCode, locale, decimals);
    },
    [assetMap, locale]
  );
  const payoutRailOptions = useMemo(
    () => [
      { code: "BANK", name: messages.payoutRailBankLabel },
      { code: "MOBILE_MONEY", name: messages.payoutRailMobileMoneyLabel },
      { code: "LIGHTNING", name: messages.payoutRailLightningLabel },
    ],
    [messages]
  );
  const resolveRailName = useCallback((railCode: string) => {
    return (
      payoutRailOptions.find((item) => item.code === railCode)?.name ?? railCode
    );
  }, [payoutRailOptions]);

  const displayFromAsset = quote?.fromAsset.code ?? fromAsset;
  const displayToAsset = quote?.toAsset.code ?? toAsset;
  const displayRail = quote?.rail ?? rail;
  const fromAssetMeta = assetMap.get(fromAsset);
  const railMeta = payoutRailOptions.find((item) => item.code === displayRail);
  const sendStep = stepForDecimals(fromAssetMeta?.decimals ?? 2);
  const defaultRecipientCountry =
    DEFAULT_COUNTRY_BY_ASSET[displayToAsset] ?? "GH";
  const suggestionFrom = recommendation?.from ?? fromAsset;
  const suggestionTo = recommendation?.to ?? toAsset;
  const recommendationMap = useMemo(() => {
    if (!recommendation?.routes) {
      return new Map<string, RecommendationRoute>();
    }
    return new Map(recommendation.routes.map((route) => [route.id, route]));
  }, [recommendation?.routes]);
  const cheapestRoute = recommendation
    ? recommendationMap.get(recommendation.cheapestRouteId) ?? null
    : null;
  const fastestRoute = recommendation
    ? recommendationMap.get(recommendation.fastestRouteId) ?? null
    : null;
  const bestValueRoute = recommendation
    ? recommendationMap.get(recommendation.bestValueRouteId) ?? null
    : null;

  useEffect(() => {
    let active = true;
    setAssetsLoading(true);
    setAssetsError(null);
    fetch("/api/assets")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Unable to load assets");
        }
        return (await res.json()) as Asset[];
      })
      .then((data) => {
        if (!active) {
          return;
        }
        setAssets(data);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setAssetsError(messages.assetsLoadError);
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setAssetsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [messages.assetsLoadError]);

  useEffect(() => {
    if (assetsList.length === 0) {
      return;
    }
    if (!assetMap.has(fromAsset)) {
      setFromAsset(assetsList[0].code);
    }
    if (!assetMap.has(toAsset)) {
      const gh = assetsList.find((asset) => asset.code === "GHS");
      setToAsset(gh?.code ?? assetsList[0].code);
    }
  }, [assetsList, assetMap, fromAsset, toAsset]);

  useEffect(() => {
    if (!transferTouched.country) {
      setRecipientCountry(defaultRecipientCountry);
    }
  }, [defaultRecipientCountry, transferTouched.country]);

  const trimmedRecipientName = recipientName.trim();
  const trimmedRecipientCountry = recipientCountry.trim().toUpperCase();
  const trimmedRecipientPhone = recipientPhone.trim();
  const phoneLooksValid =
    trimmedRecipientPhone.length === 0
      ? true
      : /^[+\d][\d\s().-]{6,}$/.test(trimmedRecipientPhone);
  const countryLooksValid = /^[A-Z]{2}$/.test(trimmedRecipientCountry);
  const nameError =
    transferTouched.name && trimmedRecipientName.length === 0
      ? messages.recipientNameRequired
      : null;
  const countryError = transferTouched.country
    ? trimmedRecipientCountry.length === 0
      ? messages.recipientCountryRequired
      : !countryLooksValid
        ? messages.recipientCountryInvalid
        : null
    : null;
  const phoneError = transferTouched.phone
    ? trimmedRecipientPhone.length > 0 && !phoneLooksValid
      ? messages.recipientPhoneInvalid
      : null
    : null;
  const payoutError =
    transferTouched.payout && payoutRail.length === 0
      ? messages.payoutRailRequired
      : null;
  const bankError =
    transferTouched.bank && payoutRail === "BANK"
      ? bankName.trim().length === 0 || bankAccount.trim().length === 0
        ? messages.bankDetailsRequired
        : null
      : null;
  const mobileMoneyError =
    transferTouched.mobileMoney && payoutRail === "MOBILE_MONEY"
      ? mobileMoneyProvider.trim().length === 0 ||
        mobileMoneyNumber.trim().length === 0
        ? messages.mobileMoneyDetailsRequired
        : null
      : null;
  const isTransferValid =
    trimmedRecipientName.length > 0 &&
    countryLooksValid &&
    phoneLooksValid &&
    payoutRail.length > 0 &&
    (payoutRail !== "BANK" ||
      (bankName.trim().length > 0 && bankAccount.trim().length > 0)) &&
    (payoutRail !== "MOBILE_MONEY" ||
      (mobileMoneyProvider.trim().length > 0 &&
        mobileMoneyNumber.trim().length > 0));

  const {
    numericSend,
    netConverted,
    effectiveRate,
    numericMarketRate,
    numericFxMargin,
    numericFixedFee,
    numericPercentFee,
    totalFee,
    appliedRate,
    recipientGets,
    percentFeeAmount,
  } = useMemo(() => {
    if (!quote) {
      return {
        numericSend: 0,
        percentFeeAmount: 0,
        totalFee: 0,
        appliedRate: 0,
        recipientGets: 0,
        netConverted: 0,
        effectiveRate: 0,
        numericMarketRate: 0,
        numericFxMargin: 0,
        numericFixedFee: 0,
        numericPercentFee: 0,
      };
    }
    const percentFeeValue = (quote.sendAmount * quote.feePct) / 100;
    const netSend = Math.max(quote.sendAmount - quote.totalFee, 0);
    const payout = quote.recipientGets;
    return {
      numericSend: quote.sendAmount,
      percentFeeAmount: percentFeeValue,
      totalFee: quote.totalFee,
      appliedRate: quote.appliedRate,
      recipientGets: payout,
      netConverted: netSend,
      effectiveRate:
        quote.sendAmount > 0 ? payout / quote.sendAmount : 0,
      numericMarketRate: quote.marketRate,
      numericFxMargin: quote.fxMarginPct,
      numericFixedFee: quote.feeFixed,
      numericPercentFee: quote.feePct,
    };
  }, [quote]);

  const fetchQuote = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setQuoteError(null);
    try {
      const params = new URLSearchParams({
        from: fromAsset,
        to: toAsset,
        rail,
        sendAmount: sendAmount.trim(),
        marketRate: marketRate.trim(),
        fxMarginPct: fxMargin.trim(),
        feeFixed: fixedFee.trim(),
        feePct: percentFee.trim(),
      });
      const res = await fetch(`/api/quote?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error("Unable to fetch quote");
      }
      const data = (await res.json()) as Quote;
      setQuote(data);
      return data;
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        setQuoteError(messages.quoteLoadError);
      }
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [
    sendAmount,
    marketRate,
    fxMargin,
    fixedFee,
    percentFee,
    fromAsset,
    toAsset,
    rail,
    messages.quoteLoadError,
  ]);

  const fetchRecommendation = useCallback(async () => {
    const amountValue = Number(sendAmount.trim());
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      recommendationAbortRef.current?.abort();
      setRecommendation(null);
      setRecommendationError(null);
      setRecommendationLoading(false);
      return null;
    }

    recommendationAbortRef.current?.abort();
    const controller = new AbortController();
    recommendationAbortRef.current = controller;
    setRecommendationLoading(true);
    setRecommendationError(null);
    setRecommendation(null);

    try {
      const params = new URLSearchParams({
        from: fromAsset,
        to: toAsset,
        sendAmount: amountValue.toString(),
      });
      const res = await fetch(`/api/recommendation?${params.toString()}`, {
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => null)) as
        | Recommendation
        | { error?: string }
        | null;
      if (!res.ok) {
        throw new Error(data && "error" in data ? data.error : "");
      }
      if (data && "routes" in data) {
        setRecommendation(data);
      }
      return data;
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        setRecommendationError(
          messages.recommendationLoadError || "Unable to load suggestions."
        );
      }
    } finally {
      setRecommendationLoading(false);
    }
    return null;
  }, [fromAsset, messages.recommendationLoadError, sendAmount, toAsset]);

  const resetTransferForm = useCallback(() => {
    setRecipientName("");
    setRecipientCountry(defaultRecipientCountry);
    setRecipientPhone("");
    setPayoutRail(rail as "BANK" | "MOBILE_MONEY" | "LIGHTNING");
    setBankName("");
    setBankAccount("");
    setMobileMoneyProvider("");
    setMobileMoneyNumber("");
    setMemo("");
    setTransferTouched({
      name: false,
      country: false,
      phone: false,
      payout: false,
      bank: false,
      mobileMoney: false,
    });
    setTransferResult(null);
    setTransferError(null);
  }, [defaultRecipientCountry, rail]);

  const applyRouteSuggestion = useCallback(
    (route: RecommendationRoute) => {
      setRail(route.rail);
      setFixedFee(route.feeFixed.toString());
      setPercentFee(route.feePct.toString());
      setFxMargin(route.fxMarginPct.toString());
      setLockedQuoteId(null);
      setLockError(null);
    },
    []
  );

  const handleLockQuote = useCallback(async () => {
    setLockError(null);
    if (!quote || isExpired) {
      setPendingLock(true);
      const refreshed = await fetchQuote();
      setPendingLock(false);
      if (!refreshed) {
        setLockError(messages.lockQuoteRefreshFailed);
        return;
      }
      const refreshedExpired =
        new Date(refreshed.expiresAt).getTime() <= Date.now();
      if (refreshedExpired) {
        setLockError(messages.lockQuoteExpired);
        return;
      }
      setLockedQuoteId(refreshed.id);
      resetTransferForm();
      return;
    }
    setLockedQuoteId(quote.id);
    resetTransferForm();
  }, [fetchQuote, isExpired, messages.lockQuoteExpired, messages.lockQuoteRefreshFailed, quote, resetTransferForm]);

  const handleCreateTransfer = useCallback(async () => {
    setTransferTouched({
      name: true,
      country: true,
      phone: true,
      payout: true,
      bank: true,
      mobileMoney: true,
    });
    setTransferError(null);
    setTransferResult(null);

    if (!lockedQuoteId || !quote) {
      setTransferError(messages.invalidQuoteError);
      return;
    }
    if (isExpired) {
      setTransferError(messages.quoteExpiredError);
      return;
    }
    if (!isTransferValid) {
      setTransferError(messages.transferIncompleteMessage);
      return;
    }

    setIsTransferSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        quoteId: lockedQuoteId,
        payoutRail,
        recipientName: trimmedRecipientName,
        recipientCountry: trimmedRecipientCountry,
        memo: memo.trim() || undefined,
      };

      if (trimmedRecipientPhone.length > 0) {
        payload.recipientPhone = trimmedRecipientPhone;
      }

      if (payoutRail === "BANK") {
        payload.bank = {
          name: bankName.trim(),
          account: bankAccount.trim(),
        };
      }
      if (payoutRail === "MOBILE_MONEY") {
        payload.mobileMoney = {
          provider: mobileMoneyProvider.trim(),
          number: mobileMoneyNumber.trim(),
        };
      }
      if (payoutRail === "LIGHTNING") {
        payload.crypto = {
          network: "BTC_LIGHTNING",
        };
      }

      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as
        | { id?: string; status?: string; error?: string; expired?: boolean }
        | null;

      if (!res.ok) {
        if (res.status === 410 || data?.expired) {
          setTransferError(messages.quoteExpiredError);
          return;
        }
        setTransferError(data?.error ?? messages.transferCreateError);
        return;
      }

      if (data?.id && data?.status) {
        setTransferResult({ id: data.id, status: data.status });
      }
    } catch {
      setTransferError(messages.transferCreateError);
    } finally {
      setIsTransferSubmitting(false);
    }
  }, [
    bankAccount,
    bankName,
    isExpired,
    isTransferValid,
    lockedQuoteId,
    memo,
    messages.invalidQuoteError,
    messages.quoteExpiredError,
    messages.transferCreateError,
    messages.transferIncompleteMessage,
    mobileMoneyNumber,
    mobileMoneyProvider,
    payoutRail,
    quote,
    trimmedRecipientCountry,
    trimmedRecipientName,
    trimmedRecipientPhone,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchQuote();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [fetchQuote]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchRecommendation();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [fetchRecommendation]);

  useEffect(() => {
    if (!quote?.expiresAt) {
      setSecondsRemaining(0);
      setIsExpired(false);
      return;
    }
    const expiresAt = new Date(quote.expiresAt).getTime();
    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((expiresAt - Date.now()) / 1000)
      );
      setSecondsRemaining(remaining);
      setIsExpired(remaining === 0);
    };
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [quote?.expiresAt]);

  useEffect(() => {
    if (!lockedQuoteId || !quote?.id) {
      return;
    }
    if (lockedQuoteId !== quote.id) {
      setLockedQuoteId(null);
      setLockError(messages.lockQuoteUpdated);
    }
  }, [lockedQuoteId, messages.lockQuoteUpdated, quote?.id]);

  const routeHighlightLabels = useMemo(
    () => ({
      LOWEST_TOTAL_FEE: messages.routeHighlightLowestFee,
      FASTEST_ETA: messages.routeHighlightFastestEta,
      HIGHEST_PAYOUT: messages.routeHighlightHighestPayout,
    }),
    [messages]
  );

  const resolveRouteHighlights = useCallback(
    (route: RecommendationRoute | null) => {
      if (!route) {
        return "—";
      }
      const labels =
        route.highlights?.map((code) => routeHighlightLabels[code]) ?? [];
      const filtered = labels.filter(Boolean);
      return filtered.length > 0
        ? filtered.join(" · ")
        : messages.routeActiveLabel;
    },
    [messages.routeActiveLabel, routeHighlightLabels]
  );

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

  const resolveStatusLabel = useCallback(
    (status: string) => statusLabels[status as keyof typeof statusLabels] ?? status,
    [statusLabels]
  );

  const suggestionCards = [
    {
      key: "cheapest",
      label: messages.cheapestLabel,
      accent: "border-emerald-400/40 bg-emerald-500/20 text-emerald-200",
      route: cheapestRoute,
    },
    {
      key: "fastest",
      label: messages.fastestLabel,
      accent: "border-sky-400/40 bg-sky-500/20 text-sky-200",
      route: fastestRoute,
    },
    {
      key: "best",
      label: messages.bestValueLabel,
      accent: "border-amber-400/40 bg-amber-500/20 text-amber-200",
      route: bestValueRoute,
    },
  ];

  return (
    <div
      className={`${grotesk.variable} ${fraunces.variable} min-h-screen bg-[radial-gradient(circle_at_top,_#f8d6b8,_#fdf7f0_40%,_#eef4ff)] text-slate-900`}
    >
      <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16 sm:px-10">
        <section className="grid w-full gap-8 rounded-3xl border border-slate-200/60 bg-white/80 p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur md:grid-cols-[1.2fr_0.8fr] md:gap-10 md:p-12">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {messages.quoteTitle(displayFromAsset, displayToAsset)}
              </p>
              <h1 className="font-[var(--font-fraunces)] text-3xl leading-tight text-slate-900 sm:text-4xl">
                {messages.heroTitle}
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                {messages.heroSubtitle}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  {messages.fromAssetLabel}
                  <select
                    value={fromAsset}
                    onChange={(event) => setFromAsset(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                    aria-label={messages.fromAssetLabel}
                  >
                    {assetsList.map((asset) => (
                      <option key={asset.code} value={asset.code}>
                        {asset.code} · {asset.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  {messages.toAssetLabel}
                  <select
                    value={toAsset}
                    onChange={(event) => setToAsset(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                    aria-label={messages.toAssetLabel}
                  >
                    {assetsList.map((asset) => (
                      <option key={asset.code} value={asset.code}>
                        {asset.code} · {asset.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  {messages.railLabel}
                  <select
                    value={rail}
                    onChange={(event) => setRail(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                    aria-label={messages.railLabel}
                  >
                    {payoutRailOptions.map((railOption) => (
                      <option key={railOption.code} value={railOption.code}>
                        {railOption.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {assetsLoading ? (
                <p className="mt-3 text-xs text-slate-400">
                  {messages.assetsLoading}
                </p>
              ) : null}
              {assetsError ? (
                <p className="mt-2 text-xs text-rose-600">{assetsError}</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-6 shadow-sm">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                {messages.sendAmountLabel} ({fromAsset})
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-900">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {fromAsset}
                  </span>
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step={sendStep}
                    value={sendAmount}
                    onChange={(event) => setSendAmount(event.target.value)}
                    className="w-full bg-transparent text-2xl outline-none"
                    aria-label={`Send amount in ${fromAsset}`}
                  />
                </div>
              </label>
              <p className="mt-3 text-xs text-slate-500">
                {messages.sendAmountHint}
              </p>
            </div>

            <div className="grid gap-4 rounded-2xl border border-slate-200/70 bg-white px-5 py-6 text-sm text-slate-700 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  {messages.marketRateLabel} ({toAsset} per 1 {fromAsset})
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.0001"
                    value={marketRate}
                    onChange={(event) => setMarketRate(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                    aria-label={`Market rate in ${toAsset}`}
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  {messages.fxMarginLabel}
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={fxMargin}
                    onChange={(event) => setFxMargin(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                    aria-label={messages.fxMarginLabel}
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  {messages.fixedFeeLabel} ({fromAsset})
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={fixedFee}
                    onChange={(event) => setFixedFee(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                    aria-label={`Fixed fee in ${fromAsset}`}
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  {messages.percentFeeLabelWithAsset(fromAsset)}
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={percentFee}
                    onChange={(event) => setPercentFee(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                    aria-label={messages.percentFeeLabelWithAsset(fromAsset)}
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <span>
                  {hasQuote
                    ? `1 ${displayFromAsset} = ${formatNumber(
                        numericMarketRate,
                        4,
                        locale
                      )} ${displayToAsset} ${messages.marketRateSuffix}`
                    : messages.marketRatePending}
                </span>
                <span>
                  {hasQuote
                    ? `${messages.appliedRateRow}: 1 ${displayFromAsset} = ${formatNumber(
                        appliedRate,
                        4,
                        locale
                      )} ${displayToAsset}`
                    : messages.appliedRatePending}
                </span>
              </div>
            </div>

            {lockedQuoteId ? (
              <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-6 text-sm text-slate-700 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      {messages.transferDetailsLabel}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {messages.lockedQuoteLabel}: {lockedQuoteId} ·{" "}
                      {messages.railDisplayLabel}: {railMeta?.name ?? displayRail}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    {messages.draftLabel}
                  </span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    {messages.recipientNameLabel}
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(event) => setRecipientName(event.target.value)}
                      onBlur={() =>
                        setTransferTouched((prev) => ({ ...prev, name: true }))
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                      aria-label={messages.recipientNameLabel}
                    />
                    {nameError ? (
                      <span className="text-[11px] font-medium text-rose-600">
                        {nameError}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    {messages.recipientCountryLabel}
                    <input
                      type="text"
                      maxLength={2}
                      value={recipientCountry}
                      onChange={(event) => {
                        setRecipientCountry(event.target.value.toUpperCase());
                        setTransferTouched((prev) => ({
                          ...prev,
                          country: true,
                        }));
                      }}
                      onBlur={() =>
                        setTransferTouched((prev) => ({
                          ...prev,
                          country: true,
                        }))
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                      aria-label={messages.recipientCountryLabel}
                    />
                    {countryError ? (
                      <span className="text-[11px] font-medium text-rose-600">
                        {countryError}
                      </span>
                    ) : null}
                  </label>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    {messages.recipientPhoneLabel}
                    <input
                      inputMode="tel"
                      type="tel"
                      value={recipientPhone}
                      onChange={(event) => setRecipientPhone(event.target.value)}
                      onBlur={() =>
                        setTransferTouched((prev) => ({ ...prev, phone: true }))
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                      aria-label={messages.recipientPhoneLabel}
                    />
                    {phoneError ? (
                      <span className="text-[11px] font-medium text-rose-600">
                        {phoneError}
                      </span>
                    ) : null}
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    {messages.memoLabel}
                    <input
                      type="text"
                      value={memo}
                      onChange={(event) => setMemo(event.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                      aria-label={messages.memoLabel}
                    />
                  </label>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    {messages.payoutRailLabel}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {payoutRailOptions.map((railOption) => (
                      <label
                        key={railOption.code}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700"
                      >
                        <input
                          type="radio"
                          name="payoutRail"
                          value={railOption.code}
                          checked={payoutRail === railOption.code}
                          onChange={() => {
                            setPayoutRail(
                              railOption.code as "MOBILE_MONEY" | "BANK" | "LIGHTNING"
                            );
                            setTransferTouched((prev) => ({
                              ...prev,
                              payout: true,
                            }));
                          }}
                          className="h-4 w-4"
                          aria-label={railOption.name}
                        />
                        {railOption.name}
                      </label>
                    ))}
                  </div>
                  {payoutError ? (
                    <p className="mt-2 text-xs text-rose-600">{payoutError}</p>
                  ) : null}
                </div>
                {payoutRail === "BANK" ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      {messages.bankNameLabel}
                      <input
                        type="text"
                        value={bankName}
                        onChange={(event) => setBankName(event.target.value)}
                        onBlur={() =>
                          setTransferTouched((prev) => ({ ...prev, bank: true }))
                        }
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                        aria-label={messages.bankNameLabel}
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      {messages.bankAccountLabel}
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={(event) => setBankAccount(event.target.value)}
                        onBlur={() =>
                          setTransferTouched((prev) => ({ ...prev, bank: true }))
                        }
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                        aria-label={messages.bankAccountLabel}
                      />
                    </label>
                    {bankError ? (
                      <p className="text-xs text-rose-600">{bankError}</p>
                    ) : null}
                  </div>
                ) : null}
                {payoutRail === "MOBILE_MONEY" ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      {messages.mobileMoneyProviderLabel}
                      <input
                        type="text"
                        value={mobileMoneyProvider}
                        onChange={(event) =>
                          setMobileMoneyProvider(event.target.value)
                        }
                        onBlur={() =>
                          setTransferTouched((prev) => ({
                            ...prev,
                            mobileMoney: true,
                          }))
                        }
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                        aria-label={messages.mobileMoneyProviderLabel}
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      {messages.mobileMoneyNumberLabel}
                      <input
                        type="text"
                        value={mobileMoneyNumber}
                        onChange={(event) =>
                          setMobileMoneyNumber(event.target.value)
                        }
                        onBlur={() =>
                          setTransferTouched((prev) => ({
                            ...prev,
                            mobileMoney: true,
                          }))
                        }
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                        aria-label={messages.mobileMoneyNumberLabel}
                      />
                    </label>
                    {mobileMoneyError ? (
                      <p className="text-xs text-rose-600">{mobileMoneyError}</p>
                    ) : null}
                  </div>
                ) : null}
                <button
                  type="button"
                  disabled={!isTransferValid || isTransferSubmitting}
                  onClick={handleCreateTransfer}
                  className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {isTransferSubmitting
                    ? messages.transferSubmitting
                    : messages.createTransferButton}
                </button>
                {transferError ? (
                  <p className="mt-2 text-xs text-rose-600">{transferError}</p>
                ) : null}
                {transferResult ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <p className="font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {messages.transferCreatedLabel}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span>{messages.transferIdLabel}</span>
                      <span className="font-medium text-slate-900">
                        {transferResult.id}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span>{messages.transferStatusLabel}</span>
                      <span className="font-medium text-slate-900">
                        {resolveStatusLabel(transferResult.status)}
                      </span>
                    </div>
                    <Link
                      href={`/${locale}/transfer/${transferResult.id}`}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-900 transition hover:border-slate-300"
                    >
                      {messages.viewReceiptButton}
                    </Link>
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  {isTransferValid
                    ? messages.transferReadyMessage
                    : messages.transferIncompleteMessage}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="flex h-full flex-col justify-between gap-6 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {messages.recipientGetsLabel}
                </p>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-200">
                  {hasQuote
                    ? isExpired
                      ? messages.quoteExpired
                      : messages.quoteValidFor(secondsRemaining)
                    : messages.quoteFetching}
                </span>
              </div>
              <div>
                <p className="font-[var(--font-fraunces)] text-4xl leading-tight sm:text-5xl">
                  {hasQuote ? formatAmount(recipientGets, displayToAsset) : "—"}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {hasQuote
                    ? messages.basedOnAfterFees(
                        formatAmount(netConverted, displayFromAsset)
                      )
                    : messages.waitingForQuote}
                </p>
                {isLoading ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                    {messages.refreshingQuote}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs text-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                  {messages.smartSuggestionsLabel}
                </p>
                {recommendationLoading ? (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    {messages.recommendationLoading}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 grid gap-3">
                {suggestionCards.map((card) => (
                  <div
                    key={card.key}
                    className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs text-slate-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${card.accent}`}
                      >
                        {card.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        {resolveRouteHighlights(card.route)}
                      </span>
                    </div>
                    {card.route ? (
                      <>
                        <p className="mt-3 text-sm font-semibold text-white">
                          {resolveRailName(card.route.rail)}
                        </p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                          {messages.etaRangeLabel(
                            card.route.etaMinMinutes,
                            card.route.etaMaxMinutes
                          )}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-300">
                          <span>{messages.totalFeeRow}</span>
                          <span>
                            {formatAmount(
                              card.route.totalFee,
                              suggestionFrom
                            )}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-300">
                          <span>{messages.recipientGetsLabel}</span>
                          <span>
                            {formatAmount(
                              card.route.recipientGets,
                              suggestionTo
                            )}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyRouteSuggestion(card.route)}
                          className="mt-3 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-white/20"
                        >
                          {messages.useRouteButton}
                        </button>
                      </>
                    ) : (
                      <p className="mt-3 text-xs text-slate-400">
                        {messages.recommendationEmpty}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {recommendationError ? (
                <p className="mt-3 text-xs text-rose-200">
                  {recommendationError}
                </p>
              ) : null}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs leading-5 text-slate-300">
              <p className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                {messages.quoteBreakdownLabel}
              </p>
              <div className="mt-3 flex items-center justify-between text-slate-400">
                <span>{messages.quoteIdLabel}</span>
                <span className="font-medium text-slate-200">
                  {quote?.id ?? "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-slate-400">
                <span>{messages.expiresAtLabel}</span>
                <span className="font-medium text-slate-200">
                  {expiresAtLabel}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-slate-400">
                <span>{messages.railDisplayLabel}</span>
                <span className="font-medium text-slate-200">
                  {railMeta?.name ?? displayRail}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>{messages.sendAmountRow}</span>
                <span>
                  {hasQuote ? formatAmount(numericSend, displayFromAsset) : "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>{messages.totalFeeRow}</span>
                <span>
                  {hasQuote ? formatAmount(totalFee, displayFromAsset) : "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>{messages.netConvertedRow}</span>
                <span>
                  {hasQuote
                    ? formatAmount(netConverted, displayFromAsset)
                    : "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>{messages.appliedRateRow}</span>
                <span>
                  {hasQuote
                    ? `1 ${displayFromAsset} = ${formatNumber(
                        appliedRate,
                        4,
                        locale
                      )} ${displayToAsset}`
                    : "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>{messages.fxMarginRow}</span>
                <span>
                  {hasQuote ? formatPercent(numericFxMargin, locale) : "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>{messages.effectiveRateRow}</span>
                <span>
                  {hasQuote
                    ? `1 ${displayFromAsset} = ${formatNumber(
                        effectiveRate,
                        4,
                        locale
                      )} ${displayToAsset}`
                    : "—"}
                </span>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[11px] text-slate-200">
                {hasQuote
                  ? `${messages.feesLabel}: ${formatAmount(
                      numericFixedFee,
                      displayFromAsset
                    )} ${messages.fixedFeeSuffix} + ${formatPercent(
                      numericPercentFee,
                      locale
                    )} (${formatAmount(
                      percentFeeAmount,
                      displayFromAsset
                    )})`
                  : `${messages.feesLabel}: —`}
              </div>
              {quoteError ? (
                <p className="mt-3 text-xs text-rose-200">{quoteError}</p>
              ) : null}
              {lockError ? (
                <p className="mt-3 text-xs text-amber-200">{lockError}</p>
              ) : null}
              <button
                type="button"
                onClick={handleLockQuote}
                disabled={!hasQuote || isLoading || pendingLock}
                className="mt-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingLock
                  ? messages.lockQuoteRefreshing
                  : messages.lockQuoteButton}
              </button>
              {hasQuote && isExpired ? (
                <button
                  type="button"
                  onClick={fetchQuote}
                  disabled={isLoading}
                  className="mt-3 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {messages.refreshQuoteButton}
                </button>
              ) : null}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

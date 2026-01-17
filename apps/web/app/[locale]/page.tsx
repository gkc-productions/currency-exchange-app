"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SendCard from "@/components/SendCard";
import { COUNTRY_OPTIONS } from "@/components/country-options";
import { formatDateTime, formatMoney, formatPercent } from "@/src/lib/format";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

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
  USD: "US",
  EUR: "FR",
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
  XCD: "LC",
  BTC: "GL",
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

type RecommendationSuggestion = {
  type: "CHEAPEST" | "FASTEST" | "BEST_VALUE";
  routeId: string;
  reason: string;
  scoreBreakdown: {
    fee: number;
    payout: number;
    etaMinutes: number;
  };
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
  cheapestRouteId: string | null;
  fastestRouteId: string | null;
  bestValueRouteId: string | null;
  suggestions?: RecommendationSuggestion[];
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
  const [quoteActive, setQuoteActive] = useState(false);
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
    reference?: string;
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
  const quoteViewedRef = useRef<Set<string>>(new Set());

  const expiresAtLabel = useMemo(() => {
    if (!quote?.expiresAt) {
      return "—";
    }
    return formatDateTime(quote.expiresAt, locale);
  }, [quote?.expiresAt, locale]);

  const rateTimestampLabel = useMemo(() => {
    if (!quote?.rateTimestamp) {
      return "—";
    }
    return formatDateTime(quote.rateTimestamp, locale);
  }, [quote?.rateTimestamp, locale]);

  const assetsList = assets.length > 0 ? assets : DEFAULT_ASSETS;
  const assetMap = useMemo(() => {
    return new Map(assetsList.map((asset) => [asset.code, asset]));
  }, [assetsList]);
  const countryOptions = useMemo(() => {
    const assetNameMap = new Map(
      assetsList.map((asset) => [asset.code, asset.name])
    );
    const options = COUNTRY_OPTIONS.map((option) => ({
      ...option,
      assetName: assetNameMap.get(option.assetCode) ?? option.assetName,
    }));
    const ensureAsset = (assetCode: string) => {
      if (options.some((option) => option.assetCode === assetCode)) {
        return;
      }
      const assetName = assetNameMap.get(assetCode) ?? assetCode;
      options.push({
        id: `asset-${assetCode.toLowerCase()}`,
        countryCode: "",
        countryName: assetName,
        assetCode,
        assetName,
      });
    };
    ensureAsset(fromAsset);
    ensureAsset(toAsset);
    return options;
  }, [assetsList, fromAsset, toAsset]);
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
  const cheapestRoute =
    recommendation && recommendation.cheapestRouteId
      ? recommendationMap.get(recommendation.cheapestRouteId) ?? null
      : null;
  const fastestRoute =
    recommendation && recommendation.fastestRouteId
      ? recommendationMap.get(recommendation.fastestRouteId) ?? null
      : null;
  const bestValueRoute =
    recommendation && recommendation.bestValueRouteId
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

  const handleGetStarted = useCallback(() => {
    if (!quoteActive) {
      setQuoteActive(true);
    } else {
      fetchQuote();
      fetchRecommendation();
    }
    window.setTimeout(() => {
      document
        .getElementById("quote")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [fetchQuote, fetchRecommendation, quoteActive]);

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
      console.info("RouteSelected", {
        routeId: route.id,
        rail: route.rail,
        provider: route.provider,
      });
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
        | {
            id?: string;
            status?: string;
            reference?: string;
            error?: string;
            expired?: boolean;
          }
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
        setTransferResult({
          id: data.id,
          status: data.status,
          reference: data.reference,
        });
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
    if (!quoteActive) {
      return;
    }
    const timer = window.setTimeout(() => {
      fetchQuote();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [fetchQuote, quoteActive]);

  useEffect(() => {
    if (!quoteActive) {
      return;
    }
    const timer = window.setTimeout(() => {
      fetchRecommendation();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [fetchRecommendation, quoteActive]);

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

  useEffect(() => {
    if (!quote?.id || quoteViewedRef.current.has(quote.id)) {
      return;
    }
    quoteViewedRef.current.add(quote.id);
    console.info("QuoteViewed", {
      quoteId: quote.id,
      from: quote.from,
      to: quote.to,
      sendAmount: quote.sendAmount,
      rail: quote.rail,
    });
  }, [quote?.from, quote?.id, quote?.rail, quote?.sendAmount, quote?.to]);

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

  const suggestionLabels = useMemo(
    () => ({
      CHEAPEST: messages.cheapestLabel,
      FASTEST: messages.fastestLabel,
      BEST_VALUE: messages.bestValueLabel,
    }),
    [messages]
  );

  const suggestionAccents: Record<
    RecommendationSuggestion["type"],
    { badge: string; card: string }
  > = {
    BEST_VALUE: {
      badge: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
      card: "border-emerald-200/70 bg-emerald-50/60",
    },
    CHEAPEST: {
      badge: "border-sky-200/70 bg-sky-50 text-sky-700",
      card: "border-sky-200/70 bg-sky-50/60",
    },
    FASTEST: {
      badge: "border-amber-200/70 bg-amber-50 text-amber-700",
      card: "border-amber-200/70 bg-amber-50/60",
    },
  };

  const buildFallbackSuggestion = useCallback(
    (type: RecommendationSuggestion["type"], route: RecommendationRoute | null) => {
      if (!route) {
        return null;
      }
      return {
        type,
        routeId: route.id,
        reason: route.explanation,
        scoreBreakdown: {
          fee: route.totalFee,
          payout: route.recipientGets,
          etaMinutes: Math.round(
            (route.etaMinMinutes + route.etaMaxMinutes) / 2
          ),
        },
      } satisfies RecommendationSuggestion;
    },
    []
  );

  const suggestionItems = useMemo(() => {
    if (!recommendation) {
      return [] as (RecommendationSuggestion & { route: RecommendationRoute })[];
    }
    const baseSuggestions =
      recommendation.suggestions && recommendation.suggestions.length > 0
        ? recommendation.suggestions
        : [
            buildFallbackSuggestion("BEST_VALUE", bestValueRoute),
            buildFallbackSuggestion("CHEAPEST", cheapestRoute),
            buildFallbackSuggestion("FASTEST", fastestRoute),
          ].filter(Boolean);

    const uniqueByRoute = new Map<string, RecommendationSuggestion>();
    for (const suggestion of baseSuggestions) {
      if (!suggestion) {
        continue;
      }
      if (!uniqueByRoute.has(suggestion.routeId)) {
        uniqueByRoute.set(suggestion.routeId, suggestion);
      }
    }
    const merged = Array.from(uniqueByRoute.values());
    return merged
      .map((suggestion) => {
        const route = recommendationMap.get(suggestion.routeId);
        return route ? { ...suggestion, route } : null;
      })
      .filter(Boolean) as (RecommendationSuggestion & { route: RecommendationRoute })[];
  }, [
    bestValueRoute,
    buildFallbackSuggestion,
    cheapestRoute,
    fastestRoute,
    recommendation,
    recommendationMap,
  ]);

  const recommendedSuggestion =
    suggestionItems.find((item) => item.type === "BEST_VALUE") ??
    suggestionItems[0] ??
    null;
  const otherSuggestions = suggestionItems.filter(
    (item) => item.routeId !== recommendedSuggestion?.routeId
  );
  const recommendedType: RecommendationSuggestion["type"] =
    recommendedSuggestion?.type ?? "BEST_VALUE";
  const limitedRoutes =
    (recommendation?.routes?.length ?? 0) > 0 &&
    (recommendation?.routes?.length ?? 0) < 3;

  const trustItems = [
    messages.trustItemTransparent,
    messages.trustItemFast,
    messages.trustItemSecure,
  ];

  const featureCards = [
    {
      title: messages.featureSmartRoutingTitle,
      description: messages.featureSmartRoutingDescription,
    },
    {
      title: messages.featureMultiRailTitle,
      description: messages.featureMultiRailDescription,
    },
    {
      title: messages.featureTrackingTitle,
      description: messages.featureTrackingDescription,
    },
  ];

  const faqItems = [
    { question: messages.faqQuestionOne, answer: messages.faqAnswerOne },
    { question: messages.faqQuestionTwo, answer: messages.faqAnswerTwo },
    { question: messages.faqQuestionThree, answer: messages.faqAnswerThree },
    { question: messages.faqQuestionFour, answer: messages.faqAnswerFour },
  ];

  const countrySelectCopy = {
    changeLabel: messages.countrySelectChangeLabel,
    dialogTitle: messages.countrySelectDialogTitle,
    dialogSubtitle: messages.countrySelectDialogSubtitle,
    closeLabel: messages.countrySelectCloseLabel,
    searchPlaceholder: messages.countrySelectSearchPlaceholder,
    searchLabel: messages.countrySelectSearchLabel,
    noResultsLabel: messages.countrySelectNoResultsLabel,
    selectFallback: messages.countrySelectFallbackLabel,
  };

  const inputClassName =
    "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40";
  const cardClassName =
    "rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]";

  return (
    <div className="bg-[var(--brand-surface)] text-slate-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_#d9f3ee,_#f5f7fb_50%,_#fff4e6)]">
        <div className="pointer-events-none absolute -top-24 right-8 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl motion-safe:animate-[float-slow_12s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl motion-safe:animate-[float-slow_14s_ease-in-out_infinite]" />
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
                  {messages.heroWelcomeLabel}
                </p>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
                  ClariSend
                </span>
              </div>
              <h1 className="font-[var(--font-display)] text-4xl leading-tight text-slate-900 sm:text-5xl">
                {messages.heroTitle}
              </h1>
              <p className="max-w-xl text-lg text-slate-600">
                {messages.heroSubtitle}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
                <Link
                  href={`/${locale}#features`}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-600 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                >
                  {messages.featuresLinkLabel}
                </Link>
                <Link
                  href={`/${locale}#faq`}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-600 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                >
                  {messages.footerFaqLinkLabel}
                </Link>
              </div>
            </div>
            <div id="send" className="w-full">
              <SendCard
                title={messages.sendCardTitle}
                subtitle={messages.sendCardSubtitle}
                fromLabel={messages.sendFromLabel}
                toLabel={messages.sendToLabel}
                railLabel={messages.railLabel}
                amountLabel={messages.sendAmountLabel}
                amountHint={messages.sendAmountHint}
                submitLabel={messages.sendCtaLabel}
                assetsLoadingLabel={messages.assetsLoading}
                fromAsset={fromAsset}
                toAsset={toAsset}
                rail={rail}
                sendAmount={sendAmount}
                sendStep={sendStep}
                railOptions={payoutRailOptions}
                countryOptions={countryOptions}
                assetsLoading={assetsLoading}
                assetsError={assetsError}
                onChangeFrom={setFromAsset}
                onChangeTo={setToAsset}
                onChangeRail={setRail}
                onChangeAmount={setSendAmount}
                onSubmit={handleGetStarted}
                countrySelectCopy={countrySelectCopy}
              />
            </div>
          </div>
          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              {messages.trustTitle}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                      <path
                        fill="currentColor"
                        d="M9.55 17.2L4.8 12.45l1.77-1.77 2.98 2.98 7.5-7.5 1.77 1.77-9.27 9.27z"
                      />
                    </svg>
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {quoteActive ? (
        <section
          id="quote"
          className="border-y border-slate-200/70 bg-white"
          data-testid="quote-section"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {messages.quoteTitle(displayFromAsset, displayToAsset)}
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-3xl text-slate-900">
                  {messages.quoteBreakdownLabel}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  {messages.quoteSectionSubtitle}
                </p>
              </div>
              <Link
                href={`/${locale}#send`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                {messages.editSendDetailsLabel}
              </Link>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <div className="rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-[0_25px_60px_-40px_rgba(15,23,42,0.6)]">
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
                  <div className="mt-4">
                    <p className="font-[var(--font-display)] text-4xl leading-tight sm:text-5xl">
                      {hasQuote
                        ? formatAmount(recipientGets, displayToAsset)
                        : "—"}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {hasQuote
                        ? messages.basedOnAfterFees(
                            formatAmount(netConverted, displayFromAsset)
                          )
                        : messages.waitingForQuote}
                    </p>
                    {isLoading ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                        {messages.refreshingQuote}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className={cardClassName} data-testid="recommendation-section">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                      {messages.smartSuggestionsLabel}
                    </p>
                    {recommendationLoading ? (
                      <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        {messages.recommendationLoading}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    {recommendationLoading ? (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-28 rounded-2xl bg-slate-100" />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="h-20 rounded-2xl bg-slate-100" />
                          <div className="h-20 rounded-2xl bg-slate-100" />
                        </div>
                      </div>
                    ) : recommendedSuggestion ? (
                      <div
                        className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-4 text-sm text-slate-700"
                        data-testid="recommendation-recommended"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full border border-emerald-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                              {messages.recommendationRecommendedLabel}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${suggestionAccents[recommendedType].badge}`}
                            >
                              {suggestionLabels[recommendedType]}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                            {messages.etaRangeLabel(
                              recommendedSuggestion.route.etaMinMinutes,
                              recommendedSuggestion.route.etaMaxMinutes
                            )}
                          </span>
                        </div>
                        <p
                          className="mt-3 text-base font-semibold text-slate-900"
                          data-testid="recommendation-rail"
                        >
                          {resolveRailName(recommendedSuggestion.route.rail)}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {messages.recommendationReasonLabel}:
                          </span>{" "}
                          {recommendedSuggestion.reason}
                        </p>
                        <details className="mt-3 rounded-xl border border-emerald-100 bg-white/80 px-3 py-2 text-xs text-slate-600">
                          <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                            {messages.recommendationWhyRouteLabel}
                          </summary>
                          <div className="mt-2 space-y-1">
                            <p>{recommendedSuggestion.route.explanation}</p>
                            <p>{recommendedSuggestion.reason}</p>
                          </div>
                        </details>
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                          <div className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-2">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                              {messages.recommendationScoreFeeLabel}
                            </span>
                            <p className="mt-1 font-semibold text-slate-900">
                              {formatAmount(
                                recommendedSuggestion.scoreBreakdown.fee,
                                suggestionFrom
                              )}
                            </p>
                          </div>
                          <div className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-2">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                              {messages.recommendationScorePayoutLabel}
                            </span>
                            <p className="mt-1 font-semibold text-slate-900">
                              {formatAmount(
                                recommendedSuggestion.scoreBreakdown.payout,
                                suggestionTo
                              )}
                            </p>
                          </div>
                          <div className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-2">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                              {messages.recommendationScoreEtaLabel}
                            </span>
                            <p className="mt-1 font-semibold text-slate-900">
                              {recommendedSuggestion.scoreBreakdown.etaMinutes} min
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyRouteSuggestion(recommendedSuggestion.route)}
                          className="mt-4 w-full rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                        >
                          {messages.useRouteButton}
                        </button>
                      </div>
                    ) : (
                      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                        {messages.recommendationEmpty}
                      </p>
                    )}
                  </div>
                  {recommendationError ? (
                    <p className="mt-3 text-xs text-amber-600">
                      {recommendationError}
                    </p>
                  ) : null}
                  {!recommendationLoading && limitedRoutes && recommendedSuggestion ? (
                    <p className="mt-3 text-xs text-slate-500">
                      {messages.recommendationSingleLabel}
                    </p>
                  ) : null}
                  {!recommendationLoading && otherSuggestions.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                        {messages.recommendationOtherLabel}
                      </p>
                      <div className="mt-3 grid gap-3">
                        {otherSuggestions.map((item) => {
                          const accent = suggestionAccents[item.type];
                          return (
                            <div
                              key={item.routeId}
                              className={`rounded-2xl border px-4 py-3 text-sm text-slate-700 ${accent.card}`}
                              data-testid="recommendation-option"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${accent.badge}`}
                                >
                                  {suggestionLabels[item.type]}
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                  {messages.etaRangeLabel(
                                    item.route.etaMinMinutes,
                                    item.route.etaMaxMinutes
                                  )}
                                </span>
                              </div>
                              <p
                                className="mt-3 text-base font-semibold text-slate-900"
                                data-testid="recommendation-rail"
                              >
                                {resolveRailName(item.route.rail)}
                              </p>
                              <p className="mt-2 text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">
                                  {messages.recommendationReasonLabel}:
                                </span>{" "}
                                {item.reason}
                              </p>
                              <details className="mt-2 rounded-xl border border-slate-100 bg-white/80 px-3 py-2 text-xs text-slate-600">
                                <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                  {messages.recommendationWhyRouteLabel}
                                </summary>
                                <div className="mt-2 space-y-1">
                                  <p>{item.route.explanation}</p>
                                  <p>{item.reason}</p>
                                </div>
                              </details>
                              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                                <span>{messages.totalFeeRow}</span>
                                <span>
                                  {formatAmount(item.route.totalFee, suggestionFrom)}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                                <span>{messages.recipientGetsLabel}</span>
                                <span>
                                  {formatAmount(item.route.recipientGets, suggestionTo)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => applyRouteSuggestion(item.route)}
                                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                              >
                                {messages.useRouteButton}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className={cardClassName} data-testid="quote-breakdown">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    {messages.quoteBreakdownLabel}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>{messages.quoteIdLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {quote?.id ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.expiresAtLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {expiresAtLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.rateLockedAtLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {rateTimestampLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.railDisplayLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {railMeta?.name ?? displayRail}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>{messages.sendAmountRow}</span>
                      <span>
                        {hasQuote
                          ? formatAmount(numericSend, displayFromAsset)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.totalFeeRow}</span>
                      <span>
                        {hasQuote
                          ? formatAmount(totalFee, displayFromAsset)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.netConvertedRow}</span>
                      <span>
                        {hasQuote
                          ? formatAmount(netConverted, displayFromAsset)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
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
                    <div className="flex items-center justify-between">
                      <span>{messages.fxMarginRow}</span>
                      <span>
                        {hasQuote ? formatPercent(numericFxMargin, locale) : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
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
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
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
                    <p className="mt-3 text-xs text-amber-600">{quoteError}</p>
                  ) : null}
                  {lockError ? (
                    <p className="mt-3 text-xs text-amber-600">{lockError}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLockQuote}
                    disabled={!hasQuote || isLoading || pendingLock}
                    className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:bg-slate-300"
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
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {messages.refreshQuoteButton}
                    </button>
                  ) : null}
                </div>
                <div className={cardClassName}>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    {messages.trustSignalsLabel}
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p>
                      {messages.rateLockedAtLabel} {rateTimestampLabel}
                    </p>
                    <p>{messages.feeRefundGuaranteeCopy}</p>
                    <p>{messages.complianceCopy}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className={cardClassName}>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    {messages.pricingControlsTitle}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {messages.pricingControlsSubtitle}
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {messages.marketRateLabel} ({toAsset} per 1 {fromAsset})
                      <input
                        inputMode="decimal"
                        type="number"
                        min="0"
                        step="0.0001"
                        value={marketRate}
                        onChange={(event) => setMarketRate(event.target.value)}
                        className={inputClassName}
                        aria-label={`Market rate in ${toAsset}`}
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {messages.fxMarginLabel}
                      <input
                        inputMode="decimal"
                        type="number"
                        min="0"
                        step="0.01"
                        value={fxMargin}
                        onChange={(event) => setFxMargin(event.target.value)}
                        className={inputClassName}
                        aria-label={messages.fxMarginLabel}
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {messages.fixedFeeLabel} ({fromAsset})
                      <input
                        inputMode="decimal"
                        type="number"
                        min="0"
                        step="0.01"
                        value={fixedFee}
                        onChange={(event) => setFixedFee(event.target.value)}
                        className={inputClassName}
                        aria-label={`Fixed fee in ${fromAsset}`}
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {messages.percentFeeLabelWithAsset(fromAsset)}
                      <input
                        inputMode="decimal"
                        type="number"
                        min="0"
                        step="0.01"
                        value={percentFee}
                        onChange={(event) => setPercentFee(event.target.value)}
                        className={inputClassName}
                        aria-label={messages.percentFeeLabelWithAsset(fromAsset)}
                      />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-xs text-slate-500">
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
                  <div className={cardClassName}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
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
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        {messages.recipientNameLabel}
                        <input
                          type="text"
                          value={recipientName}
                          onChange={(event) => setRecipientName(event.target.value)}
                          onBlur={() =>
                            setTransferTouched((prev) => ({ ...prev, name: true }))
                          }
                          className={inputClassName}
                          aria-label={messages.recipientNameLabel}
                        />
                        {nameError ? (
                          <span className="text-[11px] font-medium text-rose-600">
                            {nameError}
                          </span>
                        ) : null}
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
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
                          className={inputClassName}
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
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        {messages.recipientPhoneLabel}
                        <input
                          inputMode="tel"
                          type="tel"
                          value={recipientPhone}
                          onChange={(event) => setRecipientPhone(event.target.value)}
                          onBlur={() =>
                            setTransferTouched((prev) => ({ ...prev, phone: true }))
                          }
                          className={inputClassName}
                          aria-label={messages.recipientPhoneLabel}
                        />
                        {phoneError ? (
                          <span className="text-[11px] font-medium text-rose-600">
                            {phoneError}
                          </span>
                        ) : null}
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        {messages.memoLabel}
                        <input
                          type="text"
                          value={memo}
                          onChange={(event) => setMemo(event.target.value)}
                          className={inputClassName}
                          aria-label={messages.memoLabel}
                        />
                      </label>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
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
                                  railOption.code as
                                    | "MOBILE_MONEY"
                                    | "BANK"
                                    | "LIGHTNING"
                                );
                                setTransferTouched((prev) => ({
                                  ...prev,
                                  payout: true,
                                }));
                              }}
                              className="h-4 w-4 accent-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                              aria-label={railOption.name}
                            />
                            {railOption.name}
                          </label>
                        ))}
                      </div>
                      {payoutError ? (
                        <p className="mt-2 text-xs text-rose-600">{payoutError}</p>
                      ) : null}
                      {payoutRail === "LIGHTNING" ? (
                        <details className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                          <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {messages.lightningEducationTitle}
                          </summary>
                          <p className="mt-2">{messages.lightningEducationBody}</p>
                        </details>
                      ) : null}
                    </div>
                    {payoutRail === "BANK" ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          {messages.bankNameLabel}
                          <input
                            type="text"
                            value={bankName}
                            onChange={(event) => setBankName(event.target.value)}
                            onBlur={() =>
                              setTransferTouched((prev) => ({ ...prev, bank: true }))
                            }
                            className={inputClassName}
                            aria-label={messages.bankNameLabel}
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          {messages.bankAccountLabel}
                          <input
                            type="text"
                            value={bankAccount}
                            onChange={(event) => setBankAccount(event.target.value)}
                            onBlur={() =>
                              setTransferTouched((prev) => ({ ...prev, bank: true }))
                            }
                            className={inputClassName}
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
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
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
                            className={inputClassName}
                            aria-label={messages.mobileMoneyProviderLabel}
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
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
                            className={inputClassName}
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
                      className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
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
                        {transferResult.reference ? (
                          <div className="mt-1 flex items-center justify-between">
                            <span>{messages.referenceCodeLabel}</span>
                            <span className="font-medium text-slate-900">
                              {transferResult.reference}
                            </span>
                          </div>
                        ) : null}
                        <div className="mt-1 flex items-center justify-between">
                          <span>{messages.transferStatusLabel}</span>
                          <span className="font-medium text-slate-900">
                            {resolveStatusLabel(transferResult.status)}
                          </span>
                        </div>
                        <Link
                          href={`/${locale}/transfer/${transferResult.id}`}
                          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-900 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                        >
                          {messages.viewReceiptButton}
                        </Link>
                        {transferResult.reference ? (
                          <Link
                            href={`/${locale}/track?reference=${transferResult.reference}`}
                            className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-700 transition hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                          >
                            {messages.trackTransferLinkLabel}
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">
                      {isTransferValid
                        ? messages.transferReadyMessage
                        : messages.transferIncompleteMessage}
                    </p>
                  </div>
                ) : (
                  <div className={cardClassName}>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                      {messages.transferDetailsLabel}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {messages.transferDetailsEmptyTitle}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {messages.transferDetailsEmptyDescription}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section id="features" className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
            {messages.featuresLinkLabel}
          </p>
          <h2 className="font-[var(--font-display)] text-3xl text-slate-900">
            {messages.featuresTitle}
          </h2>
          <p className="text-sm text-slate-600">{messages.featuresSubtitle}</p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {featureCards.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                  <path
                    fill="currentColor"
                    d="M12 2l8 4v6c0 5.25-3.4 9.9-8 11-4.6-1.1-8-5.75-8-11V6l8-4zm0 2.2L6 6.1v5.9c0 4.15 2.6 7.9 6 9 3.4-1.1 6-4.85 6-9V6.1l-6-1.9z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="faq"
        className="border-t border-slate-200/70 bg-slate-50"
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
              {messages.footerFaqLinkLabel}
            </p>
            <h2 className="font-[var(--font-display)] text-3xl text-slate-900">
              {messages.faqTitle}
            </h2>
            <p className="text-sm text-slate-600">{messages.faqSubtitle}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <div
                key={item.question}
                className="rounded-3xl border border-slate-200/70 bg-white p-6"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {item.question}
                </p>
                <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
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

const STORAGE_KEY = "clarisend.transferFlow.v1";

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

type Recipient = {
  id: string;
  name: string;
  country: string;
  rail: "BANK" | "MOBILE_MONEY" | "LIGHTNING";
  bankName: string | null;
  bankAccount: string | null;
  mobileMoneyProvider: string | null;
  mobileMoneyNumber: string | null;
  lightningInvoice: string | null;
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
  const { data: session } = useSession();
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
  const [recipientLightningInvoice, setRecipientLightningInvoice] = useState("");
  const [payoutRail, setPayoutRail] = useState<
    "" | "MOBILE_MONEY" | "BANK" | "LIGHTNING"
  >("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState("");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [memo, setMemo] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [recipientNotice, setRecipientNotice] = useState<string | null>(null);
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
  const [hasHydrated, setHasHydrated] = useState(false);

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
  const quoteLoading = isLoading || (quoteActive && !hasQuote);
  const fromAssetMeta = assetMap.get(fromAsset);
  const railMeta = payoutRailOptions.find((item) => item.code === displayRail);
  const sendStep = stepForDecimals(fromAssetMeta?.decimals ?? 2);
  const defaultRecipientCountry =
    DEFAULT_COUNTRY_BY_ASSET[displayToAsset] ?? "GH";
  const isPrimaryCorridor = fromAsset === "USD" && toAsset === "GHS";
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
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setHasHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<{
        sendAmount: string;
        fromAsset: string;
        toAsset: string;
        rail: string;
        marketRate: string;
        fxMargin: string;
        fixedFee: string;
        percentFee: string;
        quote: Quote | null;
        quoteActive: boolean;
        lockedQuoteId: string | null;
        recipientName: string;
        recipientCountry: string;
        recipientPhone: string;
        recipientLightningInvoice: string;
        payoutRail: "" | "MOBILE_MONEY" | "BANK" | "LIGHTNING";
        bankName: string;
        bankAccount: string;
        mobileMoneyProvider: string;
        mobileMoneyNumber: string;
        memo: string;
        selectedRecipientId: string;
        saveRecipient: boolean;
        transferResult: { id: string; status: string } | null;
      }>;

      if (parsed.sendAmount) setSendAmount(parsed.sendAmount);
      if (parsed.fromAsset) setFromAsset(parsed.fromAsset);
      if (parsed.toAsset) setToAsset(parsed.toAsset);
      if (parsed.rail) setRail(parsed.rail);
      if (parsed.marketRate) setMarketRate(parsed.marketRate);
      if (parsed.fxMargin) setFxMargin(parsed.fxMargin);
      if (parsed.fixedFee) setFixedFee(parsed.fixedFee);
      if (parsed.percentFee) setPercentFee(parsed.percentFee);
      if (parsed.quote) {
        setQuote(parsed.quote);
        setQuoteActive(true);
      }
      if (typeof parsed.quoteActive === "boolean") {
        setQuoteActive(parsed.quoteActive);
      }
      if (parsed.lockedQuoteId) setLockedQuoteId(parsed.lockedQuoteId);
      if (parsed.recipientName) setRecipientName(parsed.recipientName);
      if (parsed.recipientCountry) setRecipientCountry(parsed.recipientCountry);
      if (parsed.recipientPhone) setRecipientPhone(parsed.recipientPhone);
      if (parsed.recipientLightningInvoice) {
        setRecipientLightningInvoice(parsed.recipientLightningInvoice);
      }
      if (parsed.payoutRail) setPayoutRail(parsed.payoutRail);
      if (parsed.bankName) setBankName(parsed.bankName);
      if (parsed.bankAccount) setBankAccount(parsed.bankAccount);
      if (parsed.mobileMoneyProvider) {
        setMobileMoneyProvider(parsed.mobileMoneyProvider);
      }
      if (parsed.mobileMoneyNumber) {
        setMobileMoneyNumber(parsed.mobileMoneyNumber);
      }
      if (parsed.memo) setMemo(parsed.memo);
      if (parsed.selectedRecipientId) {
        setSelectedRecipientId(parsed.selectedRecipientId);
      }
      if (typeof parsed.saveRecipient === "boolean") {
        setSaveRecipient(parsed.saveRecipient);
      }
      if (parsed.transferResult) {
        setTransferResult(parsed.transferResult);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated || typeof window === "undefined") {
      return;
    }
    const payload = {
      sendAmount,
      fromAsset,
      toAsset,
      rail,
      marketRate,
      fxMargin,
      fixedFee,
      percentFee,
      quote,
      quoteActive,
      lockedQuoteId,
      recipientName,
      recipientCountry,
      recipientPhone,
      recipientLightningInvoice,
      payoutRail,
      bankName,
      bankAccount,
      mobileMoneyProvider,
      mobileMoneyNumber,
      memo,
      selectedRecipientId,
      saveRecipient,
      transferResult,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    hasHydrated,
    sendAmount,
    fromAsset,
    toAsset,
    rail,
    marketRate,
    fxMargin,
    fixedFee,
    percentFee,
    quote,
    quoteActive,
    lockedQuoteId,
    recipientName,
    recipientCountry,
    recipientPhone,
    recipientLightningInvoice,
    payoutRail,
    bankName,
    bankAccount,
    mobileMoneyProvider,
    mobileMoneyNumber,
    memo,
    selectedRecipientId,
    saveRecipient,
    transferResult,
  ]);

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
    if (!session?.user) {
      setRecipients([]);
      setRecipientsError(null);
      return;
    }
    let active = true;
    setRecipientsLoading(true);
    setRecipientsError(null);

    fetch("/api/recipients")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("load_failed");
        }
        return (await res.json()) as Recipient[];
      })
      .then((data) => {
        if (!active) {
          return;
        }
        setRecipients(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setRecipientsError(messages.recipientLoadError);
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setRecipientsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [messages.recipientLoadError, session?.user]);

  useEffect(() => {
    if (!transferTouched.country) {
      setRecipientCountry(defaultRecipientCountry);
    }
  }, [defaultRecipientCountry, transferTouched.country]);

  useEffect(() => {
    if (!selectedRecipientId) {
      return;
    }
    const recipient = recipients.find(
      (item) => item.id === selectedRecipientId
    );
    if (!recipient) {
      return;
    }
    setRecipientName(recipient.name);
    setRecipientCountry(recipient.country);
    setPayoutRail(recipient.rail);
    setBankName(recipient.bankName ?? "");
    setBankAccount(recipient.bankAccount ?? "");
    setMobileMoneyProvider(recipient.mobileMoneyProvider ?? "");
    setMobileMoneyNumber(recipient.mobileMoneyNumber ?? "");
    setRecipientLightningInvoice(recipient.lightningInvoice ?? "");
    setRecipientNotice(null);
  }, [recipients, selectedRecipientId]);

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
    setRecipientLightningInvoice("");
    setPayoutRail(rail as "BANK" | "MOBILE_MONEY" | "LIGHTNING");
    setBankName("");
    setBankAccount("");
    setMobileMoneyProvider("");
    setMobileMoneyNumber("");
    setMemo("");
    setSelectedRecipientId("");
    setSaveRecipient(false);
    setRecipientNotice(null);
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
    setRecipientNotice(null);

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
      let resolvedRecipientId = selectedRecipientId || undefined;

      if (saveRecipient) {
        if (!session?.user) {
          setTransferError(messages.recipientAuthHelper);
          return;
        }
        const recipientRes = await fetch("/api/recipients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedRecipientName,
            country: trimmedRecipientCountry,
            rail: payoutRail,
            bankName: bankName.trim() || undefined,
            bankAccount: bankAccount.trim() || undefined,
            mobileMoneyProvider: mobileMoneyProvider.trim() || undefined,
            mobileMoneyNumber: mobileMoneyNumber.trim() || undefined,
            lightningInvoice: recipientLightningInvoice.trim() || undefined,
          }),
        });
        const recipientPayload = (await recipientRes.json().catch(() => null)) as
          | Recipient
          | { error?: string }
          | null;
        const recipientError =
          recipientPayload && "error" in recipientPayload
            ? recipientPayload.error
            : null;
        if (!recipientRes.ok || !recipientPayload || recipientError) {
          setTransferError(recipientError ?? messages.recipientSaveError);
          return;
        }
        const savedRecipient = recipientPayload as Recipient;
        resolvedRecipientId = savedRecipient.id;
        setRecipients((prev) => [savedRecipient, ...prev]);
        setRecipientNotice(messages.recipientSaveSuccess);
      }

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

      if (resolvedRecipientId) {
        payload.recipientId = resolvedRecipientId;
      }

      if (recipientLightningInvoice.trim().length > 0) {
        payload.recipientLightningInvoice = recipientLightningInvoice.trim();
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
    mobileMoneyNumber,
    mobileMoneyProvider,
    isExpired,
    isTransferValid,
    lockedQuoteId,
    memo,
    messages.invalidQuoteError,
    messages.quoteExpiredError,
    messages.recipientAuthHelper,
    messages.recipientSaveError,
    messages.recipientSaveSuccess,
    messages.transferCreateError,
    messages.transferIncompleteMessage,
    payoutRail,
    quote,
    recipientLightningInvoice,
    saveRecipient,
    selectedRecipientId,
    session?.user,
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
        route.highlights?.map((code) => routeHighlightLabels[code as keyof typeof routeHighlightLabels]) ?? [];
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
      accent: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
      surface: "border-emerald-200/70 bg-emerald-50/50",
      route: cheapestRoute,
    },
    {
      key: "fastest",
      label: messages.fastestLabel,
      accent: "border-sky-200/70 bg-sky-50 text-sky-700",
      surface: "border-sky-200/70 bg-sky-50/50",
      route: fastestRoute,
    },
    {
      key: "best",
      label: messages.bestValueLabel,
      accent: "border-amber-200/70 bg-amber-50 text-amber-700",
      surface: "border-amber-200/70 bg-amber-50/50",
      route: bestValueRoute,
    },
  ];

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
    "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40";
  const cardClassName =
    "rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.35)] transition-shadow duration-200";
  const skeletonClass = "inline-block h-4 w-20 rounded-full bg-slate-200/70 animate-pulse";

  return (
    <div className="bg-[var(--brand-surface)] text-slate-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_#e8f6f1,_#f5f7fb_55%,_#ffffff)]">
        <div className="pointer-events-none absolute -top-24 right-8 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl motion-safe:animate-[float-slow_12s_ease-in-out_infinite]" />
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
                ClariSend
              </span>
              <h1 className="font-[var(--font-display)] text-4xl leading-tight text-slate-900 sm:text-5xl">
                {messages.heroTitle}
              </h1>
              <p className="max-w-xl text-lg text-slate-600">
                {messages.heroSubtitle}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
                <Link
                  href={`/${locale}#features`}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                >
                  {messages.featuresLinkLabel}
                </Link>
                <Link
                  href={`/${locale}#faq`}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
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
              <p className="mt-3 text-xs text-slate-500">
                {isPrimaryCorridor
                  ? messages.primaryCorridorNote
                  : messages.secondaryCorridorNote}
              </p>
            </div>
          </div>
          <div className="mt-10">
            <p className="text-xs font-medium text-slate-500">
              {messages.trustTitle}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
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
        <section id="quote" className="border-y border-slate-200/70 bg-white">
          <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
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
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                {messages.editSendDetailsLabel}
              </Link>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <div className="rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-[0_25px_60px_-40px_rgba(15,23,42,0.5)]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-300">
                      {messages.recipientGetsLabel}
                    </p>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                      {hasQuote
                        ? isExpired
                          ? messages.quoteExpired
                          : messages.quoteValidFor(secondsRemaining)
                        : messages.quoteFetching}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="font-[var(--font-display)] text-4xl leading-tight sm:text-5xl">
                      {hasQuote ? (
                        formatAmount(recipientGets, displayToAsset)
                      ) : (
                        <span className="inline-block h-10 w-48 rounded-2xl bg-white/10 animate-pulse" />
                      )}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {hasQuote
                        ? messages.basedOnAfterFees(
                            formatAmount(netConverted, displayFromAsset)
                          )
                        : messages.waitingForQuote}
                    </p>
                    {isLoading ? (
                      <p className="mt-2 text-xs font-medium text-slate-400">
                        {messages.refreshingQuote}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className={cardClassName}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">
                      {messages.smartSuggestionsLabel}
                    </p>
                    {recommendationLoading ? (
                      <span className="text-xs text-slate-400">
                        {messages.recommendationLoading}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-4">
                    {recommendationLoading && !recommendation
                      ? ["one", "two", "three"].map((key) => (
                          <div
                            key={key}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`${skeletonClass} w-20`} />
                              <span className={`${skeletonClass} w-12`} />
                            </div>
                            <div className="mt-4 space-y-3">
                              <span className={`${skeletonClass} w-32`} />
                              <span className={`${skeletonClass} w-40`} />
                              <span className={`${skeletonClass} w-24`} />
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <span className={`${skeletonClass} w-16`} />
                              <span className={`${skeletonClass} w-20`} />
                            </div>
                          </div>
                        ))
                      : suggestionCards.map((card) => (
                          <div
                            key={card.key}
                            className={`rounded-2xl border px-4 py-4 text-sm text-slate-700 transition-shadow duration-200 ${card.surface}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`rounded-full border px-2 py-1 text-[11px] font-medium ${card.accent}`}
                              >
                                {card.label}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {resolveRouteHighlights(card.route)}
                              </span>
                            </div>
                            {card.route ? (
                              <>
                                <p className="mt-3 text-base font-semibold text-slate-900">
                                  {resolveRailName(card.route.rail)}
                                </p>
                                <p className="mt-2 text-xs text-slate-600">
                                  <span className="font-semibold text-slate-500">
                                    {messages.recommendationWhyLabel}:
                                  </span>{" "}
                                  {card.route.explanation}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {messages.etaRangeLabel(
                                    card.route.etaMinMinutes,
                                    card.route.etaMaxMinutes
                                  )}
                                </p>
                                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                                  <span>{messages.totalFeeRow}</span>
                                  <span>
                                    {formatAmount(
                                      card.route.totalFee,
                                      suggestionFrom
                                    )}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
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
                                  onClick={() =>
                                    card.route && applyRouteSuggestion(card.route)
                                  }
                                  disabled={recommendationLoading}
                                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {messages.useRouteButton}
                                </button>
                              </>
                            ) : (
                              <p className="mt-3 text-xs text-slate-600">
                                {messages.recommendationEmpty}
                              </p>
                            )}
                          </div>
                        ))}
                  </div>
                  {recommendationError ? (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                      {recommendationError}
                    </div>
                  ) : null}
                </div>

                <div className={cardClassName}>
                  <p className="text-xs font-medium text-slate-500">
                    {messages.quoteBreakdownLabel}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>{messages.quoteIdLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {quoteLoading ? (
                          <span className={skeletonClass} />
                        ) : (
                          quote?.id ?? "—"
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.expiresAtLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {quoteLoading ? (
                          <span className={skeletonClass} />
                        ) : (
                          expiresAtLabel
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.railDisplayLabel}</span>
                      <span className="font-semibold text-slate-900">
                        {quoteLoading ? (
                          <span className={skeletonClass} />
                        ) : (
                          railMeta?.name ?? displayRail
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>{messages.sendAmountRow}</span>
                      <span className="font-semibold text-slate-900">
                        {hasQuote
                          ? formatAmount(numericSend, displayFromAsset)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.totalFeeRow}</span>
                      <span className="font-semibold text-slate-900">
                        {hasQuote
                          ? formatAmount(totalFee, displayFromAsset)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.fxMarginRow}</span>
                      <span className="font-semibold text-slate-900">
                        {hasQuote ? formatPercent(numericFxMargin, locale) : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.netConvertedRow}</span>
                      <span className="font-semibold text-slate-900">
                        {hasQuote
                          ? formatAmount(netConverted, displayFromAsset)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{messages.appliedRateRow}</span>
                      <span className="font-semibold text-slate-900">
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
                      <span>{messages.effectiveRateRow}</span>
                      <span className="font-semibold text-slate-900">
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
                    <p className="mt-3 text-xs text-rose-600">{quoteError}</p>
                  ) : null}
                  {lockError ? (
                    <p className="mt-3 text-xs text-amber-600">{lockError}</p>
                  ) : null}
                  {hasQuote && isExpired ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      {messages.quoteExpiredNotice}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLockQuote}
                    disabled={!hasQuote || isLoading || pendingLock}
                    className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:bg-slate-300"
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
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {messages.refreshQuoteButton}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-6">
                <div className={cardClassName}>
                  <p className="text-xs font-medium text-slate-500">
                    {messages.pricingControlsTitle}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {messages.pricingControlsSubtitle}
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
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
                    <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
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
                    <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
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
                    <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
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
                        <p className="text-xs font-medium text-slate-500">
                          {messages.transferDetailsLabel}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {messages.lockedQuoteLabel}: {lockedQuoteId} ·{" "}
                          {messages.railDisplayLabel}: {railMeta?.name ?? displayRail}
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                        {messages.draftLabel}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {session?.user ? (
                        <div className="sm:col-span-2 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                          <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
                            {messages.recipientSelectLabel}
                            <select
                              value={selectedRecipientId}
                              onChange={(event) =>
                                setSelectedRecipientId(event.target.value)
                              }
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                            >
                              <option value="">
                                {messages.recipientSelectPlaceholder}
                              </option>
                              {recipients.map((recipient) => (
                                <option key={recipient.id} value={recipient.id}>
                                  {recipient.name} ({recipient.country})
                                </option>
                              ))}
                            </select>
                            <span className="text-[11px] normal-case tracking-normal text-slate-500">
                              {messages.recipientSelectHelper}
                            </span>
                          </label>
                          {recipientsLoading ? (
                            <div className="mt-2 space-y-2">
                              <span className={`${skeletonClass} w-40`} />
                              <span className={`${skeletonClass} w-24`} />
                            </div>
                          ) : null}
                          {recipientsError ? (
                            <p className="mt-2 text-xs text-rose-600">
                              {recipientsError}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                          {messages.recipientAuthHelper}
                        </div>
                      )}
                      <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
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
                      <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
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
                      <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
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
                      <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
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
                      <p className="text-xs font-medium text-slate-500">
                        {messages.payoutRailLabel}
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        {payoutRailOptions.map((railOption) => (
                          <label
                            key={railOption.code}
                            className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
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
                    </div>
                    {payoutRail === "BANK" ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
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
                        <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
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
                        <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
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
                        <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
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
                    {payoutRail === "LIGHTNING" ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
                          {messages.recipientLightningInvoiceLabel}
                          <input
                            type="text"
                            value={recipientLightningInvoice}
                            onChange={(event) =>
                              setRecipientLightningInvoice(event.target.value)
                            }
                            className={inputClassName}
                            aria-label={messages.recipientLightningInvoiceLabel}
                          />
                        </label>
                      </div>
                    ) : null}
                    {session?.user ? (
                      <label className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                        <input
                          type="checkbox"
                          checked={saveRecipient}
                          onChange={(event) => setSaveRecipient(event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus-visible:ring-emerald-500/40"
                        />
                        {messages.recipientSaveToggleLabel}
                      </label>
                    ) : null}
                    {recipientNotice ? (
                      <p className="mt-2 text-xs text-emerald-600">
                        {recipientNotice}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      disabled={!isTransferValid || isTransferSubmitting}
                      onClick={handleCreateTransfer}
                      className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
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
                        <p className="font-medium text-slate-500">
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
                          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
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
                ) : (
                  <div className={cardClassName}>
                    <p className="text-xs font-medium text-slate-500">
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

      <section id="features" className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-emerald-700">
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
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-emerald-700">
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

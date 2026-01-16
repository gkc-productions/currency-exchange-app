"use client";

import { useMemo, useState } from "react";
import { Fraunces, Space_Grotesk } from "next/font/google";

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
const FIXED_FEE_USD = 2.5;
const PERCENT_FEE_PCT = 1.2;

const formatCurrency = (value: number, currency: "USD" | "GHS") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "GHS" ? 2 : 2,
  }).format(value);

const formatNumber = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export default function Home() {
  const [sendAmount, setSendAmount] = useState("250");
  const [marketRate, setMarketRate] = useState(String(MARKET_RATE));
  const [fxMargin, setFxMargin] = useState(String(FX_MARGIN_PCT));
  const [fixedFee, setFixedFee] = useState(String(FIXED_FEE_USD));
  const [percentFee, setPercentFee] = useState(String(PERCENT_FEE_PCT));

  const {
    numericSend,
    percentFeeAmount,
    totalFee,
    appliedRate,
    recipientGets,
    netConverted,
    effectiveRate,
    numericMarketRate,
    numericFxMargin,
    numericFixedFee,
    numericPercentFee,
  } = useMemo(() => {
    const parsedSend = Number.parseFloat(sendAmount);
    const parsedMarket = Number.parseFloat(marketRate);
    const parsedMargin = Number.parseFloat(fxMargin);
    const parsedFixed = Number.parseFloat(fixedFee);
    const parsedPercent = Number.parseFloat(percentFee);
    const safeSend = Number.isFinite(parsedSend) ? parsedSend : 0;
    const safeMarket = Number.isFinite(parsedMarket) ? parsedMarket : 0;
    const safeMargin = Number.isFinite(parsedMargin) ? parsedMargin : 0;
    const safeFixed = Number.isFinite(parsedFixed) ? parsedFixed : 0;
    const safePercent = Number.isFinite(parsedPercent) ? parsedPercent : 0;
    const percentFeeValue = (safeSend * safePercent) / 100;
    const feeTotal = safeFixed + percentFeeValue;
    const rate = safeMarket * (1 - safeMargin / 100);
    const netSend = Math.max(safeSend - feeTotal, 0);
    return {
      numericSend: safeSend,
      percentFeeAmount: percentFeeValue,
      totalFee: feeTotal,
      appliedRate: rate,
      recipientGets: netSend * rate,
      netConverted: netSend,
      effectiveRate: safeSend > 0 ? (netSend * rate) / safeSend : 0,
      numericMarketRate: safeMarket,
      numericFxMargin: safeMargin,
      numericFixedFee: safeFixed,
      numericPercentFee: safePercent,
    };
  }, [sendAmount, marketRate, fxMargin, fixedFee, percentFee]);

  return (
    <div
      className={`${grotesk.variable} ${fraunces.variable} min-h-screen bg-[radial-gradient(circle_at_top,_#f8d6b8,_#fdf7f0_40%,_#eef4ff)] text-slate-900`}
    >
      <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16 sm:px-10">
        <section className="grid w-full gap-8 rounded-3xl border border-slate-200/60 bg-white/80 p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur md:grid-cols-[1.2fr_0.8fr] md:gap-10 md:p-12">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                USD to GHS Quote
              </p>
              <h1 className="font-[var(--font-fraunces)] text-3xl leading-tight text-slate-900 sm:text-4xl">
                Send with clarity. See every fee and the exact recipient total.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                A clean, transparent USD to GHS quote for cross-border remittance.
                Adjust the market rate and fee model to preview totals instantly.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-6 shadow-sm">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Send amount (USD)
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-900">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    USD
                  </span>
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={sendAmount}
                    onChange={(event) => setSendAmount(event.target.value)}
                    className="w-full bg-transparent text-2xl outline-none"
                    aria-label="Send amount in USD"
                  />
                </div>
              </label>
              <p className="mt-3 text-xs text-slate-500">
                Enter a value to preview fees and recipient payout.
              </p>
            </div>

            <div className="grid gap-4 rounded-2xl border border-slate-200/70 bg-white px-5 py-6 text-sm text-slate-700 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Market rate (GHS)
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.0001"
                    value={marketRate}
                    onChange={(event) => setMarketRate(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                    aria-label="Market rate in GHS"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  FX margin (%)
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={fxMargin}
                    onChange={(event) => setFxMargin(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                    aria-label="FX margin percentage"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Fixed fee (USD)
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={fixedFee}
                    onChange={(event) => setFixedFee(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                    aria-label="Fixed fee in USD"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Percent fee (%)
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={percentFee}
                    onChange={(event) => setPercentFee(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none"
                    aria-label="Percent fee"
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <span>
                  1 USD = {formatNumber(numericMarketRate, 4)} GHS market
                </span>
                <span>
                  Applied rate: 1 USD = {formatNumber(appliedRate, 4)} GHS
                </span>
              </div>
            </div>
          </div>

          <aside className="flex h-full flex-col justify-between gap-6 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Recipient Gets
                </p>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-200">
                  Quote valid for 30s (demo)
                </span>
              </div>
              <div>
                <p className="font-[var(--font-fraunces)] text-4xl leading-tight sm:text-5xl">
                  {formatCurrency(recipientGets, "GHS")}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Based on {formatCurrency(netConverted, "USD")} after fees.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs leading-5 text-slate-300">
              <p className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                Quote Breakdown
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span>Send amount</span>
                <span>{formatCurrency(numericSend, "USD")}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Total fee</span>
                <span>{formatCurrency(totalFee, "USD")}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Net converted</span>
                <span>{formatCurrency(netConverted, "USD")}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Applied rate</span>
                <span>
                  1 USD = {formatNumber(appliedRate, 4)} GHS
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Effective rate</span>
                <span>
                  1 USD = {formatNumber(effectiveRate, 4)} GHS
                </span>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[11px] text-slate-200">
                Fees: {formatCurrency(numericFixedFee, "USD")} fixed +{" "}
                {formatNumber(numericPercentFee, 2)}% ({formatCurrency(
                  percentFeeAmount,
                  "USD"
                )}
                )
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

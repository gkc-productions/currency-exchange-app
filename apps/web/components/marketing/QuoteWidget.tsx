"use client";

import Link from "next/link";

export type QuotePreview = {
  totalFee: number;
  recipientGets: number;
};

export function calculateQuotePreview(sendAmount: number, rate: number) {
  const safeAmount = Number.isFinite(sendAmount) ? Math.max(sendAmount, 0) : 0;
  const safeRate = Number.isFinite(rate) ? Math.max(rate, 0) : 0;
  const totalFee = safeAmount * 0.012 + 2.5;
  const netSend = Math.max(safeAmount - totalFee, 0);
  return {
    totalFee,
    recipientGets: netSend * safeRate,
  } satisfies QuotePreview;
}

type Currency = {
  code: string;
  name: string;
};

type QuoteWidgetProps = {
  locale: "en" | "fr";
  sendAmount: string;
  fromCurrency: string;
  toCurrency: string;
  rateLabel: string;
  feeLabel: string;
  recipientGetsLabel: string;
  ctaLabel: string;
  currencies: Currency[];
  recipientGetsValue: string;
  onSendAmountChange: (value: string) => void;
  onFromCurrencyChange: (value: string) => void;
  onToCurrencyChange: (value: string) => void;
};

export default function QuoteWidget({
  locale,
  sendAmount,
  fromCurrency,
  toCurrency,
  rateLabel,
  feeLabel,
  recipientGetsLabel,
  ctaLabel,
  currencies,
  recipientGetsValue,
  onSendAmountChange,
  onFromCurrencyChange,
  onToCurrencyChange,
}: QuoteWidgetProps) {
  return (
    <div
      id="send"
      className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
        Live estimate
      </p>
      <div className="mt-4 grid gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium text-slate-500">Send amount</span>
          <input
            inputMode="decimal"
            type="number"
            min="0"
            value={sendAmount}
            onChange={(event) => onSendAmountChange(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">From</span>
            <select
              value={fromCurrency}
              onChange={(event) => onFromCurrencyChange(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              {currencies.map((currency) => (
                <option key={`from-${currency.code}`} value={currency.code}>
                  {currency.code} · {currency.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">To</span>
            <select
              value={toCurrency}
              onChange={(event) => onToCurrencyChange(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              {currencies.map((currency) => (
                <option key={`to-${currency.code}`} value={currency.code}>
                  {currency.code} · {currency.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">{recipientGetsLabel}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {recipientGetsValue}
          </p>
        </div>
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span>Fee</span>
            <span className="font-semibold text-slate-900">{feeLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Rate</span>
            <span className="font-semibold text-slate-900">{rateLabel}</span>
          </div>
        </div>
        <Link
          href={`/${locale}/signup`}
          className="mt-1 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}

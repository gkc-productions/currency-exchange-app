"use client";

import CountrySelect from "./CountrySelect";
import type { CountryOption } from "./country-options";

export type SendCardProps = {
  title: string;
  subtitle: string;
  fromLabel: string;
  toLabel: string;
  railLabel: string;
  amountLabel: string;
  amountHint: string;
  submitLabel: string;
  assetsLoadingLabel: string;
  fromAsset: string;
  toAsset: string;
  rail: string;
  sendAmount: string;
  sendStep: string;
  railOptions: { code: string; name: string }[];
  countryOptions: CountryOption[];
  assetsLoading: boolean;
  assetsError: string | null;
  onChangeFrom: (assetCode: string) => void;
  onChangeTo: (assetCode: string) => void;
  onChangeRail: (rail: string) => void;
  onChangeAmount: (amount: string) => void;
  onSubmit: () => void;
  countrySelectCopy: {
    changeLabel: string;
    dialogTitle: string;
    dialogSubtitle: string;
    closeLabel: string;
    searchPlaceholder: string;
    searchLabel: string;
    noResultsLabel: string;
    selectFallback: string;
  };
};

export default function SendCard({
  title,
  subtitle,
  fromLabel,
  toLabel,
  railLabel,
  amountLabel,
  amountHint,
  submitLabel,
  assetsLoadingLabel,
  fromAsset,
  toAsset,
  rail,
  sendAmount,
  sendStep,
  railOptions,
  countryOptions,
  assetsLoading,
  assetsError,
  onChangeFrom,
  onChangeTo,
  onChangeRail,
  onChangeAmount,
  onSubmit,
  countrySelectCopy,
}: SendCardProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.3)]"
    >
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-emerald-700">
          {title}
        </p>
        <p className="text-lg font-semibold text-slate-900">{subtitle}</p>
      </div>
      <div className="mt-6 grid gap-4">
        <CountrySelect
          label={fromLabel}
          value={fromAsset}
          options={countryOptions}
          onChange={onChangeFrom}
          copy={countrySelectCopy}
        />
        <CountrySelect
          label={toLabel}
          value={toAsset}
          options={countryOptions}
          onChange={onChangeTo}
          copy={countrySelectCopy}
        />
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium text-slate-500">
            {railLabel}
          </span>
          <select
            value={rail}
            onChange={(event) => onChangeRail(event.target.value)}
            className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            aria-label={railLabel}
          >
            {railOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium text-slate-500">
            {amountLabel}
          </span>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <span className="text-xs font-semibold text-slate-400">
              {fromAsset}
            </span>
            <input
              inputMode="decimal"
              type="number"
              min="0"
              step={sendStep}
              value={sendAmount}
              onChange={(event) => onChangeAmount(event.target.value)}
              className="w-full bg-transparent text-lg font-semibold text-slate-900 outline-none"
              aria-label={amountLabel}
            />
          </div>
          <p className="text-xs text-slate-500">{amountHint}</p>
        </label>
        {assetsLoading ? (
          <p className="text-xs text-slate-500">{assetsLoadingLabel}</p>
        ) : null}
        {assetsError ? (
          <p className="text-xs text-rose-600">{assetsError}</p>
        ) : null}
        <button
          type="submit"
          className="mt-2 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

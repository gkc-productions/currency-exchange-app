"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CountryOption } from "./country-options";

const buttonBase =
  "flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40";

export type CountrySelectProps = {
  label: string;
  value: string;
  options: CountryOption[];
  onChange: (assetCode: string) => void;
  hint?: string;
  copy: {
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

export default function CountrySelect({
  label,
  value,
  options,
  onChange,
  hint,
  copy,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(() => {
    return (
      options.find((option) => option.assetCode === value) ?? {
        id: value,
        countryCode: "",
        countryName: "",
        assetCode: value,
        assetName: value,
      }
    );
  }, [options, value]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return options;
    }
    return options.filter((option) => {
      const haystack = `${option.countryName} ${option.assetCode} ${option.assetName} ${option.countryCode}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleSelect = (assetCode: string) => {
    onChange(assetCode);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        <span>{label}</span>
      </div>
      <button
        type="button"
        className={buttonBase}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">
            {selected.countryName || copy.selectFallback}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {selected.assetCode}
            {selected.assetName && selected.assetName !== selected.assetCode
              ? ` · ${selected.assetName}`
              : ""}
          </span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {copy.changeLabel}
        </span>
      </button>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.5)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {copy.dialogTitle}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {copy.dialogSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300"
              >
                {copy.closeLabel}
              </button>
            </div>
            <div className="mt-4">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                aria-label={copy.searchLabel}
              />
            </div>
            <div className="mt-4 max-h-72 overflow-y-auto pr-1">
              <div className="grid gap-2">
                {filtered.map((option) => {
                  const isSelected = option.assetCode === value;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option.assetCode)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                        isSelected
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {option.countryName}
                        </span>
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {option.assetCode} · {option.assetName}
                        </span>
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {option.countryCode}
                      </span>
                    </button>
                  );
                })}
                {filtered.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    {copy.noResultsLabel}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

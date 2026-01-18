"use client";

import { useMemo, useState } from "react";
import { getMessages, type Locale } from "@/src/lib/i18n/messages";

export type RecipientSummary = {
  id: string;
  name: string;
  country: string;
  rail: "BANK" | "MOBILE_MONEY" | "LIGHTNING";
  bankName: string | null;
  bankAccount: string | null;
  mobileMoneyProvider: string | null;
  mobileMoneyNumber: string | null;
  lightningInvoice: string | null;
  createdAt: string;
};

export default function RecipientsManager({
  locale,
  initialRecipients,
}: {
  locale: Locale;
  initialRecipients: RecipientSummary[];
}) {
  const messages = getMessages(locale);
  const railOptions = [
    { value: "BANK", label: messages.payoutRailBankLabel },
    { value: "MOBILE_MONEY", label: messages.payoutRailMobileMoneyLabel },
    { value: "LIGHTNING", label: messages.payoutRailLightningLabel },
  ] as const;
  const [recipients, setRecipients] = useState(initialRecipients);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [rail, setRail] = useState<"BANK" | "MOBILE_MONEY" | "LIGHTNING">(
    "BANK"
  );
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState("");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [lightningInvoice, setLightningInvoice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const isValid = useMemo(() => {
    if (!name.trim() || !country.trim()) {
      return false;
    }
    if (rail === "BANK") {
      return bankName.trim().length > 0 && bankAccount.trim().length > 0;
    }
    if (rail === "MOBILE_MONEY") {
      return (
        mobileMoneyProvider.trim().length > 0 &&
        mobileMoneyNumber.trim().length > 0
      );
    }
    return true;
  }, [bankAccount, bankName, country, mobileMoneyNumber, mobileMoneyProvider, name, rail]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          country: country.trim().toUpperCase(),
          rail,
          bankName: bankName.trim() || undefined,
          bankAccount: bankAccount.trim() || undefined,
          mobileMoneyProvider: mobileMoneyProvider.trim() || undefined,
          mobileMoneyNumber: mobileMoneyNumber.trim() || undefined,
          lightningInvoice: lightningInvoice.trim() || undefined,
        }),
      });
      const payload = (await res.json().catch(() => null)) as
        | RecipientSummary
        | { error?: string }
        | null;
      const payloadError =
        payload && "error" in payload ? payload.error : null;
      if (!res.ok || !payload || payloadError) {
        setSaveError(payloadError ?? messages.recipientSaveError);
        return;
      }
      setRecipients((prev) => [payload as RecipientSummary, ...prev]);
      setName("");
      setCountry("");
      setBankName("");
      setBankAccount("");
      setMobileMoneyProvider("");
      setMobileMoneyNumber("");
      setLightningInvoice("");
      setSaveMessage(messages.recipientSaveSuccess);
    } catch {
      setSaveError(messages.recipientSaveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/recipients/${id}`, { method: "DELETE" });
      if (!res.ok) {
        return;
      }
      setRecipients((prev) => prev.filter((recipient) => recipient.id !== id));
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        {recipients.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="text-base font-semibold text-slate-900">
              {messages.recipientsEmptyTitle}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {messages.recipientsEmptyDescription}
            </p>
          </div>
        ) : (
          recipients.map((recipient) => (
            <div
              key={recipient.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {recipient.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {recipient.country} · {recipient.rail.replace("_", " ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(recipient.id)}
                  disabled={deleteLoading === recipient.id}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 disabled:cursor-not-allowed"
                >
                  {deleteLoading === recipient.id ? "..." : messages.recipientRemoveButton}
                </button>
              </div>
              <div className="mt-4 text-sm text-slate-600">
                {recipient.rail === "BANK" && recipient.bankName ? (
                  <p>{recipient.bankName} · {recipient.bankAccount}</p>
                ) : null}
                {recipient.rail === "MOBILE_MONEY" && recipient.mobileMoneyProvider ? (
                  <p>{recipient.mobileMoneyProvider} · {recipient.mobileMoneyNumber}</p>
                ) : null}
                {recipient.rail === "LIGHTNING" ? (
                  <p>{recipient.lightningInvoice ?? "Lightning invoice on file"}</p>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)]">
        <p className="text-xs font-medium text-slate-500">
          {messages.recipientsCreateTitle}
        </p>
        <div className="mt-4 grid gap-4">
          <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
            {messages.recipientNameLabel}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
            {messages.recipientCountryLabel}
            <input
              value={country}
              onChange={(event) => setCountry(event.target.value.toUpperCase())}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
            {messages.payoutRailLabel}
            <select
              value={rail}
              onChange={(event) => setRail(event.target.value as "BANK" | "MOBILE_MONEY" | "LIGHTNING")}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900"
            >
              {railOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {rail === "BANK" ? (
            <>
              <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
                {messages.bankNameLabel}
                <input
                  value={bankName}
                  onChange={(event) => setBankName(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
                {messages.bankAccountLabel}
                <input
                  value={bankAccount}
                  onChange={(event) => setBankAccount(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900"
                />
              </label>
            </>
          ) : null}
          {rail === "MOBILE_MONEY" ? (
            <>
              <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
                {messages.mobileMoneyProviderLabel}
                <input
                  value={mobileMoneyProvider}
                  onChange={(event) => setMobileMoneyProvider(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
                {messages.mobileMoneyNumberLabel}
                <input
                  value={mobileMoneyNumber}
                  onChange={(event) => setMobileMoneyNumber(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900"
                />
              </label>
            </>
          ) : null}
          {rail === "LIGHTNING" ? (
            <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
              {messages.recipientLightningInvoiceLabel}
              <input
                value={lightningInvoice}
                onChange={(event) => setLightningInvoice(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900"
              />
            </label>
          ) : null}

          {saveMessage ? (
            <p className="text-xs text-emerald-600">{saveMessage}</p>
          ) : null}
          {saveError ? (
            <p className="text-xs text-rose-600">{saveError}</p>
          ) : null}

          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "..." : messages.recipientsSaveButton}
          </button>
        </div>
      </div>
    </div>
  );
}

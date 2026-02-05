import type { Locale, Messages } from "@/src/lib/i18n/messages";
import { formatMoney, formatPercent } from "@/src/lib/format";
import { computeAccountingCheck, type AccountingSnapshot } from "@/src/lib/accounting";

type Props = {
  snapshot: AccountingSnapshot | null;
  locale: Locale;
  messages: Messages;
};

const formatNumber = (value: number, digits = 6, locale: Locale = "en") =>
  new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export default function AccountingPanel({ snapshot, locale, messages }: Props) {
  if (!snapshot) {
    return (
      <p className="text-sm text-slate-400">{messages.receiptSnapshotUnavailableLabel}</p>
    );
  }

  const check = computeAccountingCheck(snapshot);

  return (
    <div className="space-y-3 text-sm text-slate-200">
      <div className="flex items-center justify-between">
        <span>{messages.accountingSendAmountLabel}</span>
        <span className="font-semibold text-white">
          {formatMoney(snapshot.sendAmount, snapshot.fromAsset, locale)}
        </span>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <span>{messages.accountingFixedFeeLabel}</span>
          <span className="font-semibold text-white">
            {formatMoney(snapshot.fixedFee, snapshot.fromAsset, locale)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span>{messages.accountingPercentFeeLabel}</span>
          <span className="font-semibold text-white">
            {formatPercent(snapshot.percentFee, locale)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span>{messages.accountingTotalFeesLabel}</span>
          <span className="font-semibold text-white">
            {formatMoney(snapshot.totalFees, snapshot.fromAsset, locale)}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span>{messages.accountingRecipientGetsLabel}</span>
        <span className="font-semibold text-white">
          {formatMoney(snapshot.recipientGets, snapshot.toAsset, locale)}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{messages.accountingAppliedRateLabel}</span>
        <span className="font-semibold text-slate-200">
          {formatNumber(snapshot.appliedRate, 6, locale)}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{messages.accountingMarketRateLabel}</span>
        <span className="font-semibold text-slate-200">
          {formatNumber(snapshot.marketRate, 6, locale)}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{messages.accountingMarginLabel}</span>
        <span className="font-semibold text-slate-200">
          {formatPercent(snapshot.fxMarginPct, locale)}
        </span>
      </div>
      {check.feeMismatch ? (
        <p className="text-xs text-amber-200">
          {messages.accountingFeeMismatchWarning}
        </p>
      ) : null}
      {check.payoutMismatch ? (
        <p className="text-xs text-amber-200">
          {messages.accountingPayoutMismatchWarning}
        </p>
      ) : null}
    </div>
  );
}

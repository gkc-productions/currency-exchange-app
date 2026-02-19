export type TransferHistoryRow = {
  id: string;
  referenceCode: string;
  status: string;
  payoutRail: string;
  recipientName: string;
  recipientCountry?: string | null;
  providerPayoutProvider?: string | null;
  providerPayoutStatus?: string | null;
  sendAmount?: number | null;
  recipientGets?: number | null;
  fromAsset?: string | null;
  toAsset?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type TransferStatusFilter =
  | "ALL"
  | "READY"
  | "PROCESSING"
  | "FAILED"
  | "COMPLETED"
  | "DRAFT";

export type TransferSort =
  | "NEWEST"
  | "OLDEST"
  | "AMOUNT_HIGH"
  | "AMOUNT_LOW";

export function matchesTransferSearch(transfer: TransferHistoryRow, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }
  return (
    transfer.referenceCode.toLowerCase().includes(normalizedQuery) ||
    transfer.id.toLowerCase().includes(normalizedQuery) ||
    transfer.recipientName.toLowerCase().includes(normalizedQuery) ||
    (transfer.recipientCountry ?? "").toLowerCase().includes(normalizedQuery)
  );
}

export function sortTransfers(transfers: TransferHistoryRow[], sort: TransferSort) {
  return [...transfers].sort((a, b) => {
    if (sort === "AMOUNT_HIGH" || sort === "AMOUNT_LOW") {
      const aAmount = a.sendAmount ?? 0;
      const bAmount = b.sendAmount ?? 0;
      return sort === "AMOUNT_HIGH" ? bAmount - aAmount : aAmount - bAmount;
    }
    const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
    const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
    return sort === "OLDEST" ? aTime - bTime : bTime - aTime;
  });
}

export function filterAndSortTransfers(
  transfers: TransferHistoryRow[],
  status: TransferStatusFilter,
  query: string,
  sort: TransferSort
) {
  const filtered = transfers.filter((transfer) => {
    if (status !== "ALL" && transfer.status !== status) {
      return false;
    }
    return matchesTransferSearch(transfer, query);
  });
  return sortTransfers(filtered, sort);
}

export function filterTransfers(
  transfers: TransferHistoryRow[],
  status: TransferStatusFilter,
  query: string
) {
  return filterAndSortTransfers(transfers, status, query, "NEWEST");
}

export function resolveProviderLabel(provider?: string | null) {
  return provider && provider.trim().length > 0 ? provider : "—";
}

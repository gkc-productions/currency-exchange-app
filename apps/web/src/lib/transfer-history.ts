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

export function filterTransfers(
  transfers: TransferHistoryRow[],
  status: TransferStatusFilter,
  query: string
) {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = transfers.filter((transfer) => {
    if (status !== "ALL" && transfer.status !== status) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    const reference = transfer.referenceCode.toLowerCase();
    const recipient = transfer.recipientName.toLowerCase();
    return reference.includes(normalizedQuery) || recipient.includes(normalizedQuery);
  });

  return filtered.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

export function resolveProviderLabel(provider?: string | null) {
  return provider && provider.trim().length > 0 ? provider : "—";
}

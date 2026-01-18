import { CryptoPayoutStatus, TransferStatus } from "@prisma/client";

const transferTransitions: Record<TransferStatus, Set<TransferStatus>> = {
  DRAFT: new Set([TransferStatus.READY, TransferStatus.CANCELED, TransferStatus.EXPIRED]),
  READY: new Set([TransferStatus.PROCESSING, TransferStatus.CANCELED, TransferStatus.EXPIRED]),
  PROCESSING: new Set([TransferStatus.COMPLETED, TransferStatus.FAILED]),
  COMPLETED: new Set(),
  FAILED: new Set(),
  CANCELED: new Set(),
  EXPIRED: new Set(),
};

const payoutTransitions: Record<CryptoPayoutStatus, Set<CryptoPayoutStatus>> = {
  CREATED: new Set([CryptoPayoutStatus.REQUESTED, CryptoPayoutStatus.EXPIRED, CryptoPayoutStatus.FAILED]),
  REQUESTED: new Set([CryptoPayoutStatus.PAID, CryptoPayoutStatus.EXPIRED, CryptoPayoutStatus.FAILED]),
  PAID: new Set(),
  EXPIRED: new Set(),
  FAILED: new Set(),
};

export function canTransitionTransfer(
  current: TransferStatus,
  next: TransferStatus
) {
  return transferTransitions[current]?.has(next) ?? false;
}

export function canTransitionPayout(
  current: CryptoPayoutStatus,
  next: CryptoPayoutStatus
) {
  return payoutTransitions[current]?.has(next) ?? false;
}

export const transferTerminalStates = new Set<TransferStatus>([
  TransferStatus.COMPLETED,
  TransferStatus.FAILED,
  TransferStatus.CANCELED,
  TransferStatus.EXPIRED,
]);

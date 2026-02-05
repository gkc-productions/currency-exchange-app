export type AccountingSnapshot = {
  sendAmount: number;
  fixedFee: number;
  percentFee: number;
  totalFees: number;
  recipientGets: number;
  marketRate: number;
  appliedRate: number;
  fxMarginPct: number;
  fromAsset: string;
  toAsset: string;
};

export type AccountingCheck = {
  expectedFees: number;
  expectedRecipientGets: number;
  feeMismatch: boolean;
  payoutMismatch: boolean;
};

export function computeAccountingCheck(
  snapshot: AccountingSnapshot,
  tolerance = 0.01
): AccountingCheck {
  const expectedFees = snapshot.fixedFee + (snapshot.sendAmount * snapshot.percentFee) / 100;
  const expectedRecipientGets = (snapshot.sendAmount - snapshot.totalFees) * snapshot.appliedRate;
  const feeMismatch = Math.abs(snapshot.totalFees - expectedFees) > tolerance;
  const payoutMismatch = Math.abs(snapshot.recipientGets - expectedRecipientGets) > tolerance;
  return { expectedFees, expectedRecipientGets, feeMismatch, payoutMismatch };
}

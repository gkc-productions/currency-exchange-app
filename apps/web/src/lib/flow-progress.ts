export const FLOW_STEPS = ["Quote", "Recipient", "Review", "Status"] as const;

export function flowTrustMessage(stepIndex: number, expiresAt?: string | null): string {
  if (stepIndex <= 0) {
    return "See full cost before you send";
  }
  if (stepIndex === 1) {
    return "You can edit details before confirming";
  }
  if (stepIndex === 2) {
    if (expiresAt) {
      return `Rate locked until ${expiresAt}`;
    }
    return "Rate locked until you complete review";
  }
  return "Status updates are audit logged";
}

import type { PayoutExecutor } from "@/src/lib/payout/types";
import { mockExecutor } from "@/src/lib/payout/executors/mock";
import { realExecutor } from "@/src/lib/payout/executors/real";

export function getPayoutExecutor(): PayoutExecutor {
  const configured = (process.env.PAYOUT_EXECUTOR ?? "mock").toLowerCase();
  if (configured === "real") {
    return realExecutor;
  }
  return mockExecutor;
}

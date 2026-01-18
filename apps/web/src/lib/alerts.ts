import { logWarn } from "@/src/lib/logging";

type AlertPayload = {
  transferId?: string;
  referenceCode?: string;
  context?: Record<string, unknown>;
};

export function alertTransferFailure(payload: AlertPayload) {
  logWarn("transfer_failure_alert", {
    transferId: payload.transferId,
    meta: payload.context,
  });
}

export function alertPayoutFailure(payload: AlertPayload) {
  logWarn("payout_failure_alert", {
    transferId: payload.transferId,
    meta: payload.context,
  });
}

export function alertEmailFailure(payload: AlertPayload) {
  logWarn("email_failure_alert", {
    transferId: payload.transferId,
    meta: payload.context,
  });
}

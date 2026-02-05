export type ExecutePayoutState = "idle" | "loading" | "success" | "error";

type ExecutePayoutUi = {
  showButton: boolean;
  disabled: boolean;
  message: "processing" | "failed" | null;
};

export function resolvePayoutAction(status: string) {
  if (status === "READY") {
    return "execute";
  }
  if (status === "FAILED") {
    return "retry";
  }
  return "none";
}

export function resolveExecutePayoutUi(
  status: string,
  actionState: ExecutePayoutState
): ExecutePayoutUi {
  if (status !== "READY") {
    if (status === "PROCESSING") {
      return { showButton: false, disabled: true, message: "processing" };
    }
    if (status === "FAILED") {
      return { showButton: false, disabled: true, message: "failed" };
    }
    return { showButton: false, disabled: true, message: null };
  }
  if (actionState === "success") {
    return { showButton: false, disabled: true, message: null };
  }
  return { showButton: true, disabled: actionState === "loading", message: null };
}

export function shouldShowPayoutInfo(params: {
  status: string;
  providerPayoutId?: string | null;
  providerPayoutStatus?: string | null;
  providerPayoutProvider?: string | null;
  providerPayoutUpdatedAt?: string | Date | null;
}) {
  return ["PROCESSING", "FAILED", "COMPLETED"].includes(params.status);
}

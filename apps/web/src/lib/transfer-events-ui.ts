export type ExecutePayoutState = "idle" | "loading" | "success" | "error";

type ExecutePayoutUi = {
  showButton: boolean;
  disabled: boolean;
};

export function resolveExecutePayoutUi(
  status: string,
  actionState: ExecutePayoutState
): ExecutePayoutUi {
  if (status !== "READY") {
    return { showButton: false, disabled: true };
  }
  if (actionState === "success") {
    return { showButton: false, disabled: true };
  }
  return { showButton: true, disabled: actionState === "loading" };
}

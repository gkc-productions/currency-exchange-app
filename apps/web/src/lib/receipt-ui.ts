export type ReceiptUiState = {
  showGetButton: boolean;
  showViewLink: boolean;
  showPendingText: boolean;
  disableGetButton: boolean;
};

export function resolveReceiptUiState(
  status: string,
  receiptUrl: string | null,
  actionState: "idle" | "loading" | "success" | "error"
): ReceiptUiState {
  if (status !== "COMPLETED") {
    return {
      showGetButton: false,
      showViewLink: false,
      showPendingText: true,
      disableGetButton: true,
    };
  }

  if (receiptUrl) {
    return {
      showGetButton: false,
      showViewLink: true,
      showPendingText: false,
      disableGetButton: true,
    };
  }

  return {
    showGetButton: true,
    showViewLink: false,
    showPendingText: false,
    disableGetButton: actionState === "loading" || actionState === "success",
  };
}

export type UserTransferStatus = "PENDING_PAYMENT" | "PROCESSING" | "COMPLETED" | "FAILED";

export type UserSubstatus =
  | "Waiting for payment"
  | "Payment started"
  | "Queued"
  | "Sending"
  | "Confirming delivery"
  | "Delivered"
  | "Action required";

export type UserStatusModel = {
  key: UserTransferStatus;
  label: "Pending payment" | "Processing" | "Completed" | "Failed";
  substatus: UserSubstatus;
  nextStep: string;
  actionLabel: "Finish payment" | "Track transfer" | "View receipt" | "Fix issue";
};

export function toUserTransferStatus(status: string): UserTransferStatus {
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "PROCESSING") return "PROCESSING";
  if (status === "FAILED" || status === "CANCELED" || status === "EXPIRED") return "FAILED";
  return "PENDING_PAYMENT";
}

export function resolveSubstatus(status: string, providerStatus?: string | null): UserSubstatus {
  const userStatus = toUserTransferStatus(status);
  const normalizedProvider = providerStatus?.toUpperCase() ?? "";
  if (userStatus === "PENDING_PAYMENT") {
    if (normalizedProvider === "INITIATED" || normalizedProvider === "PENDING") {
      return "Payment started";
    }
    return "Waiting for payment";
  }
  if (userStatus === "PROCESSING") {
    if (normalizedProvider.includes("QUEUE")) return "Queued";
    if (normalizedProvider.includes("SEND")) return "Sending";
    return "Confirming delivery";
  }
  if (userStatus === "COMPLETED") {
    return "Delivered";
  }
  return "Action required";
}

export function resolveUserStatusModel(
  status: string,
  providerStatus?: string | null
): UserStatusModel {
  const key = toUserTransferStatus(status);
  const substatus = resolveSubstatus(status, providerStatus);
  if (key === "COMPLETED") {
    return {
      key,
      label: "Completed",
      substatus,
      nextStep: "Your transfer is complete. You can download or share the receipt now.",
      actionLabel: "View receipt",
    };
  }
  if (key === "PROCESSING") {
    return {
      key,
      label: "Processing",
      substatus,
      nextStep: "Your payment is being delivered. Tracking updates will appear here automatically.",
      actionLabel: "Track transfer",
    };
  }
  if (key === "FAILED") {
    return {
      key,
      label: "Failed",
      substatus,
      nextStep: "This transfer needs your attention. Review details and fix the issue to continue.",
      actionLabel: "Fix issue",
    };
  }
  return {
    key,
    label: "Pending payment",
    substatus,
    nextStep: "Complete payment to start processing this transfer.",
    actionLabel: "Finish payment",
  };
}

function findEventTime(
  events: Array<{ type: string; createdAt: string }>,
  types: string[]
) {
  for (const type of types) {
    const event = events.find((item) => item.type === type);
    if (event?.createdAt) return event.createdAt;
  }
  return null;
}

export function buildUserStatusTimeline(
  status: string,
  events: Array<{ type: string; createdAt: string }>
) {
  const normalized = toUserTransferStatus(status);
  const pendingAt = findEventTime(events, ["CREATED", "QUOTE_LOCKED"]);
  const processingAt = findEventTime(events, ["PROCESSING", "PAYOUT_EXECUTED"]);
  const completedAt = findEventTime(events, ["COMPLETED"]);
  const failedAt = findEventTime(events, ["FAILED", "CANCELED", "EXPIRED"]);

  const activeByState: Record<UserTransferStatus, number> = {
    PENDING_PAYMENT: 0,
    PROCESSING: 1,
    COMPLETED: 2,
    FAILED: 3,
  };

  return [
    {
      key: "PENDING_PAYMENT" as const,
      label: "Pending payment",
      timestamp: pendingAt,
      description: "Waiting for payment confirmation before transfer processing starts.",
      isActive: activeByState[normalized] === 0,
      isComplete: activeByState[normalized] > 0,
    },
    {
      key: "PROCESSING" as const,
      label: "Processing",
      timestamp: processingAt,
      description: "Transfer is queued, sent, and then confirmed with the destination provider.",
      isActive: activeByState[normalized] === 1,
      isComplete: activeByState[normalized] > 1,
    },
    {
      key: "COMPLETED" as const,
      label: "Completed",
      timestamp: completedAt,
      description: "Transfer delivered successfully. Receipt is now available.",
      isActive: activeByState[normalized] === 2,
      isComplete: activeByState[normalized] > 2 || normalized === "COMPLETED",
    },
    {
      key: "FAILED" as const,
      label: "Failed",
      timestamp: failedAt,
      description: "Transfer failed. Review issue details and retry when ready.",
      isActive: activeByState[normalized] === 3,
      isComplete: normalized === "FAILED",
    },
  ];
}

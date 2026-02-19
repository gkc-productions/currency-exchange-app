export type UserTransferStatus = "PENDING_PAYMENT" | "PROCESSING" | "COMPLETED" | "FAILED";

export type UserStatusModel = {
  key: UserTransferStatus;
  label: "Pending payment" | "Processing" | "Completed" | "Failed";
  description: string;
};

export function toUserTransferStatus(status: string): UserTransferStatus {
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "PROCESSING") return "PROCESSING";
  if (status === "FAILED" || status === "CANCELED" || status === "EXPIRED") return "FAILED";
  return "PENDING_PAYMENT";
}

export function resolveUserStatusModel(status: string): UserStatusModel {
  const key = toUserTransferStatus(status);
  if (key === "COMPLETED") {
    return {
      key,
      label: "Completed",
      description: "Your transfer is complete and your receipt is ready.",
    };
  }
  if (key === "PROCESSING") {
    return {
      key,
      label: "Processing",
      description: "Your payment is confirmed and delivery is in progress.",
    };
  }
  if (key === "FAILED") {
    return {
      key,
      label: "Failed",
      description: "This transfer needs attention before it can continue.",
    };
  }
  return {
    key,
    label: "Pending payment",
    description: "Complete payment to move this transfer forward.",
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
  const processingAt = findEventTime(events, ["PROCESSING"]);
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
      description: "Waiting for payment confirmation before processing.",
      isActive: activeByState[normalized] === 0,
      isComplete: activeByState[normalized] > 0,
    },
    {
      key: "PROCESSING" as const,
      label: "Processing",
      timestamp: processingAt,
      description: "Transfer is moving through verification and delivery.",
      isActive: activeByState[normalized] === 1,
      isComplete: activeByState[normalized] > 1,
    },
    {
      key: "COMPLETED" as const,
      label: "Completed",
      timestamp: completedAt,
      description: "Recipient has received the transfer.",
      isActive: activeByState[normalized] === 2,
      isComplete: activeByState[normalized] > 2 || normalized === "COMPLETED",
    },
    {
      key: "FAILED" as const,
      label: "Failed",
      timestamp: failedAt,
      description: "Transfer failed and requires retry or support.",
      isActive: activeByState[normalized] === 3,
      isComplete: normalized === "FAILED",
    },
  ];
}

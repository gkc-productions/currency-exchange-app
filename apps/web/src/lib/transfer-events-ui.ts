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

export type TimelineMessage = {
  text: string;
  ref: string | null;
  reason: string | null;
};

export function parseTimelineMessage(message: string): TimelineMessage {
  const refMatch = message.match(/(?:^|\s)(?:ref|providerPayoutId|payoutId)=([^\s]+)/i);
  const reasonMatch = message.match(
    /(?:^|\s)(?:code|errorCode|reason)=([^\s]+)/i
  );
  const messageMatch = message.match(/(?:^|\s)message=(.*)$/i);

  const hasMetadata = Boolean(refMatch || reasonMatch || messageMatch);
  if (!hasMetadata) {
    return { text: message, ref: null, reason: null };
  }

  const base = message
    .replace(/\s(?:ref|providerPayoutId|payoutId)=[^\s]+/gi, "")
    .replace(/\s(?:code|errorCode|reason)=[^\s]+/gi, "")
    .replace(/\smessage=.*$/i, "")
    .trim();

  const text = (messageMatch?.[1] ?? base).trim();

  return {
    text,
    ref: refMatch?.[1] ?? null,
    reason: reasonMatch?.[1] ?? null,
  };
}

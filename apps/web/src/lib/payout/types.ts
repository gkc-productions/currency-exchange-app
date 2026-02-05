export type PayoutExecutionStatus = "CREATED" | "FAILED";
export type PayoutProviderStatus =
  | "COMPLETED"
  | "FAILED"
  | "PROCESSING"
  | "PENDING"
  | "UNKNOWN";

export type PayoutExecutionResult = {
  ok: boolean;
  status: PayoutExecutionStatus;
  provider: string;
  providerPayoutId: string;
  providerRef?: string;
  message?: string;
  errorCode?: string;
  errorMessage?: string;
};

export type PayoutStatusResult = {
  ok: boolean;
  status: PayoutProviderStatus;
  provider: string;
  providerPayoutId: string;
  updatedAt?: Date;
  message?: string;
  errorCode?: string;
  errorMessage?: string;
};

export type PayoutWebhookValidationInput = {
  secret: string;
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  eventIdHeader: string | null;
};

export type PayoutWebhookValidationResult = {
  ok: boolean;
  errorCode?: string;
  message?: string;
};

export type PayoutExecutor = {
  name: string;
  providerName: string;
  supportsNewPayoutOnRetry: boolean;
  execute: (input: {
    transferId: string;
    referenceCode: string;
    memo: string | null;
  }) => Promise<PayoutExecutionResult>;
  getStatus: (input: { providerPayoutId: string }) => Promise<PayoutStatusResult>;
  validateWebhook: (
    input: PayoutWebhookValidationInput
  ) => Promise<PayoutWebhookValidationResult>;
};

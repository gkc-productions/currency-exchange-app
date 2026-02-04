export type PayoutExecutionStatus = "CREATED" | "FAILED";

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

export type PayoutExecutor = {
  name: string;
  execute: (input: {
    transferId: string;
    referenceCode: string;
    memo: string | null;
  }) => Promise<PayoutExecutionResult>;
};

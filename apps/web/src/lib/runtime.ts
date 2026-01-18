export const APP_ENV = (
  process.env.NEXT_PUBLIC_CLARISEND_ENV ??
  process.env.CLARISEND_ENV ??
  "sandbox"
).toLowerCase();

export const PAYOUTS_MODE = (
  process.env.NEXT_PUBLIC_CLARISEND_PAYOUTS_MODE ??
  process.env.CLARISEND_PAYOUTS_MODE ??
  "simulated"
).toLowerCase();

export const IS_SANDBOX = APP_ENV !== "production";
export const IS_PRODUCTION = APP_ENV === "production";
export const SIMULATED_PAYOUTS = PAYOUTS_MODE !== "live";
export const ALLOW_SIMULATED_PAYOUTS = IS_SANDBOX && SIMULATED_PAYOUTS;

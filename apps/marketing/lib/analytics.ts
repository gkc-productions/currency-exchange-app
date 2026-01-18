export type AnalyticsEvent =
  | "cta_get_started"
  | "cta_see_how_it_works"
  | "cta_start_sending";

type AnalyticsPayload = Record<string, string | number | boolean>;

export function track(event: AnalyticsEvent, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", event, payload);
  }
}

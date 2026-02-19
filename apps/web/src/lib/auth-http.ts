import { NextResponse } from "next/server";
import type { AuthErrorCode } from "@/src/lib/auth";

const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  EMAIL_TAKEN: "Email is already registered.",
  WEAK_PASSWORD: "Password does not meet policy requirements.",
  INVALID_EMAIL: "Email address is invalid.",
  INVALID_CREDENTIALS: "Invalid credentials.",
  INTERNAL: "Unable to process request.",
  RATE_LIMITED: "Too many requests. Try again later.",
  LOCKED_OUT: "Too many attempts. Try again later.",
  UNAUTHORIZED: "Authentication required.",
  FORBIDDEN: "Access denied.",
  CSRF_BLOCKED: "Cross-site request blocked.",
  CHALLENGE_EXPIRED: "Verification challenge expired.",
  INVALID_CODE: "Verification code is invalid.",
  TOO_MANY_ATTEMPTS: "Too many verification attempts.",
  TOO_MANY_RESENDS: "Too many resend attempts.",
  MFA_NOT_ENABLED: "Two-step verification is not enabled.",
  INVALID_PASSWORD: "Password is invalid.",
};

export function authErrorMessage(errorCode: AuthErrorCode) {
  return AUTH_ERROR_MESSAGES[errorCode] ?? AUTH_ERROR_MESSAGES.INTERNAL;
}

export function authErrorStatus(errorCode: AuthErrorCode) {
  if (errorCode === "INTERNAL") {
    return 500;
  }
  if (errorCode === "RATE_LIMITED" || errorCode === "TOO_MANY_ATTEMPTS" || errorCode === "TOO_MANY_RESENDS") {
    return 429;
  }
  if (errorCode === "LOCKED_OUT") {
    return 423;
  }
  if (errorCode === "UNAUTHORIZED") {
    return 401;
  }
  if (errorCode === "FORBIDDEN" || errorCode === "CSRF_BLOCKED") {
    return 403;
  }
  if (
    errorCode === "INVALID_EMAIL" ||
    errorCode === "WEAK_PASSWORD" ||
    errorCode === "EMAIL_TAKEN" ||
    errorCode === "INVALID_CODE" ||
    errorCode === "CHALLENGE_EXPIRED" ||
    errorCode === "MFA_NOT_ENABLED" ||
    errorCode === "INVALID_PASSWORD"
  ) {
    return 400;
  }
  return 401;
}

export function jsonAuthError(errorCode: AuthErrorCode, status = authErrorStatus(errorCode)) {
  return NextResponse.json(
    {
      ok: false,
      error: errorCode.toLowerCase(),
      errorCode,
      message: authErrorMessage(errorCode),
    },
    { status },
  );
}

const ALLOWED_SEC_FETCH_SITE = new Set(["same-origin", "none"]);

function parseOrigin(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function addCanonicalHostVariants(target: Set<string>, rawOrigin: string | null) {
  if (!rawOrigin) return;
  try {
    const url = new URL(rawOrigin);
    target.add(url.origin);
    if (url.hostname === "clarisend.co") {
      target.add(`${url.protocol}//www.clarisend.co`);
    }
    if (url.hostname === "www.clarisend.co") {
      target.add(`${url.protocol}//clarisend.co`);
    }
  } catch {
    // Ignore invalid origins.
  }
}

function getAllowedBrowserOrigins(req: Request) {
  const allowed = new Set<string>();
  addCanonicalHostVariants(allowed, parseOrigin(req.url));
  addCanonicalHostVariants(allowed, parseOrigin(process.env.APP_BASE_URL ?? null));
  addCanonicalHostVariants(allowed, parseOrigin(process.env.NEXTAUTH_URL ?? null));
  return allowed;
}

export function enforceBrowserSameOrigin(req: Request) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const secFetchSite = req.headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite && !ALLOWED_SEC_FETCH_SITE.has(secFetchSite)) {
    return jsonAuthError("CSRF_BLOCKED", 403);
  }

  const allowedOrigins = getAllowedBrowserOrigins(req);
  const origin = parseOrigin(req.headers.get("origin"));
  if (origin) {
    if (allowedOrigins.has(origin)) {
      return null;
    }
    return jsonAuthError("CSRF_BLOCKED", 403);
  }

  const referer = req.headers.get("referer");
  const refererOrigin = parseOrigin(referer);
  if (referer && !refererOrigin) {
    return jsonAuthError("CSRF_BLOCKED", 403);
  }
  if (refererOrigin) {
    if (allowedOrigins.has(refererOrigin)) {
      return null;
    }
    return jsonAuthError("CSRF_BLOCKED", 403);
  }

  if (secFetchSite !== "same-origin") {
    return jsonAuthError("CSRF_BLOCKED", 403);
  }

  return null;
}

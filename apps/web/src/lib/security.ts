const DEFAULT_ALLOWED_ORIGINS = new Set<string>();

function getAllowedOrigins() {
  if (DEFAULT_ALLOWED_ORIGINS.size === 0) {
    const envOrigin = process.env.NEXTAUTH_URL;
    if (envOrigin) {
      DEFAULT_ALLOWED_ORIGINS.add(envOrigin);
    }
  }
  return DEFAULT_ALLOWED_ORIGINS;
}

export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ip = forwardedFor.split(",")[0]?.trim();
    if (ip) {
      return ip;
    }
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin")?.trim();
  const referer = req.headers.get("referer")?.trim();
  const requestUrl = new URL(req.url);
  const requestOrigin = requestUrl.origin;
  const allowedOrigins = getAllowedOrigins();

  const originToCheck = origin ?? (referer ? new URL(referer).origin : null);
  if (!originToCheck) {
    return false;
  }

  if (originToCheck === requestOrigin) {
    return true;
  }

  if (allowedOrigins.has(originToCheck)) {
    return true;
  }

  return false;
}

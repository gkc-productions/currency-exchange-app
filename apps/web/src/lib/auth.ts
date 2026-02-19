import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/src/lib/prisma";
import { AUTH_SESSION_COOKIE } from "@/src/lib/auth-constants";

const PASSWORD_SALT = process.env.AUTH_PASSWORD_SALT ?? "clarisend-password-salt";
const SESSION_IDLE_TTL_MS = 12 * 60 * 60 * 1000;
const SESSION_ABSOLUTE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_ROTATE_AFTER_MS = 15 * 60 * 1000;

export type AppSession = {
  user: {
    id: string;
    email: string;
    role: "USER" | "ADMIN";
  };
  expires: string;
};

export type SessionLike = AppSession | null;

type CookiePolicy = {
  name: string;
  options: {
    httpOnly: boolean;
    sameSite: "lax";
    path: "/";
    secure: boolean;
    maxAge: number;
  };
};

export function buildAuthOptions(nodeEnv: string | undefined = process.env.NODE_ENV) {
  const isProduction = nodeEnv === "production";
  const sessionToken: CookiePolicy = {
    name: AUTH_SESSION_COOKIE,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: isProduction,
      maxAge: Math.floor(SESSION_ABSOLUTE_TTL_MS / 1000),
    },
  };
  return {
    cookies: {
      sessionToken,
    },
  };
}

export function resolveAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function resolveUserRole(email: string): "USER" | "ADMIN" {
  return resolveAdminEmails().includes(email.toLowerCase()) ? "ADMIN" : "USER";
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function hashPassword(password: string) {
  const derived = scryptSync(password, PASSWORD_SALT, 64);
  return derived.toString("hex");
}

export function createPasswordHash(password: string) {
  return hashPassword(password);
}

export function verifyPassword(password: string, hash: string) {
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(hashPassword(password), "hex");
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

export function getSessionCookieConfig(nodeEnv: string | undefined = process.env.NODE_ENV) {
  return buildAuthOptions(nodeEnv).cookies.sessionToken;
}

export async function issueSession(userId: string) {
  const now = Date.now();
  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = hashSessionToken(rawToken);
  const expires = new Date(now + SESSION_ABSOLUTE_TTL_MS);

  await prisma.session.create({
    data: {
      sessionToken: hashedToken,
      userId,
      expires,
    },
  });

  return {
    rawToken,
    expires,
  };
}

export async function revokeSession(rawToken: string) {
  const hashedToken = hashSessionToken(rawToken);
  await prisma.session.deleteMany({
    where: { sessionToken: hashedToken },
  });
}

export async function rotateSession(rawToken: string) {
  const hashedToken = hashSessionToken(rawToken);
  const existing = await prisma.session.findUnique({
    where: { sessionToken: hashedToken },
  });
  if (!existing) {
    return null;
  }
  await prisma.session.delete({ where: { sessionToken: hashedToken } });
  const next = await issueSession(existing.userId);
  return next;
}

export async function getServerAuthSession(): Promise<SessionLike> {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_BYPASS_AUTH === "1") {
    const fallbackEmail = process.env.DEV_BYPASS_EMAIL?.trim().toLowerCase() || "dev@clarisend.local";
    return {
      user: {
        id: "dev-bypass-user",
        email: fallbackEmail,
        role: resolveUserRole(fallbackEmail),
      },
      expires: new Date(Date.now() + SESSION_IDLE_TTL_MS).toISOString(),
    };
  }

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  if (!rawToken) {
    return null;
  }

  const hashedToken = hashSessionToken(rawToken);
  const now = new Date();

  const record = await prisma.session.findUnique({
    where: { sessionToken: hashedToken },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!record) {
    return null;
  }
  if (record.expires <= now || !record.user?.email) {
    await prisma.session.deleteMany({ where: { sessionToken: hashedToken } });
    return null;
  }

  // Sliding idle session refresh while maintaining absolute TTL.
  const newExpires = new Date(Math.min(record.expires.getTime(), now.getTime() + SESSION_IDLE_TTL_MS));
  if (newExpires.getTime() - now.getTime() > SESSION_ROTATE_AFTER_MS) {
    await prisma.session.update({
      where: { sessionToken: hashedToken },
      data: { expires: newExpires },
    });
  }

  return {
    user: {
      id: record.user.id,
      email: record.user.email,
      role: resolveUserRole(record.user.email),
    },
    expires: record.expires.toISOString(),
  };
}

type EmailSessionLike = {
  user?: {
    email?: string | null;
    role?: string | null;
  } | null;
} | null | undefined;

export function isAdminSession(session: EmailSessionLike) {
  const explicitRole = session?.user?.role?.toUpperCase();
  if (explicitRole === "ADMIN") {
    return true;
  }
  const email = session?.user?.email?.toLowerCase();
  if (!email) {
    return false;
  }
  return resolveAdminEmails().includes(email);
}

export async function findCredentialsAccountByEmail(email: string) {
  return prisma.account.findFirst({
    where: {
      provider: "credentials",
      user: {
        email,
      },
    },
    include: {
      user: true,
    },
  });
}

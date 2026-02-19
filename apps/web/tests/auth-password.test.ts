import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import {
  AUTH_SESSION_ABSOLUTE_TTL_SECONDS,
  AUTH_OTP_MAX_RESENDS,
  AUTH_SESSION_COOKIE,
} from "../src/lib/auth-constants";
import { createSessionForUser } from "../src/lib/auth";
import { isAdminSession } from "../src/lib/auth";
import { POST as signupPost } from "../app/api/auth/signup/route";
import { POST as loginPost } from "../app/api/auth/login/route";
import { POST as logoutPost } from "../app/api/auth/logout/route";
import { POST as loginVerifyPost } from "../app/api/auth/login/verify/route";
import { POST as loginResendPost } from "../app/api/auth/login/resend/route";
import { POST as mfaDisablePost } from "../app/api/auth/mfa/disable/route";
import { POST as mfaDisableVerifyPost } from "../app/api/auth/mfa/disable/verify/route";
import { POST as forgotPost } from "../app/api/auth/forgot/route";
import { POST as resetPost } from "../app/api/auth/reset/route";
import { GET as sessionGet } from "../app/api/auth/session/route";
import { isMarketingLocalePath, isProtectedLocalePath, middleware } from "../middleware";
import { isDevBypassEnabled } from "../src/lib/security";

process.env.AUTH_TEST_OTP = "123456";

const SAME_ORIGIN_HEADERS = {
  "Content-Type": "application/json",
  origin: "http://localhost",
  referer: "http://localhost/en/login",
  "sec-fetch-site": "same-origin",
  "user-agent": "test-agent",
};

after(async () => {
  await prisma.$disconnect();
});

function uniqueEmail(tag: string) {
  return `auth-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

function readSessionToken(setCookie: string | null) {
  return (setCookie ?? "").split(";")[0]?.split("=")[1]?.trim();
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function authPost(url: string, body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { ...SAME_ORIGIN_HEADERS, ...headers },
    body: JSON.stringify(body),
  });
}

test("signup creates user + auth hash", async () => {
  const email = uniqueEmail("signup");
  const password = "Password123";

  const res = await signupPost(authPost("http://localhost/api/auth/signup", { email, password }));
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.ok, true);

  const user = await prisma.user.findUnique({ where: { email } });
  assert.ok(user);

  const auth = await prisma.userAuth.findUnique({ where: { userId: user!.id } });
  assert.ok(auth);
  assert.notEqual(auth!.passwordHash, password);
});

test("login sets cookie and session record", async () => {
  const email = uniqueEmail("login");
  const password = "Password123";

  await signupPost(authPost("http://localhost/api/auth/signup", { email, password }));

  const res = await loginPost(
    authPost("http://localhost/api/auth/login", { email, password }, { "x-real-ip": "127.0.0.1" }),
  );

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);

  const token = readSessionToken(res.headers.get("set-cookie"));
  assert.ok(token);

  const session = await prisma.session.findUnique({
    where: { sessionTokenHash: hashSessionToken(token!) },
  });
  assert.ok(session);
});

test("invalid password returns standardized error shape", async () => {
  const email = uniqueEmail("invalid");
  const password = "Password123";

  await signupPost(authPost("http://localhost/api/auth/signup", { email, password }));

  const res = await loginPost(
    authPost(
      "http://localhost/api/auth/login",
      { email, password: "WrongPassword1" },
      { "x-real-ip": "127.0.0.1" },
    ),
  );

  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.ok, false);
  assert.equal(body.errorCode, "INVALID_CREDENTIALS");
  assert.equal(typeof body.error, "string");
  assert.equal(typeof body.message, "string");

  const audit = await prisma.authAuditEvent.findFirst({
    where: { event: "AUTH_LOGIN_FAILED" },
    orderBy: { createdAt: "desc" },
  });
  assert.ok(audit);
  assert.equal(audit?.errorCode, "INVALID_CREDENTIALS");
  assert.equal(typeof audit?.ipHash, "string");
  assert.equal(typeof audit?.userAgentHash, "string");
});

test("repeated login failures trigger lockout", async () => {
  const email = uniqueEmail("lockout");
  const password = "Password123";

  await signupPost(authPost("http://localhost/api/auth/signup", { email, password }));

  for (let i = 0; i < 5; i += 1) {
    const res = await loginPost(
      authPost(
        "http://localhost/api/auth/login",
        { email, password: "WrongPassword1" },
        { "x-real-ip": "127.0.0.1" },
      ),
    );
    assert.equal(res.status, 401);
  }

  const lockedRes = await loginPost(
    authPost(
      "http://localhost/api/auth/login",
      { email, password: "WrongPassword1" },
      { "x-real-ip": "127.0.0.1" },
    ),
  );
  const body = await lockedRes.json();
  assert.equal(lockedRes.status, 423);
  assert.equal(body.errorCode, "LOCKED_OUT");
});

test("csrf blocks cross-site browser login", async () => {
  const res = await loginPost(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://evil.example",
        referer: "https://evil.example/login",
        "sec-fetch-site": "cross-site",
      },
      body: JSON.stringify({ email: "a@b.com", password: "Password123" }),
    }),
  );

  const body = await res.json();
  assert.equal(res.status, 403);
  assert.equal(body.ok, false);
  assert.equal(body.errorCode, "CSRF_BLOCKED");
});

test("logout invalidates session", async () => {
  const email = uniqueEmail("logout");
  const password = "Password123";

  await signupPost(authPost("http://localhost/api/auth/signup", { email, password }));

  const loginRes = await loginPost(
    authPost("http://localhost/api/auth/login", { email, password }, { "x-real-ip": "127.0.0.1" }),
  );

  const token = readSessionToken(loginRes.headers.get("set-cookie"));
  assert.ok(token);

  const logoutRes = await logoutPost(
    new Request("http://localhost/api/auth/logout", {
      method: "POST",
      headers: {
        ...SAME_ORIGIN_HEADERS,
        cookie: `${AUTH_SESSION_COOKIE}=${token}`,
      },
      body: JSON.stringify({}),
    }),
  );

  assert.equal(logoutRes.status, 200);

  const session = await prisma.session.findUnique({
    where: { sessionTokenHash: hashSessionToken(token!) },
  });
  assert.equal(session, null);
});

test("middleware redirects protected route to login with next", async () => {
  const req = new NextRequest("http://localhost:3000/en/dashboard");
  const res = await middleware(req);

  assert.equal(res.status, 307);
  const location = res.headers.get("location") ?? "";
  assert.ok(location.includes("/en/login"));
  assert.ok(location.includes("next=%2Fen%2Fdashboard"));
});

test("middleware fast-path keeps marketing routes public", async () => {
  assert.equal(isProtectedLocalePath("/"), false);
  assert.equal(isProtectedLocalePath("/fees"), false);
  assert.equal(isProtectedLocalePath("/about"), false);
  assert.equal(isProtectedLocalePath("/admin"), true);
  assert.equal(isMarketingLocalePath("/"), true);
  assert.equal(isMarketingLocalePath("/fees"), true);
  assert.equal(isMarketingLocalePath("/app"), false);

  const req = new NextRequest("http://localhost:3000/en/fees");
  const res = await middleware(req);
  assert.equal(res.status, 200);
  assert.equal(res.headers.has("location"), false);
});

test("middleware permanently redirects www host to apex host", async () => {
  const req = new NextRequest("https://www.clarisend.co/en/login", {
    headers: { host: "www.clarisend.co" },
  });
  const res = await middleware(req);

  assert.equal(res.status, 301);
  assert.equal(res.headers.get("location"), "https://clarisend.co/en/login");
});

test("middleware enforces admin role for admin paths", async () => {
  const originalFetch = global.fetch;

  try {
    global.fetch = (async () =>
      new Response(JSON.stringify({ ok: true, session: { user: { role: "USER" } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as typeof fetch;

    const userReq = new NextRequest("http://localhost:3000/en/admin", {
      headers: { cookie: `${AUTH_SESSION_COOKIE}=session-token` },
    });
    const userRes = await middleware(userReq);
    assert.equal(userRes.status, 200);
    assert.equal(userRes.headers.has("location"), false);

    const userChildReq = new NextRequest("http://localhost:3000/en/admin/webhooks", {
      headers: { cookie: `${AUTH_SESSION_COOKIE}=session-token` },
    });
    const userChildRes = await middleware(userChildReq);
    assert.equal(userChildRes.status, 307);
    assert.equal(userChildRes.headers.get("location")?.includes("/en/admin"), true);

    global.fetch = (async () =>
      new Response(JSON.stringify({ ok: true, session: { user: { role: "ADMIN" } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as typeof fetch;

    const adminReq = new NextRequest("http://localhost:3000/en/admin", {
      headers: { cookie: `${AUTH_SESSION_COOKIE}=session-token` },
    });
    const adminRes = await middleware(adminReq);
    assert.equal(adminRes.status, 200);
    assert.equal(adminRes.headers.has("location"), false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("admin gating requires ADMIN role", () => {
  assert.equal(isAdminSession({ user: { email: "user@example.com", role: "USER" } }), false);
  assert.equal(isAdminSession({ user: { email: "admin@example.com", role: "ADMIN" } }), true);
});

test("dev bypass is blocked in production mode", () => {
  const oldEnv = process.env.NODE_ENV;
  const oldBypass = process.env.DEV_BYPASS_AUTH;
  process.env.NODE_ENV = "production";
  process.env.DEV_BYPASS_AUTH = "1";
  assert.equal(isDevBypassEnabled(), false);
  process.env.NODE_ENV = oldEnv;
  process.env.DEV_BYPASS_AUTH = oldBypass;
});

test("session idle expiry invalidates stale sessions", async () => {
  const user = await prisma.user.create({
    data: {
      email: uniqueEmail("idle"),
      auth: { create: { passwordHash: "x", passwordUpdatedAt: new Date() } },
    },
  });
  const created = await createSessionForUser(user.id);
  const session = created.session;

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date(Date.now() - 13 * 60 * 60 * 1000) },
  });

  const res = await sessionGet(
    new Request("http://localhost/api/auth/session", {
      method: "GET",
      headers: { cookie: `${AUTH_SESSION_COOKIE}=${created.sessionToken}` },
    }),
  );
  const body = await res.json();
  assert.equal(body.session, null);
});

test("session absolute expiry invalidates old sessions", async () => {
  const user = await prisma.user.create({
    data: {
      email: uniqueEmail("absolute"),
      auth: { create: { passwordHash: "x", passwordUpdatedAt: new Date() } },
    },
  });
  const created = await createSessionForUser(user.id);
  const session = created.session;

  await prisma.session.update({
    where: { id: session.id },
    data: {
      createdAt: new Date(Date.now() - (AUTH_SESSION_ABSOLUTE_TTL_SECONDS + 60) * 1000),
    },
  });

  const res = await sessionGet(
    new Request("http://localhost/api/auth/session", {
      method: "GET",
      headers: { cookie: `${AUTH_SESSION_COOKIE}=${created.sessionToken}` },
    }),
  );
  const body = await res.json();
  assert.equal(body.session, null);
});

test("session rotates token after rotation window", async () => {
  const user = await prisma.user.create({
    data: {
      email: uniqueEmail("rotate"),
      auth: { create: { passwordHash: "x", passwordUpdatedAt: new Date() } },
    },
  });
  const created = await createSessionForUser(user.id);
  const session = created.session;

  await prisma.session.update({
    where: { id: session.id },
    data: {
      lastRotatedAt: new Date(Date.now() - 16 * 60 * 1000),
    },
  });

  const res = await sessionGet(
    new Request("http://localhost/api/auth/session", {
      method: "GET",
      headers: { cookie: `${AUTH_SESSION_COOKIE}=${created.sessionToken}` },
    }),
  );

  const nextToken = readSessionToken(res.headers.get("set-cookie"));
  assert.ok(nextToken);
  assert.notEqual(nextToken, created.sessionToken);
});

test("login with mfa enabled returns challenge and no session cookie", async () => {
  const email = uniqueEmail("mfa-login");
  const password = "Password123";

  await signupPost(authPost("http://localhost/api/auth/signup", { email, password }));

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await prisma.userAuth.update({
    where: { userId: user.id },
    data: {
      mfaEnabled: true,
      mfaEmailVerified: true,
      mfaEnrolledAt: new Date(),
    },
  });

  const res = await loginPost(
    authPost("http://localhost/api/auth/login", { email, password }, { "x-real-ip": "127.0.0.1" }),
  );

  const body = (await res.json()) as { ok?: boolean; needsTwoFactor?: boolean; challengeId?: string };
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.needsTwoFactor, true);
  assert.ok(body.challengeId);

  const setCookie = res.headers.get("set-cookie") ?? "";
  assert.equal(setCookie.includes(`${AUTH_SESSION_COOKIE}=`), false);
});

test("login verify with correct otp creates session and consumes challenge", async () => {
  const email = uniqueEmail("mfa-verify");
  const password = "Password123";

  await signupPost(authPost("http://localhost/api/auth/signup", { email, password }));

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await prisma.userAuth.update({
    where: { userId: user.id },
    data: { mfaEnabled: true, mfaEmailVerified: true, mfaEnrolledAt: new Date() },
  });

  const loginRes = await loginPost(
    authPost("http://localhost/api/auth/login", { email, password }, { "x-real-ip": "127.0.0.1" }),
  );
  const loginBody = (await loginRes.json()) as { challengeId?: string };

  const verifyRes = await loginVerifyPost(
    authPost("http://localhost/api/auth/login/verify", {
      challengeId: loginBody.challengeId,
      code: "123456",
    }),
  );

  assert.equal(verifyRes.status, 200);
  const setCookie = verifyRes.headers.get("set-cookie") ?? "";
  assert.match(setCookie, new RegExp(`${AUTH_SESSION_COOKIE}=`));

  const challenge = await prisma.authChallenge.findUniqueOrThrow({
    where: { id: loginBody.challengeId! },
  });
  assert.ok(challenge.consumedAt);
});

test("wrong otp increments attempts and locks at 5", async () => {
  const email = uniqueEmail("mfa-lock");
  const password = "Password123";

  await signupPost(authPost("http://localhost/api/auth/signup", { email, password }));

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await prisma.userAuth.update({
    where: { userId: user.id },
    data: { mfaEnabled: true, mfaEmailVerified: true, mfaEnrolledAt: new Date() },
  });

  const loginRes = await loginPost(
    authPost("http://localhost/api/auth/login", { email, password }, { "x-real-ip": "127.0.0.1" }),
  );
  const loginBody = (await loginRes.json()) as { challengeId?: string };

  for (let i = 0; i < 4; i += 1) {
    const badRes = await loginVerifyPost(
      authPost("http://localhost/api/auth/login/verify", {
        challengeId: loginBody.challengeId,
        code: "111111",
      }),
    );
    assert.equal(badRes.status, 400);
  }

  const lockedRes = await loginVerifyPost(
    authPost("http://localhost/api/auth/login/verify", {
      challengeId: loginBody.challengeId,
      code: "111111",
    }),
  );
  const lockedBody = await lockedRes.json();
  assert.equal(lockedRes.status, 429);
  assert.equal(lockedBody.errorCode, "TOO_MANY_ATTEMPTS");
});

test("resend respects cooldown and max cap", async () => {
  const email = uniqueEmail("resend");
  const password = "Password123";

  await signupPost(authPost("http://localhost/api/auth/signup", { email, password }));

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await prisma.userAuth.update({
    where: { userId: user.id },
    data: { mfaEnabled: true, mfaEmailVerified: true, mfaEnrolledAt: new Date() },
  });

  const loginRes = await loginPost(
    authPost("http://localhost/api/auth/login", { email, password }, { "x-real-ip": "127.0.0.1" }),
  );
  const loginBody = (await loginRes.json()) as { challengeId?: string };

  const immediate = await loginResendPost(
    authPost("http://localhost/api/auth/login/resend", { challengeId: loginBody.challengeId }),
  );
  assert.equal(immediate.status, 429);

  for (let i = 0; i < AUTH_OTP_MAX_RESENDS; i += 1) {
    await prisma.authChallenge.update({
      where: { id: loginBody.challengeId! },
      data: {
        metadata: {
          resendCount: i,
          lastSentAt: new Date(Date.now() - 61_000).toISOString(),
        },
      },
    });

    const resendRes = await loginResendPost(
      authPost("http://localhost/api/auth/login/resend", { challengeId: loginBody.challengeId }),
    );
    assert.equal(resendRes.status, 200);
  }

  await prisma.authChallenge.update({
    where: { id: loginBody.challengeId! },
    data: {
      metadata: {
        resendCount: AUTH_OTP_MAX_RESENDS,
        lastSentAt: new Date(Date.now() - 61_000).toISOString(),
      },
    },
  });

  const capped = await loginResendPost(
    authPost("http://localhost/api/auth/login/resend", { challengeId: loginBody.challengeId }),
  );
  const cappedBody = await capped.json();
  assert.equal(capped.status, 429);
  assert.equal(cappedBody.errorCode, "TOO_MANY_RESENDS");
});

test("disable mfa recovery flow requires password + otp", async () => {
  const email = uniqueEmail("mfa-disable");
  const password = "Password123";

  await signupPost(authPost("http://localhost/api/auth/signup", { email, password }));

  const loginRes = await loginPost(
    authPost("http://localhost/api/auth/login", { email, password }, { "x-real-ip": "127.0.0.1" }),
  );
  const token = readSessionToken(loginRes.headers.get("set-cookie"));

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await prisma.userAuth.update({
    where: { userId: user.id },
    data: { mfaEnabled: true, mfaEmailVerified: true, mfaEnrolledAt: new Date() },
  });

  const disableStart = await mfaDisablePost(
    new Request("http://localhost/api/auth/mfa/disable", {
      method: "POST",
      headers: {
        ...SAME_ORIGIN_HEADERS,
        cookie: `${AUTH_SESSION_COOKIE}=${token}`,
      },
      body: JSON.stringify({ password }),
    }),
  );

  const startBody = (await disableStart.json()) as { challengeId?: string };
  assert.equal(disableStart.status, 200);
  assert.ok(startBody.challengeId);

  const disableVerify = await mfaDisableVerifyPost(
    new Request("http://localhost/api/auth/mfa/disable/verify", {
      method: "POST",
      headers: {
        ...SAME_ORIGIN_HEADERS,
        cookie: `${AUTH_SESSION_COOKIE}=${token}`,
      },
      body: JSON.stringify({ challengeId: startBody.challengeId, code: "123456" }),
    }),
  );

  assert.equal(disableVerify.status, 200);

  const updated = await prisma.userAuth.findUniqueOrThrow({ where: { userId: user.id } });
  assert.equal(updated.mfaEnabled, false);
});

test("forgot and reset password create audit events", async () => {
  const email = uniqueEmail("reset");
  const password = "Password123";
  const nextPassword = "Password456";

  await signupPost(authPost("http://localhost/api/auth/signup", { email, password }));
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });

  const forgotRes = await forgotPost(authPost("http://localhost/api/auth/forgot", { email }));
  assert.equal(forgotRes.status, 200);

  const token = await prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: "desc" },
  });
  assert.ok(token);

  const resetRes = await resetPost(
    authPost("http://localhost/api/auth/reset", { token: token!.token, password: nextPassword }),
  );
  assert.equal(resetRes.status, 200);

  const loginOld = await loginPost(
    authPost("http://localhost/api/auth/login", { email, password }, { "x-real-ip": "127.0.0.1" }),
  );
  assert.equal(loginOld.status, 401);

  const loginNew = await loginPost(
    authPost("http://localhost/api/auth/login", { email, password: nextPassword }, { "x-real-ip": "127.0.0.1" }),
  );
  assert.equal(loginNew.status, 200);

  const resetRequestedAudit = await prisma.authAuditEvent.findFirst({
    where: { event: "AUTH_PASSWORD_RESET_REQUESTED", userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  assert.ok(resetRequestedAudit);

  const resetCompletedAudit = await prisma.authAuditEvent.findFirst({
    where: { event: "AUTH_PASSWORD_RESET_COMPLETED", userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  assert.ok(resetCompletedAudit);
});

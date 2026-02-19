import test from "node:test";
import assert from "node:assert/strict";
import { buildAuthOptions } from "../src/lib/auth";
import { enforceBrowserSameOrigin } from "../src/lib/auth-http";

test("production auth cookies use secure httpOnly sameSite=lax defaults", () => {
  const options = buildAuthOptions("production");
  const sessionCookie = options.cookies?.sessionToken;

  assert.ok(sessionCookie);
  assert.equal(sessionCookie?.name, "clarisend_session");
  assert.equal(sessionCookie?.options.httpOnly, true);
  assert.equal(sessionCookie?.options.sameSite, "lax");
  assert.equal(sessionCookie?.options.secure, true);
  assert.equal(sessionCookie?.options.path, "/");
});

test("cross-site browser POST remains blocked in production-like flow", async () => {
  const req = new Request("https://clarisend.co/api/auth/signup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://evil.example",
      referer: "https://evil.example/signup",
      "sec-fetch-site": "cross-site",
    },
    body: JSON.stringify({ email: "x@example.com", password: "Password123" }),
  });

  const blocked = enforceBrowserSameOrigin(req);
  assert.ok(blocked);
  assert.equal(blocked?.status, 403);
  const body = await blocked!.json();
  assert.equal(body.errorCode, "CSRF_BLOCKED");
});

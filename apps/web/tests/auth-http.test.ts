import test from "node:test";
import assert from "node:assert/strict";
import { enforceBrowserSameOrigin } from "../src/lib/auth-http";

test("same-origin browser POST is allowed", () => {
  const req = new Request("https://clarisend.co/api/auth/signup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://clarisend.co",
      referer: "https://clarisend.co/en/signup",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify({ email: "user@example.com", password: "Password123" }),
  });

  const result = enforceBrowserSameOrigin(req);
  assert.equal(result, null);
});

test("cross-site browser POST is blocked", async () => {
  const req = new Request("https://clarisend.co/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://evil.example",
      referer: "https://evil.example/login",
      "sec-fetch-site": "cross-site",
    },
    body: JSON.stringify({ email: "user@example.com", password: "Password123" }),
  });

  const result = enforceBrowserSameOrigin(req);
  assert.ok(result);
  assert.equal(result.status, 403);
  const body = await result!.json();
  assert.equal(body.errorCode, "CSRF_BLOCKED");
});

test("www origin is temporarily allowed for auth POST", () => {
  const req = new Request("https://clarisend.co/api/auth/signup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://www.clarisend.co",
    },
    body: JSON.stringify({ email: "user@example.com", password: "Password123" }),
  });

  const result = enforceBrowserSameOrigin(req);
  assert.equal(result, null);
});

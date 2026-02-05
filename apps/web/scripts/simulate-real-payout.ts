import { createHmac } from "crypto";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SECRET = process.env.WEBHOOK_SECRET ?? "";
const MODE = (process.env.WEBHOOK_SIGNATURE_MODE ?? "").toLowerCase();
const DEV_HEADERS = {
  "x-dev-bypass-auth": "1",
  "x-dev-user-email": process.env.DEV_USER_EMAIL ?? "you@example.com",
};

if (!SECRET) {
  console.error("WEBHOOK_SECRET is required");
  process.exit(1);
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

function signPayload(rawBody: string, timestamp: string) {
  const base = MODE === "provider_v1" ? `${timestamp}.${rawBody}` : rawBody;
  return createHmac("sha256", SECRET).update(base).digest("hex");
}

async function main() {
  console.log("step=quote");
  const quoteRes = await fetchJson(
    `${BASE}/api/quote?fromAsset=USD&toAsset=GHS&rail=MOBILE_MONEY&sendAmount=100`
  );
  if (quoteRes.status !== 200) {
    throw new Error(`quote failed: ${quoteRes.status}`);
  }
  const quote = quoteRes.json as { id: string };
  if (!quote?.id) {
    throw new Error("quote id missing");
  }

  console.log("step=lock");
  const lockRes = await fetchJson(`${BASE}/api/quote/${quote.id}/lock`, { method: "POST" });
  if (lockRes.status !== 200) {
    throw new Error(`lock failed: ${lockRes.status}`);
  }

  console.log("step=transfer");
  const transferRes = await fetchJson(`${BASE}/api/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...DEV_HEADERS,
    },
    body: JSON.stringify({
      quoteId: quote.id,
      payoutRail: "MOBILE_MONEY",
      recipientName: "Test Recipient",
      recipientCountry: "GH",
      recipientPhone: "+233201234567",
      mobileMoney: { provider: "MTN", number: "+233201234567" },
      memo: "Test",
      saveRecipient: false,
    }),
  });
  if (transferRes.status !== 200) {
    throw new Error(`transfer failed: ${transferRes.status}`);
  }
  const transfer = transferRes.json as { id: string };
  if (!transfer?.id) {
    throw new Error("transfer id missing");
  }

  console.log("step=execute");
  const executeRes = await fetchJson(`${BASE}/api/transfers/${transfer.id}/execute`, {
    method: "POST",
    headers: DEV_HEADERS,
  });
  if (executeRes.status !== 200) {
    throw new Error(`execute failed: ${executeRes.status}`);
  }
  const providerPayoutId = (executeRes.json as { providerPayoutId?: string }).providerPayoutId;
  if (!providerPayoutId) {
    throw new Error("providerPayoutId missing");
  }

  console.log("step=webhook");
  const payload = {
    provider: "MockProvider",
    payoutId: providerPayoutId,
    transferId: transfer.id,
    eventId: `evt_${transfer.id}_${Date.now()}`,
    status: "COMPLETED",
    occurredAt: new Date().toISOString(),
  };
  const rawBody = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signPayload(rawBody, timestamp);
  const webhookRes = await fetchJson(`${BASE}/api/webhooks/payout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-signature": signature,
      "x-payout-timestamp": timestamp,
      "x-webhook-event-id": payload.eventId,
    },
    body: rawBody,
  });
  if (webhookRes.status !== 200) {
    throw new Error(`webhook failed: ${webhookRes.status}`);
  }

  console.log("step=receipt");
  const receiptRes = await fetchJson(`${BASE}/api/transfers/${transfer.id}/receipt`, {
    headers: DEV_HEADERS,
  });
  if (receiptRes.status !== 200) {
    throw new Error(`receipt failed: ${receiptRes.status}`);
  }
  const receipt = receiptRes.json as { receiptUrl?: string | null };
  if (!receipt?.receiptUrl) {
    throw new Error("receiptUrl missing");
  }

  console.log("ok", { transferId: transfer.id, receiptUrl: receipt.receiptUrl });
}

main().catch((err) => {
  console.error("simulate_failed", err);
  process.exit(1);
});

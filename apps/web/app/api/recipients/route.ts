import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession } from "@/src/lib/auth";
import { isSameOrigin } from "@/src/lib/security";

function readRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipients = await prisma.recipient.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    recipients.map((recipient) => ({
      id: recipient.id,
      name: recipient.name,
      country: recipient.country,
      rail: recipient.rail,
      bankName: recipient.bankName,
      bankAccount: recipient.bankAccount,
      mobileMoneyProvider: recipient.mobileMoneyProvider,
      mobileMoneyNumber: recipient.mobileMoneyNumber,
      lightningInvoice: recipient.lightningInvoice,
      createdAt: recipient.createdAt,
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { error: "This action is only available from the ClariSend app." },
      { status: 403 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    name?: unknown;
    country?: unknown;
    rail?: unknown;
    bankName?: unknown;
    bankAccount?: unknown;
    mobileMoneyProvider?: unknown;
    mobileMoneyNumber?: unknown;
    lightningInvoice?: unknown;
  };

  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    payload = body as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = readRequiredString(payload.name);
  const country = readRequiredString(payload.country)?.toUpperCase() ?? "";
  const rail = readRequiredString(payload.rail)?.toUpperCase() ?? "";

  if (!name || !country || !rail) {
    return NextResponse.json(
      { error: "Name, country, and payout rail are required." },
      { status: 400 }
    );
  }

  if (!/^[A-Z]{2}$/.test(country)) {
    return NextResponse.json({ error: "Invalid country code." }, { status: 400 });
  }

  if (!new Set(["BANK", "MOBILE_MONEY", "LIGHTNING"]).has(rail)) {
    return NextResponse.json({ error: "Invalid payout rail." }, { status: 400 });
  }

  const bankName = readRequiredString(payload.bankName);
  const bankAccount = readRequiredString(payload.bankAccount);
  const mobileMoneyProvider = readRequiredString(payload.mobileMoneyProvider);
  const mobileMoneyNumber = readRequiredString(payload.mobileMoneyNumber);
  const lightningInvoice = readRequiredString(payload.lightningInvoice);

  if (rail === "BANK" && (!bankName || !bankAccount)) {
    return NextResponse.json(
      { error: "Bank name and account are required." },
      { status: 400 }
    );
  }

  if (rail === "MOBILE_MONEY" && (!mobileMoneyProvider || !mobileMoneyNumber)) {
    return NextResponse.json(
      { error: "Mobile money provider and number are required." },
      { status: 400 }
    );
  }

  const recipient = await prisma.recipient.create({
    data: {
      userId: user.id,
      name,
      country,
      rail: rail as "BANK" | "MOBILE_MONEY" | "LIGHTNING",
      bankName,
      bankAccount,
      mobileMoneyProvider,
      mobileMoneyNumber,
      lightningInvoice,
    },
  });

  return NextResponse.json({
    id: recipient.id,
    name: recipient.name,
    country: recipient.country,
    rail: recipient.rail,
    bankName: recipient.bankName,
    bankAccount: recipient.bankAccount,
    mobileMoneyProvider: recipient.mobileMoneyProvider,
    mobileMoneyNumber: recipient.mobileMoneyNumber,
    lightningInvoice: recipient.lightningInvoice,
    createdAt: recipient.createdAt,
  });
}

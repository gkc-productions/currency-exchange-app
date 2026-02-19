import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { enforceBrowserSameOrigin, jsonAuthError } from "@/src/lib/auth-http";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: Request) {
  const csrfError = enforceBrowserSameOrigin(req);
  if (csrfError) {
    return csrfError;
  }

  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  if (!email) {
    return jsonAuthError("INVALID_EMAIL", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true },
  });
  if (user?.email) {
    const token = randomBytes(24).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
  }

  return NextResponse.json({ ok: true });
}

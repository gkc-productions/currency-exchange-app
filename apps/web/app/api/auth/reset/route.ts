import { NextResponse } from "next/server";
import { enforceBrowserSameOrigin, jsonAuthError } from "@/src/lib/auth-http";
import { checkPasswordRules } from "@/src/lib/password-strength";
import { prisma } from "@/src/lib/prisma";
import { createPasswordHash } from "@/src/lib/auth";

export async function POST(req: Request) {
  const csrfError = enforceBrowserSameOrigin(req);
  if (csrfError) {
    return csrfError;
  }

  const body = (await req.json().catch(() => null)) as
    | { token?: string; password?: string }
    | null;

  const token = body?.token?.trim() ?? "";
  const password = body?.password ?? "";
  if (!token) {
    return jsonAuthError("INVALID_CODE", 400);
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || verificationToken.expires <= new Date()) {
    return jsonAuthError("CHALLENGE_EXPIRED", 400);
  }

  const email = verificationToken.identifier?.toLowerCase() ?? "";
  const rules = checkPasswordRules(password, email);
  if (
    !rules.lengthOk ||
    !rules.hasUpper ||
    !rules.hasLower ||
    !rules.hasNumber ||
    !rules.hasSymbol ||
    !rules.notCommon ||
    !rules.notEmailPart
  ) {
    return jsonAuthError("WEAK_PASSWORD", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) {
    await prisma.verificationToken.delete({ where: { token } });
    return jsonAuthError("INVALID_CODE", 400);
  }

  const existingCredentials = await prisma.account.findFirst({
    where: {
      userId: user.id,
      provider: "credentials",
    },
    select: { id: true },
  });

  const hashed = createPasswordHash(password);
  if (existingCredentials) {
    await prisma.account.update({
      where: { id: existingCredentials.id },
      data: { access_token: hashed },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: user.email ?? email,
        access_token: hashed,
      },
    });
  }

  await prisma.verificationToken.delete({ where: { token } });
  return NextResponse.json({ ok: true });
}

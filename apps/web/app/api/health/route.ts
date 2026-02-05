import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { resolveCommitHash } from "@/src/lib/version";

export async function GET() {
  const response = {
    alive: true,
    dbOk: false,
    uptimeSeconds: Math.floor(process.uptime()),
    commitHash: resolveCommitHash(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    response.dbOk = true;
  } catch {
    response.dbOk = false;
  }

  return NextResponse.json(response, {
    status: response.dbOk ? 200 : 503,
  });
}

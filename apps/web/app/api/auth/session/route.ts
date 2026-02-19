import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/src/lib/auth";

export async function GET() {
  const session = await getServerAuthSession();
  return NextResponse.json({ ok: true, session });
}

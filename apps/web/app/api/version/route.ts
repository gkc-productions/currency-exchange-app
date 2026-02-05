import { NextResponse } from "next/server";
import { getVersionInfo } from "@/src/lib/version";

export async function GET() {
  return NextResponse.json(getVersionInfo());
}

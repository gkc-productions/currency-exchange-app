import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getServerAuthSession } from "@/src/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const recipientId = resolvedParams.id?.trim();
  if (!recipientId) {
    return NextResponse.json({ error: "Invalid recipient id" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipient = await prisma.recipient.findUnique({
    where: { id: recipientId },
  });

  if (!recipient || recipient.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.recipient.delete({ where: { id: recipientId } });

  return NextResponse.json({ ok: true });
}

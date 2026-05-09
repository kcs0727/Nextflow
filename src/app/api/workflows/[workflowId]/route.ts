import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const renameSchema = z.object({
  name: z.string().min(1),
});

type RouteContext = {
  params: Promise<{ workflowId: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId } = await params;
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, userId },
  });

  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ workflow });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId } = await params;
  const parsed = renameSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.workflow.update({
    where: { id: workflowId },
    data: { name: parsed.data.name },
  });

  return NextResponse.json({ workflow: updated });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId } = await params;
  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.workflow.delete({ where: { id: workflowId } });
  return NextResponse.json({ ok: true });
}
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const saveSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  graph: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ workflows });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = saveSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { id, name, graph } = parsed.data;

  const workflow = id
    ? await prisma.workflow.update({
        where: { id },
        data: { name, graphJson: graph, userId },
      })
    : await prisma.workflow.create({
        data: { name, graphJson: graph, userId },
      });

  return NextResponse.json({ workflow });
}

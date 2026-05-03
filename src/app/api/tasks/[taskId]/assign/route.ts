import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id, role: "PARENT" },
  })
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { taskId } = await params
  const { memberIds } = await request.json()

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { familyId: true },
  })
  if (!task || task.familyId !== member.familyId) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      assignees: {
        set: memberIds.map((id: string) => ({ id })),
      },
    },
  })

  return NextResponse.json({ success: true })
  } catch (e) {
    console.error("POST /api/tasks/[taskId]/assign error:", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: "No family" }, { status: 404 })

  const tasks = await prisma.task.findMany({
    where: { familyId: member.familyId, status: "ACTIVE" },
    include: {
      assignees: { select: { id: true, nickname: true } },
      completions: {
        where: {
          date: {
            gte: (() => {
              const d = new Date()
              d.setHours(0, 0, 0, 0)
              return d
            })(),
          },
        },
        include: { member: { select: { nickname: true } } },
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  const pending = await prisma.taskCompletion.findMany({
    where: {
      status: "PENDING",
      task: { familyId: member.familyId },
    },
    include: {
      task: { select: { name: true, icon: true, points: true } },
      member: { select: { nickname: true } },
    },
    orderBy: { date: "desc" },
  })

  return NextResponse.json({ tasks, pending })
}

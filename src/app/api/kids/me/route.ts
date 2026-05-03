import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
    include: { family: { select: { name: true } } },
  })
  if (!member) return NextResponse.json({ error: "No family" }, { status: 404 })

  let streak = 0
  const completions = await prisma.taskCompletion.findMany({
    where: { memberId: member.id, status: "APPROVED" },
    select: { date: true },
    orderBy: { date: "desc" },
    distinct: ["date"],
  })

  if (completions.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < completions.length; i++) {
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)
      const compDate = new Date(completions[i].date)
      compDate.setHours(0, 0, 0, 0)

      if (compDate.getTime() === expectedDate.getTime()) {
        streak++
      } else if (i === 0) {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        if (compDate.getTime() !== yesterday.getTime()) break
        streak++
      } else {
        break
      }
    }
  }

  return NextResponse.json({
    nickname: member.nickname,
    role: member.role,
    familyName: member.family.name,
    currentPoints: member.currentPoints,
    streak,
  })
}

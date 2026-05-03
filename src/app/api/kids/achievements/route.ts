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

  const [allAchievements, grantedAchievements] = await Promise.all([
    prisma.achievement.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { familyId: member.familyId },
        ],
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.achievementGrant.findMany({
      where: { memberId: member.id },
      select: { achievementId: true, grantedAt: true },
    }),
  ])

  const grantedMap = new Map(
    grantedAchievements.map((g) => [g.achievementId, g.grantedAt])
  )

  const result = allAchievements.map((a) => ({
    ...a,
    unlocked: grantedMap.has(a.id),
    unlockedAt: grantedMap.get(a.id) || null,
  }))

  const totalCount = allAchievements.length
  const unlockedCount = grantedAchievements.length

  return NextResponse.json({
    achievements: result,
    stats: { totalCount, unlockedCount },
  })
}

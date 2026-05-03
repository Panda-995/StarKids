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

  const [achievements, familyMembers, globalAchievements] = await Promise.all([
    prisma.achievement.findMany({
      where: { familyId: member.familyId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.familyMember.findMany({
      where: { familyId: member.familyId },
      select: { id: true, nickname: true, role: true },
    }),
    prisma.achievement.findMany({
      where: { isGlobal: true, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ])

  const achievementIds = [
    ...achievements.map((a) => a.id),
    ...globalAchievements.map((a) => a.id),
  ]

  const grants = await prisma.achievementGrant.findMany({
    where: { achievementId: { in: achievementIds } },
    select: { achievementId: true, memberId: true, grantedAt: true },
  })

  const grantMap = new Map<string, Map<string, Date>>()
  for (const g of grants) {
    if (!grantMap.has(g.achievementId)) grantMap.set(g.achievementId, new Map())
    grantMap.get(g.achievementId)!.set(g.memberId, g.grantedAt)
  }

  const allAchievements = [...globalAchievements, ...achievements].map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    category: a.category,
    condition: a.condition,
    bonusPoints: a.bonusPoints,
    sortOrder: a.sortOrder,
    isActive: a.isActive,
    isHidden: a.isHidden,
    isGlobal: a.isGlobal,
    members: familyMembers
      .filter((m) => m.role === "KID")
      .map((m) => ({
        memberId: m.id,
        nickname: m.nickname,
        grantedAt: grantMap.get(a.id)?.get(m.id)?.toISOString() || null,
        isGranted: grantMap.get(a.id)?.has(m.id) || false,
      })),
    grantedCount: familyMembers
      .filter((m) => m.role === "KID")
      .filter((m) => grantMap.get(a.id)?.has(m.id))
      .length,
  }))

  return NextResponse.json({ achievements: allAchievements })
}

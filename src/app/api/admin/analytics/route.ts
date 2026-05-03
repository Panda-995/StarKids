import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: "No family" }, { status: 404 })

  const familyId = member.familyId
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const [
    kidsMembers,
    allCompletions,
    completions30d,
    pendingCompletions,
    redemptionsAwaiting,
    pointConfig,
  ] = await Promise.all([
    prisma.familyMember.findMany({
      where: { familyId, role: "KID" },
      select: { id: true, nickname: true, currentPoints: true, pet: { select: { species: true, stage: true, level: true } } },
    }),

    // 全部完成记录（30天内，按天分组）
    prisma.taskCompletion.findMany({
      where: { member: { familyId }, date: { gte: thirtyDaysAgo }, status: "APPROVED" },
      select: { date: true, pointsEarned: true, memberId: true, task: { select: { category: true } } },
      orderBy: { date: "asc" },
    }),

    // 最近30天所有完成（含待审/拒绝 用于计算完成率）
    prisma.taskCompletion.findMany({
      where: { member: { familyId }, date: { gte: thirtyDaysAgo } },
      select: { status: true, date: true, memberId: true },
    }),

    // 当前待审核
    prisma.taskCompletion.count({
      where: { member: { familyId }, status: "PENDING" },
    }),

    // 待处理的兑换
    prisma.rewardRedemption.count({
      where: { member: { familyId }, status: "PENDING" },
    }),

    prisma.pointConfig.findUnique({ where: { familyId } }),
  ])

  // ── 每日统计（7天）──
  const dailyStats: Record<string, { date: string; completed: number; points: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyStats[key] = { date: key, completed: 0, points: 0 }
  }

  for (const c of allCompletions) {
    const key = new Date(c.date).toISOString().slice(0, 10)
    if (dailyStats[key]) {
      dailyStats[key].completed++
      dailyStats[key].points += c.pointsEarned
    }
  }

  // ── 每位小朋友统计 ──
  const completionsByMember: Record<string, typeof allCompletions> = {}
  const all30dByMember: Record<string, typeof completions30d> = {}
  for (const c of allCompletions) {
    if (!completionsByMember[c.memberId]) completionsByMember[c.memberId] = []
    completionsByMember[c.memberId].push(c)
  }
  for (const c of completions30d) {
    if (!all30dByMember[c.memberId]) all30dByMember[c.memberId] = []
    all30dByMember[c.memberId].push(c)
  }

  const memberStats = kidsMembers.map((km) => {
    const myCompletions = completionsByMember[km.id] || []
    const myAll30d = all30dByMember[km.id] || []
    const approved = myAll30d.filter((c) => c.status === "APPROVED").length
    const total = myAll30d.length
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 100
    const totalPoints = myCompletions.reduce((sum, c) => sum + c.pointsEarned, 0)

    // 分类分布
    const categoryMap: Record<string, number> = {}
    for (const c of myCompletions) {
      const cat = c.task?.category || "OTHER"
      categoryMap[cat] = (categoryMap[cat] || 0) + 1
    }

    // 连续天数
    let streak = 0
    const uniqueDays = [...new Set(myCompletions.map((c) => new Date(c.date).toISOString().slice(0, 10)))].sort().reverse()
    const today = now.toISOString().slice(0, 10)
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    if (uniqueDays[0] === today || uniqueDays[0] === yesterdayStr) {
      streak = 1
      const expected = new Date(uniqueDays[0])
      for (let i = 1; i < uniqueDays.length; i++) {
        expected.setDate(expected.getDate() - 1)
        const expectedStr = expected.toISOString().slice(0, 10)
        if (uniqueDays[i] === expectedStr) {
          streak++
        } else {
          break
        }
      }
    }

    return {
      memberId: km.id,
      nickname: km.nickname,
      currentPoints: km.currentPoints,
      pet: km.pet ? { species: km.pet.species, stage: km.pet.stage, level: km.pet.level } : null,
      completed30d: approved,
      total30d: total,
      approvalRate,
      pointsEarned30d: totalPoints,
      streak,
      categories: categoryMap,
    }
  })

  // ── 全局概览 ──
  const totalCompleted30d = allCompletions.length
  const totalPoints30d = allCompletions.reduce((sum, c) => sum + c.pointsEarned, 0)
  const totalCompletions30dAll = completions30d.filter((c) => c.status === "APPROVED").length
  const totalAll = completions30d.length
  const overallRate = totalAll > 0 ? Math.round((totalCompletions30dAll / totalAll) * 100) : 100

  // 积分趋势（30天）
  const pointsTrend: Array<{ date: string; points: number }> = []
  const trendMap: Record<string, number> = {}
  for (const c of allCompletions) {
    const key = new Date(c.date).toISOString().slice(0, 10)
    trendMap[key] = (trendMap[key] || 0) + c.pointsEarned
  }

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    pointsTrend.push({ date: key, points: trendMap[key] || 0 })
  }

  // 分类全局分布
  const globalCategories: Record<string, number> = {}
  for (const c of allCompletions) {
    const cat = c.task?.category || "OTHER"
    globalCategories[cat] = (globalCategories[cat] || 0) + 1
  }

  return NextResponse.json({
    overview: {
      totalTasksCompleted: totalCompleted30d,
      totalPointsEarned: totalPoints30d,
      approvalRate: overallRate,
      pendingTasks: pendingCompletions,
      pendingRedemptions: redemptionsAwaiting,
    },
    daily: Object.values(dailyStats),
    memberStats,
    pointsTrend,
    categories: Object.entries(globalCategories).map(([name, value]) => ({ name, value })),
    pointConfig: pointConfig || null,
  })
  } catch (e) {
    console.error("GET /api/admin/analytics error:", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

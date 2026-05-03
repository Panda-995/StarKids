import { prisma } from "@/lib/db"

type PointRuleParams = {
  days?: number
  bonus?: number
  multiplier?: number
  cap?: number
}

type BonusResult = {
  basePoints: number
  bonusPoints: number
  totalPoints: number
  breakdown: string[]
}

export async function calculatePoints(
  taskPoints: number,
  memberId: string,
  familyId: string,
): Promise<BonusResult> {
  const breakdown: string[] = [`基础积分: +${taskPoints}⭐`]
  let bonusPoints = 0

  const [rules, member, config] = await Promise.all([
    prisma.pointRule.findMany({
      where: { familyId, isActive: true },
    }),
    prisma.familyMember.findUnique({
      where: { id: memberId },
      select: { birthdate: true },
    }),
    prisma.pointConfig.findFirst({
      where: { familyId },
    }),
  ])

  for (const rule of rules) {
    const params = JSON.parse(rule.params) as PointRuleParams

    switch (rule.ruleType) {
      case "STREAK_BONUS": {
        const streakDays = await getStreakDays(memberId)
        if (params.days && streakDays >= params.days) {
          const bonus = params.bonus || 0
          bonusPoints += bonus
          breakdown.push(`${rule.name}: +${bonus}⭐`)
        }
        break
      }

      case "WEEKEND_DOUBLE": {
        if (isWeekend() && config?.weekendDouble) {
          const bonus = taskPoints * ((params.multiplier || 2) - 1)
          bonusPoints += bonus
          breakdown.push(`${rule.name}: +${bonus}⭐`)
        }
        break
      }

      case "BIRTHDAY_TRIPLE": {
        if (member?.birthdate && isBirthday(member.birthdate) && config?.birthdayTriple) {
          const bonus = taskPoints * ((params.multiplier || 3) - 1)
          bonusPoints += bonus
          breakdown.push(`🎂 ${rule.name}: +${bonus}⭐`)
        }
        break
      }

      case "DAILY_CAP": {
        const todayPoints = await getTodayPoints(memberId)
        const maxPoints = params.cap || 0
        if (maxPoints > 0 && todayPoints + taskPoints + bonusPoints > maxPoints) {
          const maxBonus = Math.max(0, maxPoints - todayPoints - taskPoints)
          bonusPoints = Math.min(bonusPoints, maxBonus)
          breakdown.push(`⚠️ 已达到每日积分上限`)
        }
        break
      }
    }
  }

  return {
    basePoints: taskPoints,
    bonusPoints,
    totalPoints: taskPoints + bonusPoints,
    breakdown,
  }
}

async function getStreakDays(memberId: string): Promise<number> {
  const completions = await prisma.taskCompletion.findMany({
    where: {
      memberId,
      status: "APPROVED",
    },
    select: { date: true },
    orderBy: { date: "desc" },
    distinct: ["date"],
  })

  if (completions.length === 0) return 0

  let streak = 0
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

  return streak
}

async function getTodayPoints(memberId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const completions = await prisma.taskCompletion.aggregate({
    where: {
      memberId,
      status: "APPROVED",
      date: { gte: today },
    },
    _sum: { pointsEarned: true },
  })

  return completions._sum.pointsEarned || 0
}

function isWeekend(): boolean {
  const day = new Date().getDay()
  return day === 0 || day === 6
}

function isBirthday(birthday: Date | null): boolean {
  if (!birthday) return false
  const today = new Date()
  return (
    today.getMonth() === birthday.getMonth() &&
    today.getDate() === birthday.getDate()
  )
}

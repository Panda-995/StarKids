"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { AchievementCategory } from "@prisma/client"

export async function createAchievement(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!member) throw new Error("你还未加入家庭")

  const conditionType = formData.get("conditionType") as string
  const condition: any = { type: conditionType }

  if (conditionType === "TASK_COUNT" || conditionType === "STREAK") {
    condition.count = parseInt(formData.get("conditionCount") as string) || 0
  }
  if (conditionType === "CONSECUTIVE_DAYS") {
    condition.days = parseInt(formData.get("conditionDays") as string) || 0
  }
  if (conditionType === "TOTAL_POINTS") {
    condition.points = parseInt(formData.get("conditionPoints") as string) || 0
  }
  if (conditionType === "REDEMPTION_COUNT") {
    condition.count = parseInt(formData.get("conditionCount") as string) || 0
  }

  const category = formData.get("conditionCategory") as string
  if (category && category !== "ALL") condition.category = category

  await prisma.achievement.create({
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      icon: (formData.get("icon") as string) || "🏆",
      category: (formData.get("category") as AchievementCategory) || "SPECIAL",
      condition: JSON.stringify(condition),
      bonusPoints: parseInt(formData.get("bonusPoints") as string) || 0,
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
      isHidden: formData.get("isHidden") === "true",
      isActive: true,
      familyId: member.familyId,
    },
  })

  revalidatePath("/admin/achievements")
}

export async function updateAchievement(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const id = formData.get("id") as string
  if (!id) throw new Error("缺少成就ID")

  const conditionType = formData.get("conditionType") as string
  const condition: any = { type: conditionType }

  if (conditionType === "TASK_COUNT" || conditionType === "STREAK") {
    condition.count = parseInt(formData.get("conditionCount") as string) || 0
  }
  if (conditionType === "CONSECUTIVE_DAYS") {
    condition.days = parseInt(formData.get("conditionDays") as string) || 0
  }
  if (conditionType === "TOTAL_POINTS") {
    condition.points = parseInt(formData.get("conditionPoints") as string) || 0
  }
  if (conditionType === "REDEMPTION_COUNT") {
    condition.count = parseInt(formData.get("conditionCount") as string) || 0
  }

  const category = formData.get("conditionCategory") as string
  if (category && category !== "ALL") condition.category = category

  await prisma.achievement.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      icon: (formData.get("icon") as string) || "🏆",
      category: (formData.get("category") as AchievementCategory) || "SPECIAL",
      condition: JSON.stringify(condition),
      bonusPoints: parseInt(formData.get("bonusPoints") as string) || 0,
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
      isHidden: formData.has("isHidden") ? formData.get("isHidden") === "true" : undefined,
    },
  })

  revalidatePath("/admin/achievements")
}

export async function deleteAchievement(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  await prisma.achievement.delete({ where: { id } })
  revalidatePath("/admin/achievements")
}

export async function toggleAchievement(id: string, isActive: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  await prisma.achievement.update({
    where: { id },
    data: { isActive },
  })

  revalidatePath("/admin/achievements")
}

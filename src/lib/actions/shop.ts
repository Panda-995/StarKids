"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"
import type { RewardCategory, RewardStatus } from "@prisma/client"

export async function createReward(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id, role: "PARENT" },
  })
  if (!member) throw new Error("只有家长才能管理商城")

  await prisma.reward.create({
    data: {
      familyId: member.familyId,
      name: (formData.get("name") as string).trim(),
      description: (formData.get("description") as string) || null,
      category: (formData.get("category") as RewardCategory) || "TOY",
      points: parseInt(formData.get("points") as string) || 50,
      stock: parseInt(formData.get("stock") as string) || 0,
      remainingStock: parseInt(formData.get("stock") as string) || 0,
      maxPerPerson: parseInt(formData.get("maxPerPerson") as string) || 0,
      cooldownDays: parseInt(formData.get("cooldownDays") as string) || 0,
      isFeatured: formData.get("isFeatured") === "true",
      tags: JSON.stringify((formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) || []),
    },
  })

  revalidatePath("/admin/shop")
  revalidatePath("/kids/shop")
}

export async function updateReward(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const id = formData.get("id") as string

  await prisma.reward.update({
    where: { id },
    data: {
      name: (formData.get("name") as string)?.trim(),
      description: (formData.get("description") as string) || null,
      category: (formData.get("category") as RewardCategory) || undefined,
      image: formData.get("image") as string || undefined,
      points: parseInt(formData.get("points") as string) || undefined,
      status: (formData.get("status") as RewardStatus) || undefined,
      isFeatured: formData.has("isFeatured") ? formData.get("isFeatured") === "true" : undefined,
    }
  })

  revalidatePath("/admin/shop")
}

export async function deleteReward(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id, role: "PARENT" },
  })
  if (!member) throw new Error("只有家长才能管理商城")

  await prisma.reward.delete({ where: { id } })
  revalidatePath("/admin/shop")
}

export async function redeemReward(rewardId: string, message?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!member) throw new Error("你还未加入家庭")

  const reward = await prisma.reward.findUnique({ where: { id: rewardId } })
  if (!reward) throw new Error("商品不存在")
  if (reward.status !== "ACTIVE") throw new Error("商品已下架")

  if (reward.stock > 0 && reward.remainingStock <= 0) {
    throw new Error("库存不足")
  }

  if (member.currentPoints < reward.points) {
    throw new Error(`积分不足！需要 ${reward.points}⭐，当前 ${member.currentPoints}⭐`)
  }

  const redemption = await prisma.$transaction(async (tx) => {
    const created = await tx.rewardRedemption.create({
      data: {
        rewardId,
        memberId: member.id,
        pointsSpent: reward.points,
        status: "PENDING",
        kidMessage: message || null,
      },
    })

    if (reward.stock > 0) {
      await tx.reward.update({
        where: { id: rewardId },
        data: { remainingStock: { decrement: 1 } },
      })
    }

    await tx.familyMember.update({
      where: { id: member.id },
      data: { currentPoints: { decrement: reward.points } },
    })

    return created
  })

  const parents = await prisma.familyMember.findMany({
    where: { familyId: member.familyId, role: "PARENT" },
    select: { userId: true },
  })
  for (const p of parents) {
    await createNotification({
      userId: p.userId,
      memberId: member.id,
      type: "REDEMPTION_REQUEST",
      priority: "HIGH",
      title: `${member.nickname} 申请兑换`,
      content: `"${reward.name}" -${reward.points}⭐${message ? ` 留言: "${message}"` : ""}`,
      link: "/admin/shop",
      data: { redemptionId: redemption.id, rewardId },
    })
  }

  revalidatePath("/kids/shop")
  return redemption
}

export async function approveRedemption(redemptionId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const r = await prisma.rewardRedemption.update({
    where: { id: redemptionId },
    data: {
      status: "APPROVED",
      approvedBy: session.user.id,
      approvedAt: new Date(),
    },
    include: { member: { select: { userId: true, nickname: true } }, reward: { select: { name: true } } },
  })

  try {
    await createNotification({
      userId: r.member.userId,
      memberId: r.memberId,
      type: "REDEMPTION_APPROVED",
      priority: "HIGH",
      title: "兑换申请通过！🎉",
      content: `你申请的"${r.reward.name}"已通过，爸爸妈妈会尽快兑现！`,
      link: "/kids/shop",
    })
  } catch (e) {
    console.error("Notification creation failed:", e)
  }

  revalidatePath("/admin/shop")
  revalidatePath("/kids/shop")
}

export async function rejectRedemption(redemptionId: string, note?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const redemption = await prisma.rewardRedemption.findUnique({
    where: { id: redemptionId },
    include: { reward: true },
  })

  if (!redemption) throw new Error("兑换记录不存在")

  const r = await prisma.$transaction(async (tx) => {
    if (redemption.reward.stock > 0) {
      await tx.reward.update({
        where: { id: redemption.rewardId },
        data: { remainingStock: { increment: 1 } },
      })
    }

    const updated = await tx.rewardRedemption.update({
      where: { id: redemptionId },
      data: {
        status: "REJECTED",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        parentNote: note || null,
      },
      include: { member: { select: { userId: true } }, reward: { select: { name: true } } },
    })

    await tx.familyMember.update({
      where: { id: redemption.memberId },
      data: { currentPoints: { increment: redemption.pointsSpent } },
    })

    return updated
  })

  try {
    await createNotification({
      userId: r.member.userId,
      memberId: r.memberId,
      type: "REDEMPTION_REJECTED",
      priority: "NORMAL",
      title: "兑换申请未通过",
      content: `你申请的"${r.reward.name}"暂未通过，继续努力攒积分吧！`,
      link: "/kids/shop",
    })
  } catch (e) {
    console.error("Notification creation failed:", e)
  }

  revalidatePath("/admin/shop")
  revalidatePath("/kids/shop")
}

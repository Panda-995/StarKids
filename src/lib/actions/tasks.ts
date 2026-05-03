"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { calculatePoints } from "@/lib/points-engine"
import { checkAchievements } from "@/lib/achievement-engine"
import { createNotification } from "./notifications"
import type { TaskCategory, TaskType, TaskFrequency, TaskDifficulty, TaskStatus } from "@prisma/client"

// ═══════════════════════════════════════════════════════════════
//  家长端：任务 CRUD
// ═══════════════════════════════════════════════════════════════

export async function createTask(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id, role: "PARENT" },
  })
  if (!member) throw new Error("只有家长才能创建任务")

  const name = formData.get("name") as string
  const points = parseInt(formData.get("points") as string) || 5

  const kids = await prisma.familyMember.findMany({
    where: { familyId: member.familyId, role: "KID" },
    select: { id: true },
  })

  await prisma.task.create({
    data: {
      familyId: member.familyId,
      creatorId: session.user.id,
      name: name.trim(),
      description: (formData.get("description") as string) || null,
      icon: (formData.get("icon") as string) || "📌",
      category: (formData.get("category") as TaskCategory) || "OTHER",
      type: (formData.get("type") as TaskType) || "DAILY",
      frequency: (formData.get("frequency") as TaskFrequency) || "DAILY",
      difficulty: (formData.get("difficulty") as TaskDifficulty) || "EASY",
      points,
      autoApprove: formData.get("autoApprove") === "true",
      maxDaily: parseInt(formData.get("maxDaily") as string) || 1,
      weekDays: JSON.stringify(
        (formData.get("weekDays") as string)
          ?.split(",")
          .map(Number)
          .filter((n) => !isNaN(n)) || [1, 2, 3, 4, 5, 6, 0]
      ),
      assignees: {
        connect: kids.map((kid) => ({ id: kid.id })),
      },
    },
  })

  revalidatePath("/admin/tasks")
  revalidatePath("/kids/tasks")
  revalidatePath("/kids")
}

export async function updateTask(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const id = formData.get("id") as string
  if (!id) throw new Error("任务ID不能为空")

  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing) throw new Error("任务不存在")

  const name = formData.get("name") as string

  await prisma.task.update({
    where: { id },
    data: {
      name: name?.trim(),
      description: (formData.get("description") as string) || null,
      icon: (formData.get("icon") as string) || existing.icon,
      category: (formData.get("category") as TaskCategory) || existing.category,
      type: (formData.get("type") as TaskType) || existing.type,
      difficulty: (formData.get("difficulty") as TaskDifficulty) || existing.difficulty,
      frequency: (formData.get("frequency") as TaskFrequency) || existing.frequency,
      points: parseInt(formData.get("points") as string) ?? existing.points,
      autoApprove: formData.has("autoApprove")
        ? formData.get("autoApprove") === "true"
        : existing.autoApprove,
      maxDaily: parseInt(formData.get("maxDaily") as string) || existing.maxDaily,
      status: (formData.get("status") as TaskStatus) || existing.status,
      weekDays: formData.get("weekDays")
        ? JSON.stringify((formData.get("weekDays") as string).split(",").map(Number).filter((n) => !isNaN(n)))
        : existing.weekDays,
    },
  })

  revalidatePath("/admin/tasks")
}

export async function deleteTask(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  await prisma.task.delete({ where: { id } })

  revalidatePath("/admin/tasks")
}

// ═══════════════════════════════════════════════════════════════
//  家长端：任务分配
// ═══════════════════════════════════════════════════════════════

export async function assignTask(taskId: string, memberIds: string[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error("任务不存在")

  await prisma.task.update({
    where: { id: taskId },
    data: {
      assignees: {
        set: memberIds.map((id) => ({ id })),
      },
    },
  })

  revalidatePath("/admin/tasks")
}

// ═══════════════════════════════════════════════════════════════
//  小朋友端：完成任务
// ═══════════════════════════════════════════════════════════════

export async function completeTask(taskId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!member) throw new Error("你还未加入家庭")

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignees: true },
  })
  if (!task) throw new Error("任务不存在")

  const isAssigned = task.assignees.some((a) => a.id === member.id)

  if (!isAssigned && task.assignees.length > 0) {
    throw new Error("这个任务还没分配给你")
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await prisma.taskCompletion.findFirst({
    where: {
      taskId,
      memberId: member.id,
      date: { gte: today },
      status: { not: "REJECTED" },
    },
  })
  if (existing) throw new Error("今天已经提交过这个任务了")

  const { totalPoints } = await calculatePoints(
    task.points,
    member.id,
    member.familyId
  )

  const completion = await prisma.taskCompletion.create({
    data: {
      taskId,
      memberId: member.id,
      pointsEarned: totalPoints,
      status: task.autoApprove ? "APPROVED" : "PENDING",
      approvedBy: task.autoApprove ? session.user.id : null,
      approvedAt: task.autoApprove ? new Date() : null,
      date: today,
    },
  })

  try {
    if (task.autoApprove) {
      await prisma.familyMember.update({
        where: { id: member.id },
        data: { currentPoints: { increment: totalPoints } },
      })
      await checkAchievements(member.id, completion.id)
    } else {
      const parents = await prisma.familyMember.findMany({
        where: { familyId: member.familyId, role: "PARENT" },
        select: { userId: true },
      })
      for (const p of parents) {
        await createNotification({
          userId: p.userId,
          memberId: member.id,
          type: "TASK_COMPLETED",
          priority: "NORMAL",
          title: `${member.nickname} 完成了任务`,
          content: `"${task.name}" +${totalPoints}⭐，等待你的审核`,
          link: "/admin/tasks",
          data: { completionId: completion.id, taskId, memberId: member.id },
        })
      }
    }
  } catch (e) {
    console.error("Post-completion operations failed:", e)
  }

  revalidatePath("/kids/tasks")
  revalidatePath("/kids")
  revalidatePath("/kids/achievements")
}

// ═══════════════════════════════════════════════════════════════
//  家长端：审核任务
// ═══════════════════════════════════════════════════════════════

export async function approveTask(completionId: string, note?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const completion = await prisma.$transaction(async (tx) => {
    const updated = await tx.taskCompletion.update({
      where: { id: completionId },
      data: {
        status: "APPROVED",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        parentNote: note || null,
      },
      include: { member: { select: { nickname: true, userId: true } }, task: { select: { name: true } } },
    })

    await tx.familyMember.update({
      where: { id: updated.memberId },
      data: { currentPoints: { increment: updated.pointsEarned } },
    })

    return updated
  })

  await checkAchievements(completion.memberId, completionId).catch((e) => {
    console.error("Achievement check failed:", e)
  })

  try {
    await createNotification({
      userId: completion.member.userId,
      memberId: completion.memberId,
      type: "TASK_APPROVED",
      priority: "HIGH",
      title: "任务审核通过！🎉",
      content: `"${completion.task.name}" 已审核通过，获得 ${completion.pointsEarned}⭐`,
      link: "/kids/tasks",
    })
  } catch (e) {
    console.error("Notification creation failed:", e)
  }

  revalidatePath("/admin/tasks")
  revalidatePath("/kids/tasks")
  revalidatePath("/kids")
  revalidatePath("/kids/achievements")
}

export async function rejectTask(completionId: string, note?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const rejection = await prisma.taskCompletion.update({
    where: { id: completionId },
    data: {
      status: "REJECTED",
      approvedBy: session.user.id,
      approvedAt: new Date(),
      parentNote: note || null,
    },
    include: { member: { select: { userId: true } }, task: { select: { name: true } } },
  })

  try {
    await createNotification({
      userId: rejection.member.userId,
      memberId: rejection.memberId,
      type: "TASK_REJECTED",
      priority: "NORMAL",
      title: "任务需要改进哦",
      content: `"${rejection.task.name}" 没有通过审核，继续加油！`,
      link: "/kids/tasks",
    })
  } catch (e) {
    console.error("Notification creation failed:", e)
  }

  revalidatePath("/admin/tasks")
  revalidatePath("/kids/tasks")
  revalidatePath("/kids")
}

// ═══════════════════════════════════════════════════════════════
//  查询：获取家庭任务
// ═══════════════════════════════════════════════════════════════

export async function getFamilyTasks(familyId: string) {
  return prisma.task.findMany({
    where: { familyId, status: "ACTIVE" },
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
}

export async function getMemberTasks(memberId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return prisma.task.findMany({
    where: {
      status: "ACTIVE",
      assignees: { some: { id: memberId } },
    },
    include: {
      completions: {
        where: { date: { gte: today }, memberId },
        select: { id: true, status: true, pointsEarned: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  })
}

export async function getPendingCompletions(familyId: string) {
  return prisma.taskCompletion.findMany({
    where: {
      status: "PENDING",
      task: { familyId },
    },
    include: {
      task: { select: { name: true, icon: true, points: true } },
      member: { select: { nickname: true } },
    },
    orderBy: { date: "desc" },
  })
}

"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import type { NotificationType, NotificationPriority } from "@prisma/client"
import { revalidatePath } from "next/cache"

type CreateNotificationParams = {
  userId: string
  memberId?: string
  type: string
  priority?: "LOW" | "NORMAL" | "HIGH"
  title: string
  content?: string
  link?: string
  data?: any
}

export async function createNotification(params: CreateNotificationParams) {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      memberId: params.memberId || null,
      type: params.type as NotificationType,
      priority: params.priority || "NORMAL",
      title: params.title,
      content: params.content || null,
      link: params.link || null,
      data: params.data ? JSON.stringify(params.data) : null,
    },
  })
}

export async function getNotifications(type?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const where: any = { userId: session.user.id }
  if (type) where.type = type

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}

export async function getUnreadCount() {
  const session = await auth()
  if (!session?.user?.id) return 0

  return prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  })
}

export async function markAsRead(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  })

  revalidatePath("/")
}

export async function markAllAsRead() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })

  revalidatePath("/")
}

export async function deleteNotification(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  await prisma.notification.delete({ where: { id: notificationId } })
  revalidatePath("/")
}

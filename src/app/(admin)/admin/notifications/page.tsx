"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { useToast } from "@/components/ui/ToastProvider"
import { markAsRead, markAllAsRead } from "@/lib/actions/notifications"

type NotificationData = {
  id: string
  type: string
  priority: string
  title: string
  content: string
  link: string | null
  isRead: boolean
  createdAt: string
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  TASK_APPROVED: { label: "任务通过", color: "bg-candy-green/10 text-candy-green" },
  TASK_REJECTED: { label: "任务退回", color: "bg-candy-red/10 text-candy-red" },
  TASK_PENDING: { label: "待审核", color: "bg-candy-orange/10 text-candy-orange" },
  REDEMPTION_REQUEST: { label: "兑换申请", color: "bg-candy-purple/10 text-candy-purple" },
  REDEMPTION_APPROVED: { label: "兑换通过", color: "bg-candy-green/10 text-candy-green" },
  REDEMPTION_REJECTED: { label: "兑换退回", color: "bg-candy-red/10 text-candy-red" },
  ACHIEVEMENT_UNLOCKED: { label: "成就解锁", color: "bg-brand-100 text-brand-500" },
  FAMILY_JOINED: { label: "新成员", color: "bg-candy-blue/10 text-candy-blue" },
  SYSTEM: { label: "系统", color: "bg-warm-100 text-warm-600" },
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "border-l-candy-red",
  NORMAL: "border-l-candy-blue",
  LOW: "border-l-warm-300",
}

export default function AdminNotificationsPage() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadOnly, setUnreadOnly] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const url = unreadOnly ? "/api/notifications?unread=true" : "/api/notifications"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {
      // keep stale data
    } finally {
      setLoading(false)
    }
  }, [unreadOnly])

  useEffect(() => {
    fetchData()
  }, [unreadOnly, fetchData])

  async function handleMarkAsRead(id: string) {
    try {
      await markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch {
      toast("操作失败", "error")
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.isRead)
    if (unread.length === 0) return
    try {
      await markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      toast("全部标记已读", "success")
    } catch {
      toast("操作失败", "error")
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-warm-800">🔔 通知管理</h1>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-800">🔔 通知管理</h1>
          <p className="text-sm text-warm-400 mt-1">
            {notifications.length} 条通知 · {unreadCount} 条未读
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={cn(
              "h-10 px-4 rounded-xl text-sm font-medium transition-colors",
              unreadOnly
                ? "bg-admin-primary text-white"
                : "bg-warm-100 text-warm-600 hover:bg-warm-200"
            )}
          >
            {unreadOnly ? "仅未读" : "查看全部"}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="h-10 px-4 bg-warm-100 text-warm-600 rounded-xl text-sm font-medium hover:bg-warm-200 transition-colors"
            >
              全部已读
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-warm-400">
          <p className="text-4xl mb-2">🔔</p>
          <p>{unreadOnly ? "没有未读通知" : "暂无通知"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "bg-white rounded-xl shadow-card p-4 flex items-start gap-4 border-l-4 transition-all cursor-pointer hover:bg-warm-50",
                PRIORITY_COLORS[n.priority] || "border-l-transparent",
                !n.isRead && "bg-warm-50/80"
              )}
              onClick={() => {
                if (!n.isRead) handleMarkAsRead(n.id)
              }}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0",
                TYPE_LABELS[n.type]?.color || "bg-warm-100 text-warm-600",
              )}>
                {n.isRead ? "📨" : "🔔"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    TYPE_LABELS[n.type]?.color || "bg-warm-100 text-warm-600"
                  )}>
                    {TYPE_LABELS[n.type]?.label || n.type}
                  </span>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-candy-red flex-shrink-0" />
                  )}
                </div>
                <h3 className={cn(
                  "text-sm font-semibold",
                  n.isRead ? "text-warm-600" : "text-warm-800"
                )}>
                  {n.title}
                </h3>
                <p className="text-xs text-warm-400 mt-0.5 line-clamp-2">{n.content}</p>
                <p className="text-xs text-warm-300 mt-1">
                  {new Date(n.createdAt).toLocaleDateString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

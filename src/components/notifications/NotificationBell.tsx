"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { markAsRead, markAllAsRead, deleteNotification } from "@/lib/actions/notifications"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  type: string
  title: string
  content: string | null
  link: string | null
  isRead: boolean
  createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  TASK_COMPLETED: "✅", TASK_APPROVED: "🎉", TASK_REJECTED: "❌",
  REDEMPTION_REQUEST: "🎁", REDEMPTION_APPROVED: "🎊", REDEMPTION_REJECTED: "💔",
  REDEMPTION_FULFILLED: "🎉", ACHIEVEMENT_UNLOCKED: "🏆",
  PET_MISSING: "🐱", STREAK_REMINDER: "🔥", DAILY_REMINDER: "📋",
  NEW_TASK: "📋", WEEKLY_REPORT: "📊", LOW_STOCK: "📦",
}

export function NotificationBell({ href = "/kids/notifications" }: { href?: string }) {
  const [count, setCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/notifications?unread=true")
        if (res.ok) {
          const data = await res.json()
          setCount(data.unreadCount || 0)
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <button
      onClick={() => router.push(href)}
      className="relative p-2 hover:bg-warm-100 rounded-xl transition-colors"
    >
      <span className="text-xl">🔔</span>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-candy-red text-white text-xs font-bold rounded-full px-1 animate-pulse">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  )
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleClick(n: Notification) {
    if (!n.isRead) {
      await markAsRead(n.id)
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      )
    }
    if (n.link) {
      router.push(n.link)
    }
  }

  async function handleDelete(id: string) {
    await deleteNotification(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  async function handleMarkAllRead() {
    await markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const hasUnread = notifications.some((n) => !n.isRead)

  if (loading) {
    return (
      <div className="text-center py-8 text-warm-400">
        <div className="animate-spin text-3xl">🔄</div>
      </div>
    )
  }

  return (
    <div>
      {hasUnread && (
        <div className="flex justify-end mb-3">
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-candy-blue hover:underline"
          >
            全部已读
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-warm-400">
          <p className="text-4xl mb-2">🔔</p>
          <p>暂无通知</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={cn(
                "relative bg-white rounded-card shadow-soft p-4 cursor-pointer transition-all hover:shadow-md active:scale-[0.99]",
                !n.isRead && "border-l-3 border-l-candy-blue bg-candy-blue/5"
              )}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(n.id)
                }}
                className="absolute top-2 right-2 text-warm-300 hover:text-candy-red text-sm"
              >
                ✕
              </button>
              <div className="flex items-start gap-3 pr-6">
                <span className="text-2xl">{TYPE_ICONS[n.type] || "📢"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={cn("font-semibold text-sm", n.isRead ? "text-warm-600" : "text-warm-800")}>
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-candy-blue flex-shrink-0" />
                    )}
                  </div>
                  {n.content && (
                    <p className="text-xs text-warm-400 mt-0.5 line-clamp-2">{n.content}</p>
                  )}
                  <p className="text-xs text-warm-300 mt-1">
                    {formatTime(n.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString("zh-CN")
}

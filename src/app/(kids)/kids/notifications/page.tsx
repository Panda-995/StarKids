"use client"

import { NotificationList } from "@/components/notifications/NotificationBell"
import { PageTransition } from "@/components/ui/PageTransition"

export default function KidsNotificationsPage() {
  return (
    <PageTransition className="p-5 space-y-5">
      <h1 className="font-kids text-3xl text-candy-purple pt-4">🔔 消息通知</h1>
      <NotificationList />
    </PageTransition>
  )
}

import { KidsBottomNav } from "@/components/kids/KidsBottomNav"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { SessionProvider } from "@/components/auth/SessionProvider"
import { KidsLogoutButton } from "@/components/kids/KidsLogoutButton"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function KidsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const userRole = session.user?.role

  if (userRole === "PARENT") {
    redirect("/forbidden?reason=parent_to_kids")
  }

  return (
    <SessionProvider>
      <div className="min-h-screen pb-20 bg-warm-50 max-w-lg mx-auto">
        <div className="flex justify-between items-center px-5 pt-3">
          <KidsLogoutButton />
          <NotificationBell />
        </div>
        {children}
        <KidsBottomNav />
      </div>
    </SessionProvider>
  )
}

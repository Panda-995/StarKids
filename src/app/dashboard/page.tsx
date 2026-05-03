import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const userRole = session.user.role

  if (userRole === "KID") {
    redirect("/kids")
  }

  redirect("/admin")
}

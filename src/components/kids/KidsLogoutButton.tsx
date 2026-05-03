"use client"

import { signOut } from "next-auth/react"
import { useState } from "react"

export function KidsLogoutButton() {
  const [showConfirm, setShowConfirm] = useState(false)

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg
          bg-warm-100 hover:bg-warm-200 text-warm-400 hover:text-warm-600 transition-all"
        title="退出登录"
      >
        ⚙️
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={async () => {
          await signOut({ callbackUrl: "/login" })
        }}
        className="h-9 px-4 rounded-xl text-sm font-semibold
          bg-candy-red text-white hover:brightness-110 transition-all"
      >
        确认退出
      </button>
      <button
        onClick={() => setShowConfirm(false)}
        className="h-9 px-3 rounded-xl text-sm
          bg-warm-200 text-warm-600 hover:bg-warm-300 transition-all"
      >
        取消
      </button>
    </div>
  )
}

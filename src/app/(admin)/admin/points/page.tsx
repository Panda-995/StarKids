"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { CardSkeleton } from "@/components/ui/Skeleton"

type PointConfig = {
  id: string
  weekendDouble: boolean
  birthdayTriple: boolean
  enableDeduction: boolean
  dailyCap: number
  resetType: string
}

export default function AdminPointsPage() {
  const router = useRouter()
  const [config, setConfig] = useState<PointConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/points/config")
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch("/api/points/config", {
        method: "POST",
        body: formData,
      })
      if (res.ok) {
        setMessage("✅ 设置已保存")
        fetchConfig()
        router.refresh()
      } else {
        setMessage("❌ 保存失败")
      }
    } catch {
      setMessage("❌ 保存失败")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-warm-800">⭐ 积分规则</h1>
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-warm-800">⭐ 积分规则设置</h1>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-card p-6 space-y-6">
        {message && (
          <div className={cn(
            "text-sm rounded-xl p-3",
            message.startsWith("✅") ? "bg-candy-green/10 text-candy-green" : "bg-candy-red/10 text-candy-red"
          )}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-warm-50 rounded-xl">
            <div>
              <h3 className="font-semibold text-warm-800">周末双倍积分</h3>
              <p className="text-sm text-warm-400 mt-0.5">周六、日完成任务获得双倍积分</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="weekendDouble"
                value="true"
                defaultChecked={config?.weekendDouble}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-warm-200 rounded-full peer-checked:bg-candy-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-warm-50 rounded-xl">
            <div>
              <h3 className="font-semibold text-warm-800">生日三倍积分</h3>
              <p className="text-sm text-warm-400 mt-0.5">小朋友生日当天完成任务获得三倍积分</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="birthdayTriple"
                value="true"
                defaultChecked={config?.birthdayTriple}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-warm-200 rounded-full peer-checked:bg-candy-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-warm-50 rounded-xl">
            <div>
              <h3 className="font-semibold text-warm-800">积分重置模式</h3>
              <p className="text-sm text-warm-400 mt-0.5">积分清零周期设置</p>
            </div>
            <select
              name="resetType"
              defaultValue={config?.resetType || "NONE"}
              className="h-9 px-3 rounded-lg border border-warm-200 text-sm"
            >
              <option value="NONE">不重置</option>
              <option value="MONTHLY">每月清零</option>
              <option value="YEARLY">每年清零</option>
              <option value="SEMESTER">每学期清零</option>
            </select>
          </div>

          <div className="p-4 bg-warm-50 rounded-xl">
            <h3 className="font-semibold text-warm-800 mb-2">每日积分上限</h3>
            <p className="text-sm text-warm-400 mb-3">每天最多可以获得的积分 (0=不限)</p>
            <input
              type="number"
              name="dailyCap"
              defaultValue={config?.dailyCap || 0}
              min={0}
              className="w-24 h-9 px-3 rounded-lg border border-warm-200 text-sm"
            />
            <span className="text-sm text-warm-400 ml-2">⭐ 积分</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="h-11 px-8 bg-admin-primary text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存设置"}
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
        <h2 className="font-semibold text-warm-700">📖 积分规则说明</h2>
        <div className="space-y-3 text-sm text-warm-500">
          <p>🌟 <strong>基础积分</strong>：每完成一个任务获得对应的基础积分</p>
          <p>🔥 <strong>连续奖励</strong>：连续完成任务天数达到条件后，额外获得奖励积分</p>
          <p>🎉 <strong>周末双倍</strong>：周六日完成任务时，基础积分翻倍</p>
          <p>🎂 <strong>生日三倍</strong>：小朋友生日当天，基础积分三倍</p>
          <p>⚠️ <strong>每日上限</strong>：每天获得的积分不超过设定上限</p>
        </div>
      </div>
    </div>
  )
}

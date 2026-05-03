"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/PageTransition"
import { CardSkeleton } from "@/components/ui/Skeleton"

type AchievementData = {
  id: string
  name: string
  description: string | null
  icon: string
  category: string
  bonusPoints: number
  isHidden: boolean
  unlocked: boolean
  unlockedAt: string | null
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  LABOR: { label: "劳动", color: "text-candy-green", bg: "bg-green-50" },
  HABIT: { label: "习惯", color: "text-candy-blue", bg: "bg-blue-50" },
  STUDY: { label: "学习", color: "text-candy-purple", bg: "bg-purple-50" },
  EXERCISE: { label: "运动", color: "text-candy-orange", bg: "bg-orange-50" },
  SOCIAL: { label: "社交", color: "text-candy-pink", bg: "bg-pink-50" },
  REDEMPTION: { label: "兑换", color: "text-brand-500", bg: "bg-brand-50" },
  SPECIAL: { label: "特殊", color: "text-candy-red", bg: "bg-red-50" },
}

export default function KidsAchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementData[]>([])
  const [stats, setStats] = useState({ totalCount: 0, unlockedCount: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("ALL")
  const [confetti, setConfetti] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/kids/achievements")
      if (res.ok) {
        const data = await res.json()
        setAchievements(data.achievements || [])
        setStats(data.stats || { totalCount: 0, unlockedCount: 0 })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const visible = achievements.filter((a) => filter === "ALL" || a.category === filter)
  const filtered = visible.filter((a) => !a.isHidden || a.unlocked)
  const unlocked = filtered.filter((a) => a.unlocked)
  const locked = filtered.filter((a) => !a.unlocked)

  const categories = [
    "ALL",
    ...Array.from(new Set(achievements.map((a) => a.category))),
  ]

  return (
    <PageTransition className="p-5 space-y-5">
      <h1 className="font-kids text-3xl text-candy-purple pt-4">🏆 我的成就</h1>

      <div className="bg-white rounded-card shadow-soft p-5">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "text-5xl cursor-pointer transition-all hover:scale-110",
              confetti && "animate-bounce"
            )}
            onClick={() => {
              setConfetti(true)
              setTimeout(() => setConfetti(false), 1000)
            }}
          >
            🏆
          </div>
          <div>
            <p className="text-sm text-warm-400">徽章收集</p>
            <p className="font-kids text-3xl text-brand-500">
              {stats.unlockedCount}
              <span className="text-xl text-warm-300">/{stats.totalCount}</span>
            </p>
          </div>
          <div className="flex-1">
            <div className="h-3 bg-warm-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-candy-pink via-brand-500 to-candy-green rounded-full transition-all duration-1000"
                style={{
                  width: `${stats.totalCount > 0 ? Math.round((stats.unlockedCount / stats.totalCount) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
              filter === cat
                ? "bg-candy-purple text-white"
                : "bg-warm-100 text-warm-500 hover:bg-warm-200"
            )}
          >
            {cat === "ALL" ? "全部" : CATEGORY_LABELS[cat]?.label || cat}
          </button>
        ))}
      </div>

      {loading ? (
        <CardSkeleton />
      ) : (
        <div className="space-y-6">
          {unlocked.length > 0 && (
            <div>
              <h2 className="font-kids text-lg text-candy-green mb-3">
                ✅ 已解锁 ({unlocked.length})
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {unlocked.map((ach) => (
                  <div
                    key={ach.id}
                    className="bg-white rounded-card shadow-soft p-3 text-center space-y-1 hover:scale-105 transition-transform"
                  >
                    <div className="text-3xl">{ach.icon}</div>
                    <p className="text-xs font-semibold text-warm-700">{ach.name}</p>
                    <p className="text-xs text-candy-orange">+{ach.bonusPoints}⭐</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {locked.length > 0 && (
            <div>
              <h2 className="font-kids text-lg text-warm-400 mb-3">
                🔒 未解锁 ({locked.length})
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {locked.map((ach) => (
                  <div
                    key={ach.id}
                    className="bg-warm-50 rounded-card p-3 text-center space-y-1 opacity-50"
                  >
                    <div className="text-2xl grayscale">{ach.isHidden ? "❓" : ach.icon}</div>
                    <p className="text-xs text-warm-400">
                      {ach.isHidden ? "???" : ach.name}
                    </p>
                    {!ach.isHidden && (
                      <p className="text-xs text-warm-300">+{ach.bonusPoints}⭐</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-warm-400">
              <p className="text-4xl mb-2">🏆</p>
              <p>该分类暂无成就</p>
            </div>
          )}
        </div>
      )}
    </PageTransition>
  )
}

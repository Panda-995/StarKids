"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { SPECIES_EMOJI, STAGE_LABELS } from "@/lib/constants"

type AnalyticsOverview = {
  totalTasksCompleted: number
  totalPointsEarned: number
  approvalRate: number
  pendingTasks: number
  pendingRedemptions: number
}

type MemberStat = {
  memberId: string
  nickname: string
  currentPoints: number
  pet: { species: string; stage: string; level: number } | null
  completed30d: number
  streak: number
}

type TaskData = {
  id: string
  name: string
  icon: string | null
  category: string
  points: number
  assignees: { id: string; nickname: string }[]
  completions: { member: { nickname: string }; status: string }[]
}

type PendingCompletion = {
  id: string
  date: string
  task: { name: string; icon: string | null; points: number }
  member: { nickname: string }
}

type DashboardData = {
  overview: AnalyticsOverview
  memberStats: MemberStat[]
  tasks: TaskData[]
  pending: PendingCompletion[]
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [analyticsRes, tasksRes] = await Promise.all([
        fetch("/api/admin/analytics"),
        fetch("/api/tasks"),
      ])

      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null
      const tasksData = tasksRes.ok ? await tasksRes.json() : null

      setData({
        overview: analyticsData?.overview || {
          totalTasksCompleted: 0, totalPointsEarned: 0, approvalRate: 0,
          pendingTasks: 0, pendingRedemptions: 0,
        },
        memberStats: analyticsData?.memberStats || [],
        tasks: tasksData?.tasks || [],
        pending: tasksData?.pending || [],
      })
    } catch {
      // keep defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-warm-800">📊 管理仪表盘</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-admin-card rounded-xl shadow-card p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-warm-200 rounded w-2/3" />
                <div className="h-7 bg-warm-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <CardSkeleton />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-warm-800">📊 管理仪表盘</h1>
        <div className="bg-admin-card rounded-xl shadow-card p-10 text-center">
          <p className="text-4xl mb-3">😵</p>
          <p className="text-sm text-warm-400">数据加载失败，请刷新重试</p>
        </div>
      </div>
    )
  }

  const { overview, memberStats, tasks, pending } = data
  const memberCount = memberStats.length
  const activeTaskCount = tasks.length
  const recentTasks = tasks.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-warm-800">📊 管理仪表盘</h1>
        <Link
          href="/admin/analytics"
          className="text-sm text-admin-primary hover:underline"
        >
          查看详细分析 →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "小朋友", value: memberCount, icon: "👨‍👩‍👧‍👦", suffix: "位", color: "bg-blue-50 text-blue-600" },
          { label: "活跃任务", value: activeTaskCount, icon: "📋", suffix: "个", color: "bg-green-50 text-green-600" },
          { label: "待审核", value: overview.pendingTasks, icon: "⏳", suffix: "个", color: "bg-orange-50 text-orange-600" },
          { label: "累计积分", value: overview.totalPointsEarned, icon: "💫", suffix: "⭐", color: "bg-purple-50 text-purple-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-admin-card rounded-xl shadow-card p-5">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl", stat.color)}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-warm-400">{stat.label}</p>
                <p className="text-2xl font-bold text-warm-800">
                  {stat.value}
                  <span className="text-sm font-normal text-warm-400 ml-0.5">{stat.suffix}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-admin-card rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-warm-700">📋 近期任务</h2>
            <Link href="/admin/tasks" className="text-xs text-admin-primary hover:underline">
              管理任务 →
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-warm-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">还没有创建任务</p>
              <Link href="/admin/tasks" className="text-xs text-admin-primary hover:underline mt-1 inline-block">
                去创建第一个 →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-warm-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{task.icon || "📌"}</span>
                    <div>
                      <p className="font-medium text-sm text-warm-700">{task.name}</p>
                      <p className="text-xs text-warm-400">
                        +{task.points}⭐
                        {task.assignees.length > 0 && (
                          <span> · {task.assignees.map((a) => a.nickname).join(", ")}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pending.length > 0 && (
            <div className="mt-4 pt-3 border-t border-candy-orange/30">
              <Link href="/admin/tasks" className="flex items-center justify-between p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-candy-orange">⏳ {pending.length} 个待审核任务</p>
                  <p className="text-xs text-warm-400 mt-0.5">
                    最近: {pending[0]?.member.nickname} · {pending[0]?.task.name}
                  </p>
                </div>
                <span className="text-candy-orange">→</span>
              </Link>
            </div>
          )}
        </div>

        <div className="bg-admin-card rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-warm-700">🐱 小朋友与宠物</h2>
            <Link href="/admin/pets" className="text-xs text-admin-primary hover:underline">
              管理装扮 →
            </Link>
          </div>
          {memberStats.length === 0 ? (
            <div className="text-center py-8 text-warm-400">
              <p className="text-3xl mb-2">👶</p>
              <p className="text-sm">还没有小朋友加入</p>
            </div>
          ) : (
            <div className="space-y-3">
              {memberStats.map((m) => (
                <div key={m.memberId} className="bg-warm-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {m.pet?.species ? SPECIES_EMOJI[m.pet.species] || "🐱" : "👶"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-warm-700">{m.nickname}</p>
                        {m.streak > 0 && (
                          <span className="text-xs text-candy-orange">🔥{m.streak}天</span>
                        )}
                      </div>
                      <p className="text-xs text-warm-400 mt-0.5">
                        {m.pet ? `${STAGE_LABELS[m.pet.stage] || m.pet.stage}` : "暂无宠物"}
                        {" · "}
                        <span className="text-brand-500">{m.currentPoints || 0}⭐</span>
                        {" · 本月完成"}
                        <span className="text-candy-green">{m.completed30d || 0}个</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {overview.approvalRate > 0 && (
            <div className="mt-4 pt-3">
              <div className="flex items-center justify-between text-xs text-warm-400 mb-1">
                <span>整体通过率</span>
                <span>{overview.approvalRate}%</span>
              </div>
              <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    overview.approvalRate >= 80 ? "bg-candy-green" : overview.approvalRate >= 50 ? "bg-brand-500" : "bg-candy-orange"
                  )}
                  style={{ width: `${overview.approvalRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

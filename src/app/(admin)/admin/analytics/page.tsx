"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { SPECIES_EMOJI, STAGE_LABELS } from "@/lib/constants"
import { CardSkeleton } from "@/components/ui/Skeleton"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts"

const CATEGORY_CHART_CONFIG: Record<string, { label: string; color: string }> = {
  HOUSEWORK: { label: "家务", color: "#6BCB77" },
  HABIT: { label: "习惯", color: "#4D96FF" },
  STUDY: { label: "学习", color: "#9B59B6" },
  EXERCISE: { label: "运动", color: "#FF8C42" },
  SOCIAL: { label: "社交", color: "#FF6B8A" },
  CREATIVE: { label: "创意", color: "#FFE066" },
  REDEMPTION: { label: "兑换", color: "#FFD93D" },
  OTHER: { label: "其他", color: "#A0A0A0" },
  SPECIAL: { label: "特殊", color: "#E74C3C" },
  LABOR: { label: "劳动", color: "#6BCB77" },
}

type DailyStat = { date: string; completed: number; points: number }
type MemberStat = {
  memberId: string
  nickname: string
  currentPoints: number
  pet: { species: string; stage: string; level: number } | null
  completed30d: number
  total30d: number
  approvalRate: number
  pointsEarned30d: number
  streak: number
  categories: Record<string, number>
}
type PointTrend = { date: string; points: number }
type CategoryData = { name: string; value: number }

type AnalyticsData = {
  overview: { totalTasksCompleted: number; totalPointsEarned: number; approvalRate: number; pendingTasks: number; pendingRedemptions: number }
  daily: DailyStat[]
  memberStats: MemberStat[]
  pointsTrend: PointTrend[]
  categories: CategoryData[]
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [noFamily, setNoFamily] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string>("ALL")

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics")
      if (res.ok) {
        setData(await res.json())
      } else if (res.status === 404) {
        setNoFamily(true)
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

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-warm-800">📈 统计分析</h1>
        <CardSkeleton />
      </div>
    )
  }

  if (noFamily) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-warm-800">📈 统计分析</h1>
        <div className="bg-admin-card rounded-xl shadow-card p-10 text-center">
          <p className="text-5xl mb-4">📊</p>
          <h2 className="text-lg font-semibold text-warm-700 mb-2">还没有家庭数据</h2>
          <p className="text-sm text-warm-400">
            创建家庭并添加小朋友后，可以在此查看统计数据
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-warm-800">📈 统计分析</h1>
        <div className="bg-admin-card rounded-xl shadow-card p-10 text-center">
          <p className="text-4xl mb-3">😵</p>
          <p className="text-sm text-warm-400">数据加载失败，请刷新重试</p>
        </div>
      </div>
    )
  }

  const { overview, daily, memberStats, pointsTrend, categories } = data

  const categoryChartData = categories.map((c) => ({
    name: CATEGORY_CHART_CONFIG[c.name]?.label || c.name,
    value: c.value,
    color: CATEGORY_CHART_CONFIG[c.name]?.color || "#A0A0A0",
  }))

  const dailyChartData = daily.map((d) => ({
    date: d.date.slice(5),
    points: d.points,
    completed: d.completed,
  }))

  const trendChartData = pointsTrend.map((p) => ({
    date: p.date.slice(5),
    points: p.points,
  }))

  const filteredMembers = selectedMember === "ALL"
    ? memberStats
    : memberStats.filter((m) => m.memberId === selectedMember)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-800">📈 统计分析</h1>
          <p className="text-sm text-warm-400 mt-1">过去30天的数据总览</p>
        </div>
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="h-10 px-3 rounded-xl border border-warm-200 text-sm text-warm-700 focus:border-admin-primary focus:outline-none"
        >
          <option value="ALL">全部小朋友</option>
          {memberStats.map((m) => (
            <option key={m.memberId} value={m.memberId}>{m.nickname}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <OverviewCard
          icon="✅"
          label="完成任务"
          value={overview.totalTasksCompleted}
          unit="个"
          color="bg-candy-green/10 text-candy-green"
        />
        <OverviewCard
          icon="⭐"
          label="获得积分"
          value={overview.totalPointsEarned}
          unit=""
          color="bg-brand-100 text-brand-500"
        />
        <OverviewCard
          icon="📊"
          label="通过率"
          value={overview.approvalRate}
          unit="%"
          color="bg-candy-blue/10 text-candy-blue"
        />
        <OverviewCard
          icon="⏳"
          label="待审核"
          value={overview.pendingTasks}
          unit="个"
          color="bg-candy-orange/10 text-candy-orange"
        />
        <OverviewCard
          icon="🎁"
          label="待兑现"
          value={overview.pendingRedemptions}
          unit="个"
          color="bg-candy-purple/10 text-candy-purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-warm-800 mb-4">📅 每日积分趋势（近7天）</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9B8E7A" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9B8E7A" }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #f0ebe3", fontSize: 13 }}
                formatter={(value: any, name: any) => [`${value}${name === "points" ? "⭐" : "个"}`, name === "points" ? "积分" : "完成数"]}
              />
              <Bar dataKey="points" fill="#FFE066" radius={[6, 6, 0, 0]} name="points" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-warm-800 mb-4">📈 30天积分趋势</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9B8E7A" }} interval={4} />
              <YAxis tick={{ fontSize: 12, fill: "#9B8E7A" }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #f0ebe3", fontSize: 13 }}
                formatter={(value: any) => [`${value}⭐`, "积分"]}
              />
              <Line
                type="monotone"
                dataKey="points"
                stroke="#4D96FF"
                strokeWidth={2}
                dot={false}
                name="points"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-warm-800 mb-4">🎯 任务分类分布</h2>
          {categoryChartData.length === 0 ? (
            <p className="text-sm text-warm-400 text-center py-8">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #f0ebe3", fontSize: 13 }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <h2 className="font-semibold text-warm-800 mb-4">👶 小朋友概览</h2>
          <div className="space-y-3">
            {filteredMembers.map((m) => (
              <div key={m.memberId} className="flex items-center gap-4 p-3 bg-warm-50 rounded-xl">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg">{m.pet?.species ? SPECIES_EMOJI[m.pet.species] || "🐱" : "👶"}</span>
                  <div>
                    <p className="text-sm font-semibold text-warm-700">{m.nickname}</p>
                    <p className="text-xs text-warm-400">
                      {m.pet ? `${STAGE_LABELS[m.pet.stage] || m.pet.stage}` : "暂无宠物"}
                      {m.streak > 0 && ` · 🔥${m.streak}天`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-500">{m.pointsEarned30d}⭐</p>
                  <p className="text-xs text-warm-400">{m.completed30d}个任务</p>
                </div>
                <div className="w-16">
                  <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        m.approvalRate >= 80 ? "bg-candy-green" : m.approvalRate >= 50 ? "bg-brand-500" : "bg-candy-orange"
                      )}
                      style={{ width: `${m.approvalRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-warm-400 text-center mt-0.5">{m.approvalRate}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewCard({
  icon, label, value, unit, color,
}: {
  icon: string; label: string; value: number; unit: string; color: string
}) {
  return (
    <div className={cn("rounded-xl p-4 space-y-2", color.split(" ")[0])}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className={cn("text-xs font-medium", color.split(" ")[1])}>{label}</span>
      </div>
      <p className={cn("text-2xl font-bold", color.split(" ")[1])}>
        {value}
        <span className="text-sm font-normal ml-0.5">{unit}</span>
      </p>
    </div>
  )
}

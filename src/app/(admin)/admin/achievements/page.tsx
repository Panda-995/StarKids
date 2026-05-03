"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createAchievement, updateAchievement, deleteAchievement, toggleAchievement } from "@/lib/actions/achievements"
import { cn } from "@/lib/utils"
import { CardSkeleton } from "@/components/ui/Skeleton"

const CATEGORIES = [
  { value: "LABOR", label: "劳动" },
  { value: "HABIT", label: "习惯" },
  { value: "STUDY", label: "学习" },
  { value: "EXERCISE", label: "运动" },
  { value: "SOCIAL", label: "社交" },
  { value: "REDEMPTION", label: "兑换" },
  { value: "SPECIAL", label: "特殊" },
]

const CONDITION_TYPES = [
  { value: "TASK_COUNT", label: "完成任务数量" },
  { value: "CONSECUTIVE_DAYS", label: "连续天数" },
  { value: "TOTAL_POINTS", label: "累计积分" },
  { value: "REDEMPTION_COUNT", label: "兑换次数" },
  { value: "STREAK", label: "连续打卡" },
  { value: "SPECIAL_DATE", label: "特殊日期" },
]

const CATEGORY_COLORS: Record<string, string> = {
  LABOR: "bg-green-100 text-green-700",
  HABIT: "bg-blue-100 text-blue-700",
  STUDY: "bg-purple-100 text-purple-700",
  EXERCISE: "bg-orange-100 text-orange-700",
  SOCIAL: "bg-pink-100 text-pink-700",
  REDEMPTION: "bg-brand-100 text-brand-700",
  SPECIAL: "bg-red-100 text-red-700",
}

type MemberInfo = {
  memberId: string
  nickname: string
  grantedAt: string | null
  isGranted: boolean
}

type AchievementData = {
  id: string
  name: string
  description: string | null
  icon: string
  category: string
  condition: any
  bonusPoints: number
  sortOrder: number
  isActive: boolean
  isHidden: boolean
  isGlobal: boolean
  members: MemberInfo[]
  grantedCount: number
}

export default function AdminAchievementsPage() {
  const router = useRouter()
  const [achievements, setAchievements] = useState<AchievementData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<AchievementData | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/achievements")
      if (res.ok) {
        const data = await res.json()
        setAchievements(data.achievements || [])
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

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)
    try {
      await createAchievement(formData)
      setShowForm(false)
      setEditItem(null)
      e.currentTarget.reset()
      fetchData()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)
    try {
      await updateAchievement(formData)
      setShowForm(false)
      setEditItem(null)
      fetchData()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定要删除这个成就吗？已获得的记录也会保留。")) return
    await deleteAchievement(id)
    fetchData()
    router.refresh()
  }

  async function handleToggle(id: string, isActive: boolean) {
    await toggleAchievement(id, !isActive)
    fetchData()
    router.refresh()
  }

  const kidCount = achievements[0]?.members?.length || 0

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-warm-800">🏆 成就管理</h1>
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-800">🏆 成就管理</h1>
          <p className="text-sm text-warm-400 mt-1">管理家庭成就和查看小朋友解锁情况</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditItem(null)
          }}
          className="h-10 px-5 bg-admin-primary text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
        >
          + 创建成就
        </button>
      </div>

      {showForm && (
        <AchievementForm
          onSubmit={editItem ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false)
            setEditItem(null)
          }}
          editItem={editItem}
          error={error}
        />
      )}

      <div className="space-y-4">
        {achievements.length === 0 ? (
          <div className="text-center py-12 text-warm-400">
            <p className="text-4xl mb-2">🏆</p>
            <p>还没有创建成就，快来创建第一个吧！</p>
          </div>
        ) : (
          achievements.map((ach) => (
            <div key={ach.id} className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{ach.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-warm-800">{ach.name}</h3>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", CATEGORY_COLORS[ach.category] || "bg-warm-100 text-warm-600")}>
                        {CATEGORIES.find((c) => c.value === ach.category)?.label}
                      </span>
                      {ach.isGlobal && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-admin-primary/10 text-admin-primary">全局</span>
                      )}
                      {ach.isHidden && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-warm-100 text-warm-500">隐藏</span>
                      )}
                      {!ach.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-warm-100 text-warm-400">已停用</span>
                      )}
                    </div>
                    {ach.description && (
                      <p className="text-sm text-warm-400 mt-1">{ach.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-sm text-warm-500">
                      <span>+{ach.bonusPoints}⭐</span>
                      <span>
                        {ach.grantedCount}/{kidCount} 已获得
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(ach.id, ach.isActive)}
                      className={cn(
                        "h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
                        ach.isActive
                          ? "text-candy-green hover:bg-candy-green/10"
                          : "text-warm-400 hover:bg-warm-100"
                      )}
                      title={ach.isActive ? "停用" : "启用"}
                    >
                      {ach.isActive ? "✅" : "⏸️"}
                    </button>
                    <button
                      onClick={() => {
                        setEditItem(ach)
                        setShowForm(true)
                      }}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-warm-400 hover:bg-admin-primary/10 hover:text-admin-primary transition-colors"
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(ach.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-warm-400 hover:bg-candy-red/10 hover:text-candy-red transition-colors"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              {ach.members.length > 0 && (
                <div className="border-t border-warm-100 px-5 py-3 bg-warm-50/50">
                  <p className="text-xs text-warm-400 mb-2">小朋友达成情况：</p>
                  <div className="flex flex-wrap gap-2">
                    {ach.members.map((m) => (
                      <span
                        key={m.memberId}
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          m.isGranted
                            ? "bg-candy-green/10 text-candy-green"
                            : "bg-warm-100 text-warm-400"
                        )}
                      >
                        {m.nickname} {m.isGranted ? "✅" : "❌"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function AchievementForm({
  onSubmit,
  onCancel,
  editItem,
  error,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  editItem?: AchievementData | null
  error?: string
}) {
  const cond = editItem?.condition || {}
  const [conditionType, setConditionType] = useState(cond?.type || "TASK_COUNT")

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-card p-5 space-y-4">
      <h3 className="font-semibold text-warm-700">{editItem ? "编辑成就" : "创建新成就"}</h3>

      {error && (
        <div className="bg-candy-red/10 text-candy-red text-sm rounded-xl p-3">{error}</div>
      )}

      {editItem && <input type="hidden" name="id" value={editItem.id} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-600 mb-1">成就名称 *</label>
          <input
            name="name"
            required
            defaultValue={editItem?.name || ""}
            placeholder="如：家务小能手"
            className="w-full h-10 px-3 rounded-lg border border-warm-200 text-sm focus:border-admin-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-600 mb-1">图标</label>
          <input
            name="icon"
            defaultValue={editItem?.icon || "🏆"}
            placeholder="emoji图标"
            className="w-full h-10 px-3 rounded-lg border border-warm-200 text-sm focus:border-admin-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-600 mb-1">分类</label>
          <select
            name="category"
            defaultValue={editItem?.category || "SPECIAL"}
            className="w-full h-10 px-3 rounded-lg border border-warm-200 text-sm focus:border-admin-primary focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-600 mb-1">奖励积分</label>
          <input
            name="bonusPoints"
            type="number"
            defaultValue={editItem?.bonusPoints || 0}
            min={0}
            className="w-full h-10 px-3 rounded-lg border border-warm-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-600 mb-1">触发条件类型</label>
          <select
            name="conditionType"
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-warm-200 text-sm focus:border-admin-primary focus:outline-none"
          >
            {CONDITION_TYPES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        {(conditionType === "TASK_COUNT" || conditionType === "STREAK" || conditionType === "REDEMPTION_COUNT") && (
          <div>
            <label className="block text-sm font-medium text-warm-600 mb-1">次数要求</label>
            <input
              name="conditionCount"
              type="number"
              defaultValue={cond?.count || 0}
              min={1}
              className="w-full h-10 px-3 rounded-lg border border-warm-200 text-sm"
            />
          </div>
        )}
        {(conditionType === "CONSECUTIVE_DAYS") && (
          <div>
            <label className="block text-sm font-medium text-warm-600 mb-1">连续天数</label>
            <input
              name="conditionDays"
              type="number"
              defaultValue={cond?.days || 0}
              min={1}
              className="w-full h-10 px-3 rounded-lg border border-warm-200 text-sm"
            />
          </div>
        )}
        {(conditionType === "TOTAL_POINTS") && (
          <div>
            <label className="block text-sm font-medium text-warm-600 mb-1">积分要求</label>
            <input
              name="conditionPoints"
              type="number"
              defaultValue={cond?.points || 0}
              min={0}
              className="w-full h-10 px-3 rounded-lg border border-warm-200 text-sm"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-warm-600 mb-1">限定分类 (可选)</label>
          <select
            name="conditionCategory"
            defaultValue={cond?.category || "ALL"}
            className="w-full h-10 px-3 rounded-lg border border-warm-200 text-sm focus:border-admin-primary focus:outline-none"
          >
            <option value="ALL">不限</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-warm-600 mb-1">描述</label>
          <input
            name="description"
            defaultValue={editItem?.description || ""}
            placeholder="成就描述..."
            className="w-full h-10 px-3 rounded-lg border border-warm-200 text-sm focus:border-admin-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isHidden"
            value="true"
            defaultChecked={editItem?.isHidden}
            className="rounded"
          />
          <span className="text-sm text-warm-600">隐藏成就 (达成前不显示)</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="h-10 px-5 bg-admin-primary text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
        >
          {editItem ? "保存修改" : "创建成就"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-5 bg-warm-100 text-warm-600 rounded-xl text-sm hover:bg-warm-200 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  )
}

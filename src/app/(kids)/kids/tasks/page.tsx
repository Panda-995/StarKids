"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { completeTask } from "@/lib/actions/tasks"
import { cn } from "@/lib/utils"
import { CATEGORY_LABELS } from "@/lib/constants"
import { useToast } from "@/components/ui/ToastProvider"
import { PageTransition } from "@/components/ui/PageTransition"
import { ListSkeleton } from "@/components/ui/Skeleton"

type KidTask = {
  id: string
  name: string
  icon: string | null
  points: number
  category: string
  difficulty: string
  description: string | null
  autoApprove: boolean
  completions: {
    id: string
    status: string
    pointsEarned: number
  }[]
}

export default function KidsTasksPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<KidTask[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/kids/tasks")
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  async function handleComplete(taskId: string) {
    setCompleting(taskId)
    try {
      await completeTask(taskId)
      fetchTasks()
      router.refresh()
      toast("任务完成！等待审核 ✨", "success")
    } catch (e: any) {
      toast(e.message || "提交失败", "error")
    } finally {
      setCompleting(null)
    }
  }

  const completedCount = tasks.filter(
    (t) => t.completions.some((c) => c.status === "APPROVED" || c.status === "PENDING")
  ).length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <PageTransition className="p-5 space-y-5">
      <h1 className="font-kids text-3xl text-candy-purple pt-4">📋 今日任务</h1>

      <div className="bg-white rounded-card shadow-soft p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-warm-500">
            今日进度 {completedCount}/{tasks.length}
          </span>
          <span className="text-candy-green font-semibold">{progress}%</span>
        </div>
        <div className="h-3 bg-warm-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-candy-green to-candy-blue rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-warm-400">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-lg">还没有任务哦～</p>
          <p className="text-sm mt-1">让爸爸妈妈给你分配任务吧！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const completion = task.completions[0]
            const isDone = completion && (completion.status === "APPROVED" || completion.status === "PENDING")
            const isRejected = completion?.status === "REJECTED"

            return (
              <div
                key={task.id}
                className={cn(
                  "bg-white rounded-card shadow-soft p-4 flex items-center gap-4 transition-all",
                  isDone && "opacity-70 bg-brand-50"
                )}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-warm-50">
                  {task.icon || "📌"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-semibold text-warm-800",
                    isDone && "line-through text-warm-400"
                  )}>
                    {task.name}
                  </h3>
                  {task.description && (
                    <p className="text-xs text-warm-400 truncate">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-candy-orange font-semibold">
                      +{task.points}⭐
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-warm-100 text-warm-500">
                      {CATEGORY_LABELS[task.category] || task.category}
                    </span>
                    {task.autoApprove && (
                      <span className="text-xs text-candy-green">自动</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleComplete(task.id)}
                  disabled={isDone || isRejected || completing === task.id}
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold transition-all",
                    isDone
                      ? "bg-candy-green text-white cursor-default"
                      : "bg-brand-100 text-brand-500 hover:bg-brand-200 active:scale-95",
                    completing === task.id && "animate-pulse"
                  )}
                >
                  {completing === task.id ? "⏳" : isDone ? "✅" : "✓"}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </PageTransition>
  )
}

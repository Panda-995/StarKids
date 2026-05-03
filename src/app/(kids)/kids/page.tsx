"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PageTransition } from "@/components/ui/PageTransition"
import { ProfileSkeleton, GridSkeleton } from "@/components/ui/Skeleton"

type KidTask = {
  id: string
  name: string
  icon: string | null
  points: number
  description: string | null
  completions: {
    id: string
    status: string
    pointsEarned: number
  }[]
}

type MemberInfo = {
  nickname: string
  role: string
  familyName: string
  currentPoints: number
  streak: number
}

export default function KidsHomePage() {
  const [tasks, setTasks] = useState<KidTask[]>([])
  const [member, setMember] = useState<MemberInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        const [tasksRes, memberRes] = await Promise.all([
          fetch("/api/kids/tasks"),
          fetch("/api/kids/me"),
        ])
        if (tasksRes.ok) {
          const data = await tasksRes.json()
          setTasks(data.tasks || [])
        } else if (tasksRes.status === 404) {
          setError("你还没有加入家庭，请先让家长邀请你加入家庭")
        }
        if (memberRes.ok) {
          const data = await memberRes.json()
          setMember(data)
        } else if (memberRes.status === 404) {
          setError("你还没有加入家庭，请先让家长邀请你加入家庭")
        }
      } catch (e) {
        console.error(e)
        setError("网络错误，请稍后再试")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const completedCount = tasks.filter(
    (t) => t.completions.some((c) => c.status === "APPROVED" || c.status === "PENDING")
  ).length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好"

  if (loading) {
    return (
      <PageTransition className="p-5 space-y-6">
        <header className="pt-4">
          <h1 className="font-kids text-3xl text-candy-purple">🌟 加载中...</h1>
        </header>
        <ProfileSkeleton />
        <GridSkeleton count={4} />
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition className="p-5 space-y-6">
        <header className="pt-4">
          <h1 className="font-kids text-3xl text-candy-purple">🌟 小朋友乐园</h1>
        </header>
        <div className="bg-white rounded-card shadow-soft p-8 text-center space-y-4">
          <div className="text-5xl">🔑</div>
          <p className="text-warm-500 text-base">{error}</p>
          <a
            href="/register"
            className="inline-block px-6 py-3 bg-candy-green text-white font-bold font-kids rounded-btn hover:brightness-110 transition-all"
          >
            🚀 去加入家庭
          </a>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="p-5 space-y-6">
      <header className="pt-4">
        <h1 className="font-kids text-3xl text-candy-purple">
          🌟 {greeting}{member?.nickname ? `，${member.nickname}` : ""}！
        </h1>
        <p className="text-warm-400 text-sm mt-1">
          🐱 小狐狸说: &ldquo;今天也要加油哦！&rdquo;
        </p>
      </header>

      <div className="bg-white rounded-card shadow-soft p-5 space-y-4">
        <div className="text-center">
          <p className="text-warm-400 text-sm">💫 当前积分</p>
          <p className="font-kids text-5xl text-brand-500">{member?.currentPoints || 0} ⭐</p>
        </div>

        <div className="flex gap-3 justify-center">
          {[
            { label: "今日任务", value: `${completedCount}/${tasks.length}`, sub: "个" },
            { label: "连续天数", value: `🔥${member?.streak || 0}`, sub: "天" },
            { label: "进度", value: `${progress}`, sub: "%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 bg-warm-50 rounded-xl p-3 text-center"
            >
              <div className="text-2xl">{stat.value}</div>
              <div className="text-xs text-warm-400 mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-card shadow-soft p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-kids text-xl text-warm-700">📋 今天的任务</h2>
          <Link href="/kids/tasks" className="text-xs text-candy-blue hover:underline">
            查看全部 →
          </Link>
        </div>

        {tasks.length === 0 ? (
          <p className="text-center text-warm-400 py-4">还没有任务，让爸爸妈妈给你分配吧！</p>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => {
              const completion = task.completions[0]
              const isDone = completion && (completion.status === "APPROVED" || completion.status === "PENDING")

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2 px-3 bg-warm-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {isDone ? "✅" : task.icon || "�"}
                    </span>
                    <span className={isDone ? "text-warm-400 line-through text-sm" : "text-warm-700 text-sm"}>
                      {task.name}
                    </span>
                  </div>
                  <span className={`font-semibold text-sm ${isDone ? "text-candy-green" : "text-candy-orange"}`}>
                    +{task.points}⭐
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {tasks.length > 0 && (
          <div className="bg-brand-50 rounded-xl p-3">
            <div className="flex justify-between text-xs text-warm-500 mb-1">
              <span>今日进度 {completedCount}/{tasks.length}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-candy-green to-candy-blue rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/kids/shop" className="bg-white rounded-card shadow-soft p-4 hover:scale-[1.02] transition-transform">
          <div className="text-3xl mb-2">🛒</div>
          <h3 className="font-kids text-base text-warm-700">积分商城</h3>
          <p className="text-xs text-warm-400 mt-1">兑换喜欢的奖励</p>
        </Link>
        <Link href="/kids/achievements" className="bg-white rounded-card shadow-soft p-4 hover:scale-[1.02] transition-transform">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-kids text-base text-warm-700">我的成就</h3>
          <p className="text-xs text-warm-400 mt-1">收集闪亮徽章</p>
        </Link>
        <Link href="/kids/pet" className="bg-white rounded-card shadow-soft p-4 hover:scale-[1.02] transition-transform">
          <div className="text-3xl mb-2">🐱</div>
          <h3 className="font-kids text-base text-warm-700">虚拟宠物</h3>
          <p className="text-xs text-warm-400 mt-1">照顾你的小伙伴</p>
        </Link>
      </div>
    </PageTransition>
  )
}

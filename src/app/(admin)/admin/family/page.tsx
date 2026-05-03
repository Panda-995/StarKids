"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SPECIES_EMOJI, STAGE_LABELS } from "@/lib/constants"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { useToast } from "@/components/ui/ToastProvider"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

type FamilyMember = {
  id: string
  nickname: string
  role: string
  userId: string
  createdAt: string
  currentPoints: number
  pet: { name: string; species: string; stage: string } | null
}

type FamilyData = {
  name: string
  inviteCode: string
  createdAt: string
  members: FamilyMember[]
}

const ROLE_LABELS: Record<string, string> = {
  PARENT: "👑 家长",
  KID: "🌟 小朋友",
}

const addKidSchema = z.object({
  nickname: z.string().min(2, "昵称至少2个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6位"),
})

type AddKidValues = z.infer<typeof addKidSchema>

export default function AdminFamilyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<FamilyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [noFamily, setNoFamily] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAddKid, setShowAddKid] = useState(false)
  const [addingKid, setAddingKid] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddKidValues>({
    resolver: zodResolver(addKidSchema),
  })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/family/members")
      if (res.ok) {
        setData(await res.json())
      } else if (res.status === 404) {
        setNoFamily(true)
      }
    } catch {
      // keep empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function copyInviteCode() {
    if (!data?.inviteCode) return
    try {
      await navigator.clipboard.writeText(data.inviteCode)
      setCopied(true)
      toast("邀请码已复制！", "success")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast("复制失败，请手动复制", "error")
    }
  }

  async function onAddKid(values: AddKidValues) {
    setAddingKid(true)
    try {
      const fd = new FormData()
      fd.append("nickname", values.nickname)
      fd.append("email", values.email)
      fd.append("password", values.password)

      const res = await fetch("/api/family/add-kid", {
        method: "POST",
        body: fd,
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast(`小朋友「${json.kidNickname}」已加入家庭！`, "success")
        setShowAddKid(false)
        reset()
        fetchData()
      } else {
        toast(json.error || "添加失败", "error")
      }
    } catch {
      toast("网络错误，请稍后重试", "error")
    } finally {
      setAddingKid(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-warm-800">👨‍👩‍👧‍👦 家庭成员</h1>
        <CardSkeleton />
      </div>
    )
  }

  if (noFamily) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-warm-800">👨‍👩‍👧‍👦 家庭成员</h1>
        <div className="bg-admin-card rounded-xl shadow-card p-10 text-center">
          <p className="text-5xl mb-4">🏡</p>
          <h2 className="text-lg font-semibold text-warm-700 mb-2">还没有创建家庭</h2>
          <p className="text-sm text-warm-400 mb-6">
            创建一个家庭来邀请小朋友，开始游戏化教育之旅
          </p>
          <button
            onClick={() => router.push("/register")}
            className="inline-flex items-center gap-2 h-12 px-6 bg-candy-blue text-white font-bold font-kids rounded-btn hover:brightness-110 transition-all"
          >
            ✨ 创建家庭
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-warm-800">👨‍👩‍👧‍👦 家庭成员</h1>
        <div className="bg-admin-card rounded-xl shadow-card p-10 text-center">
          <p className="text-4xl mb-3">😵</p>
          <p className="text-sm text-warm-400">加载失败，请刷新重试</p>
        </div>
      </div>
    )
  }

  const parents = data.members.filter((m) => m.role === "PARENT")
  const kids = data.members.filter((m) => m.role === "KID")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-800">👨‍👩‍👧‍👦 家庭成员</h1>
          <p className="text-sm text-warm-400 mt-1">
            {data.name} · {data.members.length} 位成员
          </p>
        </div>
        <button
          onClick={() => setShowAddKid(true)}
          className="flex items-center gap-2 h-10 px-4 bg-candy-green text-white font-semibold text-sm rounded-xl hover:brightness-110 transition-all"
        >
          <span>➕</span>
          <span>添加小朋友</span>
        </button>
      </div>

      {showAddKid && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-kids text-xl text-warm-700">➕ 添加小朋友</h3>
              <button
                onClick={() => { setShowAddKid(false); reset() }}
                className="text-warm-400 hover:text-warm-600 text-xl"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-warm-400">
              为小朋友创建独立账号，直接加入当前家庭。小朋友可以使用该账号登录。
            </p>
            <form onSubmit={handleSubmit(onAddKid)} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-warm-600 mb-1">昵称</label>
                <input
                  {...register("nickname")}
                  placeholder="如：朵朵、小明"
                  className="w-full h-11 px-3 rounded-xl border border-warm-200 bg-warm-50 text-warm-700 text-sm focus:border-candy-green focus:outline-none"
                />
                {errors.nickname && <p className="text-candy-red text-xs mt-1">{errors.nickname.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-600 mb-1">电子邮箱</label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="小朋友的登录邮箱"
                  className="w-full h-11 px-3 rounded-xl border border-warm-200 bg-warm-50 text-warm-700 text-sm focus:border-candy-green focus:outline-none"
                />
                {errors.email && <p className="text-candy-red text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-600 mb-1">登录密码</label>
                <input
                  type="password"
                  {...register("password")}
                  placeholder="至少6位密码"
                  className="w-full h-11 px-3 rounded-xl border border-warm-200 bg-warm-50 text-warm-700 text-sm focus:border-candy-green focus:outline-none"
                />
                {errors.password && <p className="text-candy-red text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddKid(false); reset() }}
                  className="flex-1 h-11 rounded-xl border border-warm-200 text-warm-600 font-semibold text-sm hover:bg-warm-100 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={addingKid}
                  className="flex-1 h-11 bg-candy-green text-white font-bold font-kids text-sm rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {addingKid ? "添加中..." : "✅ 添加小朋友"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-warm-400 uppercase tracking-wide">邀请码</p>
          <p className="font-mono text-xl font-bold text-admin-primary tracking-widest mt-0.5">
            {data.inviteCode}
          </p>
        </div>
        <button
          onClick={copyInviteCode}
          className={cn(
            "h-10 px-5 rounded-xl text-sm font-semibold transition-all",
            copied
              ? "bg-candy-green text-white"
              : "bg-admin-primary text-white hover:brightness-110"
          )}
        >
          {copied ? "✅ 已复制" : "📋 复制"}
        </button>
      </div>

      {parents.length > 0 && (
        <div>
          <h2 className="font-semibold text-warm-700 mb-3">👑 家长 ({parents.length})</h2>
          <div className="space-y-2">
            {parents.map((m) => (
              <div key={m.id} className="bg-white rounded-xl shadow-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl">
                  👑
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-warm-700">{m.nickname}</p>
                  <p className="text-xs text-warm-400">
                    加入于 {new Date(m.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {kids.length > 0 && (
        <div>
          <h2 className="font-semibold text-warm-700 mb-3">🌟 小朋友 ({kids.length})</h2>
          <div className="space-y-2">
            {kids.map((m) => (
              <div key={m.id} className="bg-white rounded-xl shadow-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-2xl">
                  {m.pet?.species ? SPECIES_EMOJI[m.pet.species] || "🌟" : "🌟"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-warm-700">{m.nickname}</p>
                  <p className="text-xs text-warm-400">
                    {m.pet
                      ? `${m.pet.name} · ${STAGE_LABELS[m.pet.stage] || m.pet.stage}`
                      : "暂无宠物"}
                    {" · "}
                    <span className="text-brand-500">{m.currentPoints}⭐</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-kids text-candy-orange">{m.currentPoints || 0}⭐</p>
                  <p className="text-xs text-warm-400">当前积分</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.members.length === 0 && (
        <div className="text-center py-12 text-warm-400">
          <p className="text-4xl mb-2">👨‍👩‍👧‍👦</p>
          <p>还没有家庭成员</p>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { redeemReward } from "@/lib/actions/shop"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/ToastProvider"
import { PageTransition } from "@/components/ui/PageTransition"
import { GridSkeleton } from "@/components/ui/Skeleton"

type RewardData = {
  id: string
  name: string
  description: string | null
  points: number
  category: string
  isFeatured: boolean
  remainingStock: number
  stock: number
  maxPerPerson: number
  cooldownDays: number
}

const CATEGORY_ICONS: Record<string, string> = {
  TOY: "🧸", SNACK: "🍬", PRIVILEGE: "👑",
  EXPERIENCE: "🎡", MONEY: "💰", DIGITAL: "🎵", OTHER: "📦",
}

export default function KidsShopPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [rewards, setRewards] = useState<RewardData[]>([])
  const [balance, setBalance] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [showMessageInput, setShowMessageInput] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [animateJar, setAnimateJar] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/kids/shop")
      if (res.ok) {
        const data = await res.json()
        setRewards(data.rewards || [])
        setBalance(data.balance || 0)
        setTotalEarned(data.totalEarned || 0)
        setAnimateJar(true)
        setTimeout(() => setAnimateJar(false), 1000)
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

  async function handleRedeem(rewardId: string) {
    setRedeeming(rewardId)
    try {
      await redeemReward(rewardId, message || undefined)
      setShowMessageInput(null)
      setMessage("")
      fetchData()
      router.refresh()
      toast("兑换申请已提交！等待家长审核 🎉", "success")
    } catch (e: any) {
      toast(e.message || "兑换失败", "error")
    } finally {
      setRedeeming(null)
    }
  }

  const jarFillPercent = Math.min(100, Math.round((balance / 1000) * 100))
  const jarHeight = Math.min(100, Math.max(8, jarFillPercent))

  return (
    <PageTransition className="p-5 space-y-5">
      <h1 className="font-kids text-3xl text-candy-purple pt-4">🛒 积分商城</h1>

      <div className="bg-white rounded-card shadow-soft p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-24">
            <svg viewBox="0 0 60 80" className="w-full h-full">
              <path
                d="M10 25 L10 15 Q10 5 30 5 Q50 5 50 15 L50 25 L55 70 Q56 75 50 75 L10 75 Q4 75 5 70 Z"
                fill="#F5F5F0"
                stroke="#D0D0C5"
                strokeWidth="2"
              />
              <rect
                x="11"
                y={78 - jarHeight * 0.7}
                width="38"
                height={jarHeight * 0.7}
                rx="2"
                fill="#FFE066"
                className={cn("transition-all duration-700", animateJar && "animate-pulse")}
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-warm-400">💰 我的积分</p>
            <p className={cn(
              "font-kids text-4xl text-brand-500 transition-all",
              animateJar && "scale-110"
            )}>
              {balance} ⭐
            </p>
            <p className="text-xs text-warm-400 mt-0.5">
              累计获得 {totalEarned}⭐
            </p>
          </div>
        </div>
      </div>

      {rewards.filter((r) => r.isFeatured).length > 0 && (
        <div>
          <h2 className="font-kids text-lg text-warm-700 mb-3">⭐ 推荐商品</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {rewards.filter((r) => r.isFeatured).map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                balance={balance}
                onRedeem={handleRedeem}
                redeeming={redeeming}
                showInput={showMessageInput === reward.id}
                onShowInput={() => {
                  setShowMessageInput(reward.id)
                  setMessage("")
                }}
                compact
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-kids text-lg text-warm-700 mb-3">🏪 全部商品</h2>
        {loading ? (
        <GridSkeleton count={4} />
      ) : rewards.length === 0 ? (
          <div className="text-center py-12 text-warm-400">
            <p className="text-4xl mb-2">🛒</p>
            <p>商城还没上架商品，让爸爸妈妈来添加吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                balance={balance}
                onRedeem={handleRedeem}
                redeeming={redeeming}
                showInput={showMessageInput === reward.id}
                onShowInput={() => {
                  setShowMessageInput(reward.id)
                  setMessage("")
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showMessageInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowMessageInput(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-lg space-y-4 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-kids text-lg text-warm-700">✍️ 给爸爸妈妈留言</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="写点什么吧...（选填）"
              className="w-full p-3 rounded-xl border border-warm-200 text-sm min-h-[80px] resize-none focus:border-candy-blue focus:outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleRedeem(showMessageInput)
                }}
                className="flex-1 h-12 bg-candy-blue text-white font-kids rounded-btn font-bold hover:brightness-110"
              >
                🚀 确认兑换
              </button>
              <button
                onClick={() => setShowMessageInput(null)}
                className="flex-1 h-12 bg-warm-100 text-warm-600 rounded-xl font-semibold"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  )
}

function RewardCard({
  reward,
  balance,
  onRedeem,
  redeeming,
  showInput,
  onShowInput,
  compact = false,
}: {
  reward: RewardData
  balance: number
  onRedeem: (id: string) => void
  redeeming: string | null
  showInput: boolean
  onShowInput: () => void
  compact?: boolean
}) {
  const canAfford = balance >= reward.points
  const isOutOfStock = reward.stock > 0 && reward.remainingStock <= 0

  return (
    <div className={cn(
      "bg-white rounded-card shadow-soft p-4 space-y-3",
      compact && "min-w-[160px] max-w-[160px] flex-shrink-0"
    )}>
      <div className="text-center">
        <div className="text-3xl mb-2">
          {CATEGORY_ICONS[reward.category] || "🎁"}
        </div>
        <h3 className="font-semibold text-sm text-warm-800">{reward.name}</h3>
      </div>

      <div className="text-center">
        <p className="font-kids text-lg text-candy-orange">{reward.points} ⭐</p>
        {reward.stock > 0 && (
          <p className="text-xs text-warm-400 mt-0.5">
            剩余 {reward.remainingStock}/{reward.stock}
          </p>
        )}
      </div>

      <button
        onClick={() => {
          if (canAfford && !isOutOfStock) {
            onShowInput()
          }
        }}
        disabled={!canAfford || isOutOfStock || redeeming === reward.id}
        className={cn(
          "w-full h-10 rounded-btn font-kids text-sm font-bold transition-all",
          canAfford && !isOutOfStock
            ? "bg-candy-blue text-white hover:brightness-110 active:scale-95"
            : "bg-warm-100 text-warm-400 cursor-not-allowed",
          redeeming === reward.id && "animate-pulse"
        )}
      >
        {isOutOfStock
          ? "已售罄"
          : canAfford
          ? `兑换`
          : `还差 ${reward.points - balance}⭐`
        }
      </button>
    </div>
  )
}

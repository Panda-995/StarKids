"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { feedPet, dressPet, createPet } from "@/lib/actions/pets"
import { cn } from "@/lib/utils"
import { SPECIES_EMOJI, SPECIES_LABELS, STAGE_CONFIG, MOOD_EMOJIS } from "@/lib/constants"

type StageInfo = { threshold: number; emoji: string; label: string }
import { useToast } from "@/components/ui/ToastProvider"
import { PageTransition } from "@/components/ui/PageTransition"
import { ProfileSkeleton } from "@/components/ui/Skeleton"

type PetData = {
  id: string
  memberId: string
  species: string
  name: string
  level: number
  stage: string
  mood: number
  currentOutfit: string | null
  lastFeedDate: string | null
}

type OutfitData = {
  id: string
  name: string
  description: string | null
  image: string | null
  species: string | null
  points: number
  isDefault: boolean
}

export default function KidsPetPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [pet, setPet] = useState<PetData | null>(null)
  const [outfits, setOutfits] = useState<OutfitData[]>([])
  const [unlockedIds, setUnlockedIds] = useState<string[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [currentStage, setCurrentStage] = useState("EGG")
  const [stageEmoji, setStageEmoji] = useState("🥚")
  const [speciesEmoji, setSpeciesEmoji] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [feeding, setFeeding] = useState(false)
  const [dressing, setDressing] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showOutfits, setShowOutfits] = useState(false)
  const [evolving, setEvolving] = useState(false)
  const [prevStage, setPrevStage] = useState("")
  const [animatePet, setAnimatePet] = useState(false)

  async function fetchDataRaw() {
    const res = await fetch("/api/kids/pet")
    if (res.ok) {
      const data = await res.json()
      setPet(data.pet)
      setOutfits(data.outfits || [])
      setUnlockedIds(data.unlockedOutfitIds || [])
      setTotalPoints(data.totalPoints || 0)
      setCurrentStage(data.currentStage || "EGG")
      setStageEmoji(data.stageEmoji || "🥚")
      setSpeciesEmoji(data.speciesEmoji)
      return data
    }
    return null
  }

  const fetchData = useCallback(async () => {
    try {
      await fetchDataRaw()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleFeed() {
    setFeeding(true)
    try {
      const oldStage = currentStage
      await feedPet()
      const data = await fetchDataRaw()
      router.refresh()

      const newStage = data?.currentStage || currentStage
      if (newStage !== oldStage) {
        setPrevStage(oldStage)
        setEvolving(true)
        setTimeout(() => setEvolving(false), 3000)
      }

      setAnimatePet(true)
      setTimeout(() => setAnimatePet(false), 600)
    } catch (e: any) {
      toast(e.message || "互动失败", "error")
    } finally {
      setFeeding(false)
    }
  }

  async function handleDress(outfitId: string) {
    setDressing(outfitId)
    try {
      await dressPet(outfitId)
      setAnimatePet(true)
      setTimeout(() => setAnimatePet(false), 800)
      fetchData()
      router.refresh()
    } catch (e: any) {
      toast(e.message || "换装失败", "error")
    } finally {
      setDressing(null)
      setShowOutfits(false)
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      await createPet(formData)
      setShowCreateForm(false)
      fetchData()
      router.refresh()
    } catch (err: any) {
      toast(err.message, "error")
    }
  }

  function getMoodEmoji(mood: number) {
    const thresholds = Object.keys(MOOD_EMOJIS).map(Number).sort((a, b) => b - a)
    for (const t of thresholds) {
      if (mood >= t) return MOOD_EMOJIS[t]
    }
    return "😢"
  }

  function getMoodColor(mood: number) {
    if (mood >= 80) return "bg-candy-green"
    if (mood >= 60) return "bg-brand-500"
    if (mood >= 40) return "bg-candy-orange"
    if (mood >= 20) return "bg-candy-red"
    return "bg-warm-400"
  }

  function getNextStage(): StageInfo | null {
    const stages = Object.entries(STAGE_CONFIG)
    for (const [key, config] of stages) {
      if (totalPoints < config.threshold) return config
    }
    return null
  }

  function getProgressPercent() {
    const nextStage = getNextStage()
    if (!nextStage) return 100
    const currentThreshold = STAGE_CONFIG[currentStage]?.threshold || 0
    const nextThreshold = nextStage.threshold
    const range = nextThreshold - currentThreshold
    return Math.min(100, Math.round(((totalPoints - currentThreshold) / range) * 100))
  }

  const isFedToday = pet?.lastFeedDate
    ? new Date(pet.lastFeedDate).toDateString() === new Date().toDateString()
    : false

  const nextStage = getNextStage()

  if (loading) {
    return (
      <PageTransition className="p-5 space-y-4">
        <h1 className="font-kids text-3xl text-candy-purple pt-4">🐱 我的宠物</h1>
        <ProfileSkeleton />
      </PageTransition>
    )
  }

  if (!pet) {
    return (
      <PageTransition className="p-5 space-y-5">
        <h1 className="font-kids text-3xl text-candy-purple pt-4">🐱 我的宠物</h1>

        {showCreateForm ? (
          <CreatePetForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        ) : (
          <div className="bg-white rounded-card shadow-soft p-8 text-center space-y-6">
            <div className="text-7xl animate-bounce">🥚</div>
            <div>
              <p className="font-kids text-xl text-warm-700 mb-2">你还没有宠物哦！</p>
              <p className="text-sm text-warm-400">选择一只宠物，开始你们的冒险旅程吧！</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="h-12 px-8 bg-gradient-to-r from-candy-purple to-candy-pink text-white font-kids text-lg rounded-btn font-bold hover:brightness-110 transition-all active:scale-95"
            >
              🎉 领养宠物
            </button>
          </div>
        )}
      </PageTransition>
    )
  }

  const jarFillPercent = Math.min(100, Math.round((totalPoints / 2000) * 100))
  const jarHeight = Math.min(100, Math.max(8, jarFillPercent))

  return (
    <PageTransition className="p-5 space-y-5">
      <h1 className="font-kids text-3xl text-candy-purple pt-4">🐱 我的宠物</h1>

      {evolving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="text-center space-y-4 animate-bounce">
            <div className="text-8xl">
              {STAGE_CONFIG[prevStage]?.emoji || "🥚"}
              {" → "}
              {stageEmoji}
            </div>
            <p className="font-kids text-3xl text-white drop-shadow-lg">
              🎉 进化了！🎉
            </p>
            <p className="text-xl text-brand-100">
              {STAGE_CONFIG[prevStage]?.label || "?"} → {STAGE_CONFIG[currentStage]?.label || "?"}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-card shadow-soft p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-kids text-lg text-warm-700">
              {pet?.name || "小宝贝"}
              <span className="text-sm text-warm-400 ml-2 font-normal">
                {SPECIES_LABELS[pet?.species || ""] || pet?.species}
              </span>
            </h2>
            <p className="text-xs text-warm-400 mt-0.5">
              {STAGE_CONFIG[currentStage]?.label || "蛋宝宝"} · {speciesEmoji || "🐱"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl">{getMoodEmoji(pet?.mood || 0)}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-warm-400 mb-1">
            <span>心情</span>
            <span>{pet?.mood || 0}/100</span>
          </div>
          <div className="h-3 bg-warm-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getMoodColor(pet?.mood || 0))}
              style={{ width: `${pet?.mood || 0}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-20 h-28 flex items-center justify-center">
            <div
              className={cn(
                "text-6xl transition-all duration-300 select-none",
                animatePet && "animate-bounce scale-110",
                feeding && "animate-pulse"
              )}
            >
              {stageEmoji}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-warm-400 mb-1">
              <span>成长进度</span>
              <span>
                {totalPoints}⭐
                {nextStage && ` / ${nextStage.threshold}⭐`}
              </span>
            </div>
            <div className="h-4 bg-warm-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-candy-pink via-brand-500 to-candy-green rounded-full transition-all duration-700"
                style={{ width: `${getProgressPercent()}%` }}
              />
            </div>
            {nextStage && (
              <p className="text-xs text-warm-400 mt-1">
                距离{nextStage.label}还差 {nextStage.threshold - totalPoints}⭐
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleFeed}
            disabled={feeding || isFedToday}
            className={cn(
              "flex-1 h-12 rounded-btn font-kids font-bold text-base transition-all active:scale-95",
              isFedToday
                ? "bg-warm-100 text-warm-400 cursor-not-allowed"
                : "bg-gradient-to-r from-candy-orange to-candy-pink text-white hover:brightness-110",
              feeding && "animate-pulse"
            )}
          >
            {isFedToday ? "✅ 今日已互动" : feeding ? "互动中..." : "🤗 互动一下"}
          </button>
          <button
            onClick={() => setShowOutfits(!showOutfits)}
            className="h-12 px-5 rounded-btn font-kids font-bold text-base bg-candy-purple/10 text-candy-purple hover:bg-candy-purple/20 transition-all active:scale-95"
          >
            👗 换装
          </button>
        </div>
      </div>

      <div className="bg-white rounded-card shadow-soft p-5">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-18">
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
                className="transition-all duration-700"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs text-warm-400">累计获得积分</p>
            <p className="font-kids text-2xl text-brand-500">{totalPoints} ⭐</p>
          </div>
        </div>
      </div>

      {showOutfits && (
        <div>
          <h2 className="font-kids text-lg text-warm-700 mb-3">
            👗 宠物装扮
            <button
              onClick={() => setShowOutfits(false)}
              className="ml-2 text-sm text-warm-400 font-normal hover:text-warm-600"
            >
              收起
            </button>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {outfits.map((outfit) => {
              const isUnlocked = unlockedIds.includes(outfit.id) || outfit.isDefault
              const isEquipped = pet?.currentOutfit === outfit.id
              return (
                <div
                  key={outfit.id}
                  className={cn(
                    "rounded-card p-4 text-center space-y-2 transition-all",
                    isUnlocked
                      ? "bg-white shadow-soft hover:scale-105 cursor-pointer"
                      : "bg-warm-50 opacity-60 cursor-not-allowed",
                    isEquipped && "ring-2 ring-candy-purple bg-candy-purple/5"
                  )}
                  onClick={() => {
                    if (isUnlocked && !isEquipped) handleDress(outfit.id)
                  }}
                >
                  <div className="text-3xl">{outfit.image || "👗"}</div>
                  <div>
                    <p className={cn("text-xs font-semibold", isUnlocked ? "text-warm-700" : "text-warm-400")}>
                      {outfit.name}
                      {isEquipped && " ✅"}
                    </p>
                    {!isUnlocked && !outfit.isDefault && (
                      <p className="text-xs text-candy-orange mt-0.5">{outfit.points}⭐ 解锁</p>
                    )}
                    {isUnlocked && isEquipped && (
                      <p className="text-xs text-candy-purple mt-0.5">穿着中</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showCreateForm && (
        <CreatePetForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </PageTransition>
  )
}

function CreatePetForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}) {
  const [selected, setSelected] = useState("CAT")

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-card shadow-soft p-5 space-y-4">
      <h3 className="font-kids text-lg text-warm-700">🎉 选择你的宠物伙伴</h3>

      <div className="grid grid-cols-4 gap-2">
        {Object.entries(SPECIES_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelected(key)}
            className={cn(
              "p-3 rounded-card text-center transition-all",
              selected === key
                ? "bg-candy-purple/10 ring-2 ring-candy-purple scale-105"
                : "bg-warm-50 hover:bg-warm-100"
            )}
          >
            <div className="text-2xl mb-1">{SPECIES_EMOJI[key]}</div>
            <p className="text-xs text-warm-600">{label}</p>
          </button>
        ))}
      </div>

      <input type="hidden" name="species" value={selected} />

      <div>
        <label className="block text-sm font-medium text-warm-600 mb-1">给宠物取个名字</label>
        <input
          name="name"
          required
          defaultValue="小宝贝"
          placeholder="如：小星星"
          className="w-full h-10 px-3 rounded-lg border border-warm-200 text-sm focus:border-candy-purple focus:outline-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 h-11 bg-gradient-to-r from-candy-purple to-candy-pink text-white font-kids rounded-btn font-bold hover:brightness-110 transition-all active:scale-95"
        >
          🎉 领养！
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 bg-warm-100 text-warm-600 rounded-xl font-semibold hover:bg-warm-200 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  )
}

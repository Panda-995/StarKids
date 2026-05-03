import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { STAGE_CONFIG, SPECIES_EMOJI } from "@/lib/constants"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: "No family" }, { status: 404 })

  const [pet, outfits, grants, totalEarned] = await Promise.all([
    prisma.pet.findUnique({ where: { memberId: member.id } }),
    prisma.petOutfit.findMany({
      where: {
        OR: [
          { familyId: member.familyId },
          { familyId: null },
        ],
      },
    }),
    prisma.petOutfitGrant.findMany({
      where: { memberId: member.id },
      select: { outfitId: true },
    }),
    prisma.taskCompletion.aggregate({
      where: { memberId: member.id, status: "APPROVED" },
      _sum: { pointsEarned: true },
    }),
  ])

  const unlockedOutfitIds = new Set(grants.map((g) => g.outfitId))
  const totalPoints = totalEarned._sum.pointsEarned || 0

  let currentStage = "EGG"
  for (const [stage, cfg] of Object.entries(STAGE_CONFIG)) {
    if (totalPoints >= cfg.threshold) currentStage = stage
  }

  return NextResponse.json({
    pet,
    outfits,
    unlockedOutfitIds: Array.from(unlockedOutfitIds),
    totalPoints,
    currentStage,
    stageEmoji: STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG]?.emoji || "🥚",
    speciesEmoji: pet ? SPECIES_EMOJI[pet.species] || "🐱" : null,
  })
}

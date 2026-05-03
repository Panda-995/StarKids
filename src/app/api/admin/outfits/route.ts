import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: "No family" }, { status: 404 })

  const [outfits, familyMembers, grants] = await Promise.all([
    prisma.petOutfit.findMany({
      where: {
        OR: [
          { familyId: member.familyId },
          { familyId: null },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.familyMember.findMany({
      where: { familyId: member.familyId, role: "KID" },
      select: { id: true, nickname: true, pet: { select: { species: true, name: true, currentOutfit: true } } },
    }),
    prisma.petOutfitGrant.findMany({
      where: { member: { familyId: member.familyId } },
      select: { outfitId: true, memberId: true },
    }),
  ])

  const grantMap = new Map<string, Set<string>>()
  for (const g of grants) {
    if (!grantMap.has(g.outfitId)) grantMap.set(g.outfitId, new Set())
    grantMap.get(g.outfitId)!.add(g.memberId)
  }

  const outfitsWithGrants = outfits.map((o) => ({
    id: o.id,
    name: o.name,
    description: o.description,
    image: o.image,
    species: o.species,
    points: o.points,
    isDefault: o.isDefault,
    sortOrder: o.sortOrder,
    isGlobal: o.familyId === null,
    members: familyMembers.map((m) => ({
      memberId: m.id,
      nickname: m.nickname,
      petName: m.pet?.name || null,
      petSpecies: m.pet?.species || null,
      isEquipped: m.pet?.currentOutfit === o.id,
      isGranted: grantMap.get(o.id)?.has(m.id) || false,
    })),
  }))

  return NextResponse.json({
    outfits: outfitsWithGrants,
    members: familyMembers.map((m) => ({
      id: m.id,
      nickname: m.nickname,
    })),
  })
}

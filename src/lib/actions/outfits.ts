"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { PetSpecies } from "@prisma/client"

export async function createOutfit(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!member) throw new Error("你还未加入家庭")

  const species = formData.get("species") as string

  await prisma.petOutfit.create({
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      image: (formData.get("image") as string) || "👗",
      species: (species && species !== "ALL" ? species : null) as PetSpecies | null,
      points: parseInt(formData.get("points") as string) || 0,
      isDefault: formData.get("isDefault") === "true",
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
      familyId: member.familyId,
    },
  })

  revalidatePath("/admin/pets")
}

export async function updateOutfit(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const id = formData.get("id") as string
  if (!id) throw new Error("缺少装扮ID")

  const species = formData.get("species") as string

  await prisma.petOutfit.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      image: (formData.get("image") as string) || "👗",
      species: (species && species !== "ALL" ? species : null) as any,
      points: parseInt(formData.get("points") as string) || 0,
      isDefault: formData.get("isDefault") === "true",
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
    } as any,
  })

  revalidatePath("/admin/pets")
}

export async function deleteOutfit(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  await prisma.petOutfit.delete({ where: { id } })
  revalidatePath("/admin/pets")
}

export async function unlockOutfit(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!member) throw new Error("你还未加入家庭")

  const outfitId = formData.get("outfitId") as string
  const kidMemberId = formData.get("memberId") as string

  await prisma.$transaction(async (tx) => {
    const existing = await tx.petOutfitGrant.findUnique({
      where: { outfitId_memberId: { outfitId, memberId: kidMemberId } },
    })
    if (existing) throw new Error("该装扮已解锁")

    const outfit = await tx.petOutfit.findUnique({ where: { id: outfitId } })
    if (!outfit) throw new Error("装扮不存在")

    await tx.petOutfitGrant.create({
      data: {
        outfitId,
        memberId: kidMemberId,
        pointsSpent: outfit.points,
      },
    })

    if (outfit.points > 0) {
      await tx.familyMember.update({
        where: { id: kidMemberId },
        data: { currentPoints: { decrement: outfit.points } },
      })
    }
  })

  revalidatePath("/admin/pets")
}

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id, role: "PARENT" },
  })
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let config = await prisma.pointConfig.findFirst({
    where: { familyId: member.familyId },
  })

  if (!config) {
    config = await prisma.pointConfig.create({
      data: {
        familyId: member.familyId,
        weekendDouble: true,
        birthdayTriple: true,
        dailyCap: 0,
        resetType: "NONE",
      },
    })
  }

  return NextResponse.json(config)
  } catch (e) {
    console.error("GET /api/points/config error:", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await prisma.familyMember.findFirst({
    where: { userId: session.user.id, role: "PARENT" },
  })
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const formData = await request.formData()

  const config = await prisma.pointConfig.upsert({
    where: { familyId: member.familyId },
    create: {
      familyId: member.familyId,
      weekendDouble: formData.get("weekendDouble") === "true",
      birthdayTriple: formData.get("birthdayTriple") === "true",
      dailyCap: parseInt(formData.get("dailyCap") as string) || 0,
      resetType: (formData.get("resetType") as string) || "NONE",
    },
    update: {
      weekendDouble: formData.get("weekendDouble") === "true",
      birthdayTriple: formData.get("birthdayTriple") === "true",
      dailyCap: parseInt(formData.get("dailyCap") as string) || 0,
      resetType: (formData.get("resetType") as string) || "NONE",
    },
  })

  return NextResponse.json(config)
  } catch (e) {
    console.error("POST /api/points/config error:", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

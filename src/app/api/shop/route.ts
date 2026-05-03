import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.familyMember.findFirst({
      where: { userId: session.user.id },
    })
    if (!member) {
      return NextResponse.json({ error: "No family" }, { status: 404 })
    }

    const [rewards, pendingRedemptions] = await Promise.all([
      prisma.reward.findMany({
        where: { familyId: member.familyId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.rewardRedemption.findMany({
        where: {
          reward: { familyId: member.familyId },
          status: "PENDING",
        },
        include: {
          reward: { select: { name: true, points: true } },
          member: { select: { nickname: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ])

    return NextResponse.json({ rewards, pendingRedemptions })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.familyMember.findFirst({
      where: { userId: session.user.id },
    })
    if (!member || member.role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const reward = await prisma.reward.create({
      data: {
        familyId: member.familyId,
        name: body.name,
        description: body.description || null,
        points: body.points || 0,
        category: body.category || "OTHER",
        isFeatured: body.isFeatured || false,
        stock: body.stock || 0,
        remainingStock: body.stock || 0,
        maxPerPerson: body.maxPerPerson || 0,
        cooldownDays: body.cooldownDays || 0,
        status: "ACTIVE",
      },
    })

    return NextResponse.json({ reward }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import type { MemberRole } from "@prisma/client"

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function createFamily(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const name = formData.get("name") as string
  const nickname = formData.get("nickname") as string

  if (!name || name.trim().length < 2) throw new Error("家庭名称至少2个字符")
  if (!nickname || nickname.trim().length < 2) throw new Error("昵称至少2个字符")

  let inviteCode = generateInviteCode()
  let existing = await prisma.family.findUnique({ where: { inviteCode } })
  let attempts = 0
  while (existing && attempts < 10) {
    inviteCode = generateInviteCode()
    existing = await prisma.family.findUnique({ where: { inviteCode } })
    attempts++
  }

  const family = await prisma.family.create({
    data: {
      name: name.trim(),
      inviteCode,
      members: {
        create: {
          userId: session.user.id,
          role: "PARENT",
          nickname: nickname.trim(),
        },
      },
    },
  })

  await prisma.pointConfig.create({
    data: {
      familyId: family.id,
      weekendDouble: true,
      birthdayTriple: true,
      dailyCap: 200,
    },
  })

  revalidatePath("/admin")
  redirect("/admin")
}

export async function joinFamily(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const inviteCode = (formData.get("inviteCode") as string).trim().toUpperCase()
  const nickname = formData.get("nickname") as string
  const role = formData.get("role") as string

  if (!inviteCode || inviteCode.length < 5) throw new Error("请输入有效的邀请码")
  if (!nickname || nickname.trim().length < 2) throw new Error("昵称至少2个字符")

  const family = await prisma.family.findUnique({
    where: { inviteCode },
  })

  if (!family) throw new Error("邀请码无效，请检查后重试")

  const existingMember = await prisma.familyMember.findFirst({
    where: { familyId: family.id, userId: session.user.id },
  })

  if (existingMember) throw new Error("你已经是这个家庭的成员了")

  await prisma.familyMember.create({
    data: {
      familyId: family.id,
      userId: session.user.id,
      role: (role === "KID" ? "KID" : "PARENT") as MemberRole,
      nickname: nickname.trim(),
    },
  })

  revalidatePath(role === "KID" ? "/kids" : "/admin")
  redirect(role === "KID" ? "/kids" : "/admin")
}

export async function addKidToFamily(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("请先登录")

  const currentMember = await prisma.familyMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!currentMember || currentMember.role !== "PARENT") {
    throw new Error("只有家长可以添加小朋友")
  }

  const nickname = (formData.get("nickname") as string).trim()
  const email = (formData.get("email") as string).trim()
  const password = (formData.get("password") as string).trim()

  if (!nickname || nickname.length < 2) throw new Error("昵称至少2个字符")
  if (!email) throw new Error("请输入小朋友的邮箱")
  if (!password || password.length < 6) throw new Error("密码至少6位")

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) throw new Error("该邮箱已被注册")

  const hash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      name: nickname,
      passwordHash: hash,
      role: "KID" as MemberRole,
    },
  })

  await prisma.familyMember.create({
    data: {
      familyId: currentMember.familyId,
      userId: user.id,
      role: "KID" as MemberRole,
      nickname,
    },
  })

  revalidatePath("/admin/family")
  return { success: true, kidNickname: nickname }
}
